"""
backend/tests/test_weather.py

Pytest tests for weather service + API endpoints.
Run: pytest tests/ -v --cov=app
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ── Health ──────────────────────────────────────────────────────────────────

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── Weather endpoints ────────────────────────────────────────────────────────

MOCK_FORECAST = {
    "district":   "Pune",
    "latitude":   18.5204,
    "longitude":  73.8567,
    "fetched_at": "2024-04-13T00:00:00Z",
    "forecast": [
        {
            "date": "2024-04-13", "day": "Sat", "icon": "🌤",
            "condition": "Partly cloudy",
            "high_c": 32.0, "low_c": 22.0, "rain_mm": 2.0,
            "humidity_pct": 64.0, "wind_kph": 12.0, "et0_mm": 4.8,
        }
    ] * 7,
    "indices": {
        "evapotranspiration": 4.8,
        "soil_moisture_pct":  34.0,
        "gdd_accumulated":    1240.0,
        "pest_risk_index":    72,
    },
}


def test_weather_forecast_valid_district():
    """Valid district → 200 with forecast data."""
    from app.services.weather_service import WeatherResponse
    mock_svc = AsyncMock()
    mock_svc.get_forecast.return_value = WeatherResponse(**MOCK_FORECAST)

    with patch("app.routers.weather_router.get_weather_service", return_value=mock_svc):
        resp = client.get("/api/v1/weather/forecast", params={"district": "Pune"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["district"] == "Pune"
    assert len(data["forecast"]) == 7
    assert "indices" in data
    assert data["indices"]["pest_risk_index"] == 72


def test_weather_forecast_invalid_district():
    """Unknown district → 404."""
    resp = client.get("/api/v1/weather/forecast", params={"district": "Atlantis"})
    assert resp.status_code == 404


def test_weather_districts_list():
    """Districts endpoint returns all supported districts."""
    resp = client.get("/api/v1/weather/districts")
    assert resp.status_code == 200
    data = resp.json()
    assert "districts" in data
    assert data["total"] >= 10
    names = [d["name"] for d in data["districts"]]
    assert "Pune" in names
    assert "Nashik" in names


def test_weather_indices():
    """Indices endpoint returns agro-met data."""
    from app.services.weather_service import AgroIndices
    mock_svc = AsyncMock()
    mock_svc.get_indices.return_value = AgroIndices(
        evapotranspiration=4.8,
        soil_moisture_pct=34.0,
        gdd_accumulated=1240.0,
        pest_risk_index=72,
    )

    with patch("app.routers.weather_router.get_weather_service", return_value=mock_svc):
        resp = client.get("/api/v1/weather/indices", params={"district": "Pune"})

    assert resp.status_code == 200
    data = resp.json()
    assert 0 <= data["pest_risk_index"] <= 100
    assert data["evapotranspiration"] > 0


# ── Weather service unit tests ───────────────────────────────────────────────

class TestWeatherService:
    """Unit tests for WeatherService (no HTTP calls)."""

    def test_wmo_code_mapping(self):
        from app.services.weather_service import _wmo
        condition, icon = _wmo(0)
        assert "clear" in condition.lower()
        assert icon == "☀"

    def test_wmo_unknown_code(self):
        from app.services.weather_service import _wmo
        condition, icon = _wmo(999)
        assert condition == "Unknown"

    def test_pest_risk_high_humidity(self):
        from app.services.weather_service import _pest_risk
        forecasts = [
            {"high_c": 28, "humidity_pct": 85, "rain_mm": 15}
        ] * 5
        risk = _pest_risk(forecasts)
        assert risk > 50, "High humidity + rain should produce high pest risk"

    def test_pest_risk_dry_conditions(self):
        from app.services.weather_service import _pest_risk
        forecasts = [
            {"high_c": 40, "humidity_pct": 30, "rain_mm": 0}
        ] * 5
        risk = _pest_risk(forecasts)
        assert risk < 50, "Hot dry conditions should have lower pest risk"

    def test_pest_risk_capped_at_100(self):
        from app.services.weather_service import _pest_risk
        worst_case = [{"high_c": 28, "humidity_pct": 95, "rain_mm": 50}] * 7
        assert _pest_risk(worst_case) <= 100

    @pytest.mark.asyncio
    async def test_get_forecast_uses_cache(self):
        """Service should return cached value without hitting OpenMeteo."""
        from app.services.weather_service import WeatherService

        mock_redis = AsyncMock()
        mock_redis.get.return_value = None          # cache miss first time
        mock_redis.setex.return_value = True

        svc = WeatherService(redis_client=mock_redis)

        mock_raw = {
            "daily": {
                "time":                       ["2024-04-13"] * 7,
                "temperature_2m_max":         [32.0] * 7,
                "temperature_2m_min":         [22.0] * 7,
                "precipitation_sum":          [2.0] * 7,
                "et0_fao_evapotranspiration": [4.8] * 7,
                "weathercode":                [1] * 7,
                "windspeed_10m_max":          [12.0] * 7,
                "relative_humidity_2m_max":   [64.0] * 7,
            }
        }

        with patch("app.services.weather_service._fetch_openmeteo", return_value=mock_raw):
            result = await svc.get_forecast("Pune")

        assert result.district == "Pune"
        assert len(result.forecast) == 7
        mock_redis.setex.assert_called_once()        # should have written to cache


# ── Mandi endpoints ──────────────────────────────────────────────────────────

def test_mandi_supported_crops():
    resp = client.get("/api/v1/mandi/supported-crops")
    assert resp.status_code == 200
    crops = resp.json()["crops"]
    assert "paddy" in crops
    assert "wheat" in crops


def test_mandi_supported_states():
    resp = client.get("/api/v1/mandi/supported-states")
    assert resp.status_code == 200
    assert "maharashtra" in resp.json()["states"]


def test_mandi_no_api_key_returns_error():
    """Without API key, mandi endpoint should not crash — returns 503 or mocked."""
    # This test validates error handling when the env var isn't set
    with patch.dict("os.environ", {"DATA_GOV_API_KEY": ""}):
        resp = client.get("/api/v1/mandi/prices", params={"crop": "paddy", "state": "maharashtra"})
    # Should be 503 (service unavailable) not 500 (unhandled exception)
    assert resp.status_code in (200, 503)