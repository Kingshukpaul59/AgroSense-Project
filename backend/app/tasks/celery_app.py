"""
backend/app/tasks/celery_app.py

Celery application + all background tasks for AgroSense.

Start worker:
    celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4

Start beat scheduler (periodic tasks):
    celery -A app.tasks.celery_app beat --loglevel=info

Both in one process (dev only):
    celery -A app.tasks.celery_app worker --beat --loglevel=info
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
import ml

from celery import Celery
from celery.schedules import crontab
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

# ── App setup ───────────────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "agrosense",
    broker    = REDIS_URL,
    backend   = REDIS_URL,
    include   = ["app.tasks.celery_app"],
)

celery_app.conf.update(
    task_serializer          = "json",
    accept_content           = ["json"],
    result_serializer        = "json",
    timezone                 = "Asia/Kolkata",
    enable_utc               = True,
    task_track_started       = True,
    task_acks_late           = True,               # re-queue if worker dies
    worker_prefetch_multiplier = 1,                # fair scheduling for ML tasks
    result_expires           = 3600,               # keep results 1 hour
)

# ── Periodic schedule (Celery Beat) ─────────────────────────────────────────
celery_app.conf.beat_schedule = {
    # Weather refresh every 6 hours
    "refresh-weather-all-districts": {
        "task":     "app.tasks.celery_app.refresh_all_weather",
        "schedule": crontab(minute=0, hour="0,6,12,18"),
        "options":  {"queue": "data"},
    },
    # Mandi prices refresh once daily at 8 AM IST
    "refresh-mandi-prices": {
        "task":     "app.tasks.celery_app.refresh_mandi_prices",
        "schedule": crontab(minute=0, hour=8),
        "options":  {"queue": "data"},
    },
    # NDVI data refresh twice a week
    "refresh-ndvi": {
        "task":     "app.tasks.celery_app.refresh_ndvi_all",
        "schedule": crontab(minute=0, hour=6, day_of_week="1,4"),  # Mon, Thu
        "options":  {"queue": "ml"},
    },
    # Advisory generation every morning at 6 AM
    "generate-advisories": {
        "task":     "app.tasks.celery_app.generate_all_advisories",
        "schedule": crontab(minute=0, hour=6),
        "options":  {"queue": "ml"},
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# Task: Yield Prediction
# ═══════════════════════════════════════════════════════════════════════════

@celery_app.task(
    bind=True,
    name="app.tasks.celery_app.run_yield_prediction",
    max_retries=3,
    default_retry_delay=30,
    queue="ml",
)
def run_yield_prediction(
    self,
    district: str,
    crop: str,
    season: str,
    area_ha: float = 1.0,
    irrigation: str = "Rainfed",
    soil_type: str = "Black cotton",
) -> dict:
    """
    Async XGBoost yield prediction task.

    Called by:
        result = run_yield_prediction.delay("Pune", "Paddy (Rice)", "Kharif 2024")
        result.get(timeout=30)      # blocking wait
    """
    logger.info("Yield prediction: %s / %s / %s", district, crop, season)

    try:
        from app.ml.yield_model import YieldPredictor
        predictor = YieldPredictor()
        result    = predictor.predict({
            "district":   district,
            "crop":       crop,
            "season":     season,
            "area_ha":    area_ha,
            "irrigation": irrigation,
            "soil_type":  soil_type,
        })
        logger.info("Prediction complete: %.2f t/ha", result["predicted_yield"])
        return result

    except Exception as exc:
        logger.error("Yield prediction failed: %s", exc)
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════════════════
# Task: LSTM Demand Forecast
# ═══════════════════════════════════════════════════════════════════════════

@celery_app.task(
    bind=True,
    name="app.tasks.celery_app.run_demand_forecast",
    max_retries=2,
    queue="ml",
)
def run_demand_forecast(self, crop: str, district: str = "all", months: int = 6) -> dict:
    """
    Run LSTM demand forecast for a crop+district combination.
    Result cached in Redis by the service layer.
    """
    logger.info("Demand forecast: %s / %s / %d months", crop, district, months)

    try:
        from app.ml.demand_model import DemandForecaster
        forecaster = DemandForecaster()
        return forecaster.forecast(crop=crop, district=district, months=months)

    except Exception as exc:
        logger.error("Demand forecast failed: %s", exc)
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════════════════
# Task: Weather Refresh (periodic)
# ═══════════════════════════════════════════════════════════════════════════

@celery_app.task(
    name="app.tasks.celery_app.refresh_all_weather",
    queue="data",
)
def refresh_all_weather() -> dict:
    """
    Refresh weather cache for all 16 districts.
    Triggered every 6 hours by Celery Beat.
    """
    import asyncio
    from app.services.weather_service import WeatherService, DISTRICT_COORDS
    from app.core.redis import get_sync_redis

    logger.info("Refreshing weather for %d districts", len(DISTRICT_COORDS))
    redis = get_sync_redis()
    svc   = WeatherService(redis_client=redis)

    refreshed, failed = 0, 0
    for district in DISTRICT_COORDS:
        try:
            # Invalidate stale cache, then re-fetch
            redis.delete(f"weather:{district}")
            asyncio.run(svc.get_forecast(district))
            refreshed += 1
            logger.debug("Weather refreshed: %s", district)
        except Exception as e:
            failed += 1
            logger.warning("Weather refresh failed for %s: %s", district, e)

    return {"refreshed": refreshed, "failed": failed, "timestamp": datetime.utcnow().isoformat()}


# ═══════════════════════════════════════════════════════════════════════════
# Task: Mandi Price Refresh (periodic)
# ═══════════════════════════════════════════════════════════════════════════

@celery_app.task(
    name="app.tasks.celery_app.refresh_mandi_prices",
    queue="data",
)
def refresh_mandi_prices() -> dict:
    """
    Refresh mandi price cache for key crops × states.
    Triggered once daily at 8 AM.
    """
    import asyncio
    from app.services.mandi_service import MandiService
    from app.core.redis import get_sync_redis

    KEY_CROPS  = ["paddy", "wheat", "soybean", "cotton", "maize", "onion"]
    KEY_STATES = ["maharashtra", "punjab", "karnataka", "telangana"]

    api_key = os.getenv("DATA_GOV_API_KEY", "")
    if not api_key:
        logger.warning("DATA_GOV_API_KEY not set — skipping mandi refresh")
        return {"skipped": True, "reason": "no_api_key"}

    redis = get_sync_redis()
    svc   = MandiService(api_key=api_key, redis_client=redis)

    refreshed, failed = 0, 0
    for crop in KEY_CROPS:
        for state in KEY_STATES:
            try:
                asyncio.run(svc.get_prices(crop, state))
                refreshed += 1
            except Exception as e:
                failed += 1
                logger.warning("Mandi refresh failed %s/%s: %s", crop, state, e)

    return {"refreshed": refreshed, "failed": failed, "timestamp": datetime.utcnow().isoformat()}


# ═══════════════════════════════════════════════════════════════════════════
# Task: NDVI Refresh (via Google Earth Engine)
# ═══════════════════════════════════════════════════════════════════════════

@celery_app.task(
    name="app.tasks.celery_app.refresh_ndvi_all",
    queue="data",
    time_limit=300,    # GEE can be slow — allow 5 min
)
def refresh_ndvi_all() -> dict:
    """
    Fetch latest NDVI values from Google Earth Engine for all districts.
    Requires GEE service account credentials in GEE_CREDENTIALS_PATH env var.
    """
    credentials_path = os.getenv("GEE_CREDENTIALS_PATH")
    if not credentials_path:
        logger.info("GEE_CREDENTIALS_PATH not set — skipping NDVI refresh")
        return {"skipped": True, "reason": "no_gee_credentials"}

    try:
        import ee
        ee.Initialize(ee.ServiceAccountCredentials(
            os.getenv("GEE_SERVICE_ACCOUNT", ""),
            credentials_path,
        ))

        from app.services.ndvi_service import fetch_ndvi_for_all_districts
        results = fetch_ndvi_for_all_districts()
        logger.info("NDVI refreshed for %d districts", len(results))
        return {"refreshed": len(results), "timestamp": datetime.utcnow().isoformat()}

    except ImportError:
        logger.warning("earthengine-api not installed — skipping NDVI")
        return {"skipped": True, "reason": "earthengine_not_installed"}
    except Exception as e:
        logger.error("NDVI refresh failed: %s", e)
        return {"failed": True, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# Task: Advisory Generation
# ═══════════════════════════════════════════════════════════════════════════

@celery_app.task(
    name="app.tasks.celery_app.generate_all_advisories",
    queue="ml",
)
def generate_all_advisories() -> dict:
    """
    Generate AI advisories for all districts based on:
    - Latest weather forecast
    - Current crop stage
    - Soil health data
    - Pest risk index
    Runs every morning at 6 AM.
    """
    logger.info("Generating advisories for all districts")
    try:
        from app.services.advisory_service import AdvisoryEngine
        engine  = AdvisoryEngine()
        results = engine.generate_all()
        logger.info("Generated %d advisories", len(results))
        return {"generated": len(results), "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error("Advisory generation failed: %s", e)
        return {"failed": True, "error": str(e)}


@celery_app.task(
    bind=True,
    name="app.tasks.celery_app.generate_advisory_for_farmer",
    queue="ml",
    max_retries=2,
)
def generate_advisory_for_farmer(self, farmer_id: str) -> dict:
    """
    Generate personalised advisory for a single farmer on-demand.
    Called when a farmer opens the app or requests a refresh.
    """
    logger.info("Generating advisory for farmer: %s", farmer_id)
    try:
        from app.services.advisory_service import AdvisoryEngine
        engine = AdvisoryEngine()
        return engine.generate_for_farmer(farmer_id)
    except Exception as exc:
        raise self.retry(exc=exc)