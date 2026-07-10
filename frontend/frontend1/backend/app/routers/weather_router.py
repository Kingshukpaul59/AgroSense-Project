"""
backend/app/routers/weather_router.py

FastAPI router for weather endpoints.
Mount in main.py: app.include_router(weather_router, prefix="/api/v1")
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.weather_service import (
    WeatherService,
    WeatherResponse,
    AgroIndices,
    DISTRICT_COORDS,
)
from app.core.dependencies import get_weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get(
    "/forecast",
    response_model=WeatherResponse,
    summary="7-day weather forecast for a district",
    description="""
    Returns 7-day daily forecast including temperature, rainfall, wind,
    humidity, and evapotranspiration for any supported Maharashtra district.
    Results are cached for 1 hour. Data source: OpenMeteo (free, no key).
    """,
)
async def get_forecast(
    district: str = Query(..., example="Pune", description="District name"),
    svc: WeatherService = Depends(get_weather_service),
) -> WeatherResponse:
    try:
        return await svc.get_forecast(district)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get(
    "/indices",
    response_model=AgroIndices,
    summary="Agro-meteorological indices for a district",
    description="""
    Returns computed agro-met indices:
    - Evapotranspiration (mm/day)
    - Estimated soil moisture (%)
    - Accumulated growing degree days (GDD)
    - Pest risk index (0–100 composite score)
    """,
)
async def get_indices(
    district: str = Query(..., example="Nashik"),
    svc: WeatherService = Depends(get_weather_service),
) -> AgroIndices:
    try:
        return await svc.get_indices(district)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/districts",
    summary="List all supported districts with coordinates",
)
async def list_districts() -> dict:
    return {
        "districts": [
            {"name": name, "latitude": lat, "longitude": lon}
            for name, (lat, lon) in DISTRICT_COORDS.items()
        ],
        "total": len(DISTRICT_COORDS),
    }


@router.get(
    "/all",
    summary="Weather summary for all districts (dashboard heatmap)",
    description="Fetches weather for all districts in parallel. Heavier endpoint — cached aggressively.",
)
async def get_all_districts(
    svc: WeatherService = Depends(get_weather_service),
) -> dict:
    results = await svc.get_all_districts()
    return {
        "districts": [
            {
                "district":            r.district,
                "latitude":            r.latitude,
                "longitude":           r.longitude,
                "today_high":          r.forecast[0].high_c if r.forecast else None,
                "today_rain_mm":       r.forecast[0].rain_mm if r.forecast else None,
                "pest_risk_index":     r.indices.pest_risk_index,
                "soil_moisture_pct":   r.indices.soil_moisture_pct,
                "evapotranspiration":  r.indices.evapotranspiration,
            }
            for r in results
        ],
        "fetched_count": len(results),
    }