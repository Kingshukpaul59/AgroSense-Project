"""
backend/app/services/weather_service.py

OpenMeteo weather service — free, no API key required.
Provides 7-day forecast, historical data, and agro-met indices.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx
import redis.asyncio as aioredis
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────
OPENMETEO_URL  = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_SECS = 3600          # 1 hour — weather doesn't change faster
DISTRICT_COORDS: dict[str, tuple[float, float]] = {
    "Pune":        (18.5204, 73.8567),
    "Nashik":      (19.9975, 73.7898),
    "Aurangabad":  (19.8762, 75.3433),
    "Kolhapur":    (16.6938, 74.2370),
    "Latur":       (18.4088, 76.5604),
    "Satara":      (17.6805, 73.9947),
    "Solapur":     (17.6854, 75.9064),
    "Osmanabad":   (18.1860, 76.0427),
    "Amravati":    (20.9320, 77.7523),
    "Nagpur":      (21.1458, 79.0882),
    "Akola":       (20.7096, 77.0020),
    "Jalgaon":     (21.0077, 75.5626),
    "Sangli":      (16.8524, 74.5815),
    "Ratnagiri":   (16.9944, 73.3002),
    "Dhule":       (20.9020, 74.7748),
    "Nanded":      (19.1383, 77.3210),
}


# ── Pydantic Schemas ────────────────────────────────────────────────────────

class DayForecast(BaseModel):
    date:           str
    day:            str                        # "Mon", "Tue" …
    icon:           str                        # emoji
    condition:      str
    high_c:         float
    low_c:          float
    rain_mm:        float
    humidity_pct:   float
    wind_kph:       float
    et0_mm:         float                      # Evapotranspiration


class AgroIndices(BaseModel):
    evapotranspiration: float                  # mm/day (7-day avg)
    soil_moisture_pct:  float                  # estimated from ET + rain
    gdd_accumulated:    float                  # growing degree days since season start
    pest_risk_index:    int                    # 0–100 composite


class WeatherResponse(BaseModel):
    district:    str
    latitude:    float
    longitude:   float
    forecast:    list[DayForecast]
    indices:     AgroIndices
    fetched_at:  str


# ── Helper: condition & icon from WMO weather code ─────────────────────────

_WMO_MAP: dict[int, tuple[str, str]] = {
    0:  ("Clear sky",       "☀"),
    1:  ("Mainly clear",    "🌤"),
    2:  ("Partly cloudy",   "⛅"),
    3:  ("Overcast",        "☁"),
    45: ("Fog",             "🌫"),
    48: ("Icy fog",         "🌫"),
    51: ("Light drizzle",   "🌦"),
    53: ("Drizzle",         "🌦"),
    55: ("Heavy drizzle",   "🌧"),
    61: ("Light rain",      "🌧"),
    63: ("Rain",            "🌧"),
    65: ("Heavy rain",      "🌧"),
    71: ("Light snow",      "🌨"),
    73: ("Snow",            "❄"),
    75: ("Heavy snow",      "❄"),
    80: ("Light showers",   "🌦"),
    81: ("Showers",         "🌧"),
    82: ("Heavy showers",   "⛈"),
    95: ("Thunderstorm",    "🌩"),
    96: ("Thunderstorm",    "⛈"),
    99: ("Severe storm",    "⛈"),
}

def _wmo(code: int) -> tuple[str, str]:
    """Return (condition_label, emoji) for a WMO weather code."""
    return _WMO_MAP.get(code, ("Unknown", "🌡"))


_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def _day_name(date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return _DAYS[dt.weekday()]


# ── Pest risk composite ────────────────────────────────────────────────────

def _pest_risk(forecasts: list[dict]) -> int:
    """
    Simple pest-risk heuristic based on temperature + humidity + rainfall.
    Returns 0–100 integer.
    """
    score = 0
    for f in forecasts[:5]:                    # look at 5-day window
        t  = f["high_c"]
        rh = f["humidity_pct"]
        r  = f["rain_mm"]
        if 22 <= t <= 32:                      # optimal insect range
            score += 15
        if rh > 75:                            # high humidity → fungal risk
            score += 10
        if r > 10:                             # wet conditions
            score += 8
    return min(score, 100)


# ── Core fetch ─────────────────────────────────────────────────────────────

async def _fetch_openmeteo(lat: float, lon: float) -> dict[str, Any]:
    """
    Fetch 7-day forecast from OpenMeteo.
    Returns raw JSON response dict.
    """
    params = {
        "latitude":              lat,
        "longitude":             lon,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "et0_fao_evapotranspiration",
            "weathercode",
            "windspeed_10m_max",
            "relative_humidity_2m_max",
        ],
        "timezone":              "Asia/Kolkata",
        "forecast_days":         7,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(OPENMETEO_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def _parse_response(raw: dict, district: str, lat: float, lon: float) -> WeatherResponse:
    """Parse OpenMeteo JSON into WeatherResponse."""
    daily    = raw["daily"]
    dates    = daily["time"]
    highs    = daily["temperature_2m_max"]
    lows     = daily["temperature_2m_min"]
    rains    = daily["precipitation_sum"]
    et0s     = daily["et0_fao_evapotranspiration"]
    codes    = daily["weathercode"]
    winds    = daily["windspeed_10m_max"]
    humidity = daily["relative_humidity_2m_max"]

    forecasts: list[DayForecast] = []
    for i, date in enumerate(dates):
        condition, icon = _wmo(codes[i])
        forecasts.append(DayForecast(
            date         = date,
            day          = _day_name(date),
            icon         = icon,
            condition    = condition,
            high_c       = round(highs[i], 1),
            low_c        = round(lows[i], 1),
            rain_mm      = round(rains[i] or 0, 1),
            humidity_pct = round(humidity[i] or 60, 1),
            wind_kph     = round(winds[i] or 0, 1),
            et0_mm       = round(et0s[i] or 0, 2),
        ))

    # ── Agro-met indices ──────────────────────────────────────────────────
    avg_et0         = sum(f.et0_mm for f in forecasts) / len(forecasts)
    total_rain_5d   = sum(f.rain_mm for f in forecasts[:5])
    soil_moist_est  = min(max(30 + total_rain_5d * 0.4 - avg_et0 * 2.5, 10), 80)

    # GDD accumulated — estimate assuming season start on March 1
    season_start    = datetime(datetime.now().year, 3, 1)
    days_elapsed    = (datetime.now() - season_start).days
    avg_temp        = sum((f.high_c + f.low_c) / 2 for f in forecasts) / len(forecasts)
    gdd_daily       = max(avg_temp - 10, 0)   # base temp 10°C
    gdd_accumulated = round(gdd_daily * days_elapsed, 1)

    indices = AgroIndices(
        evapotranspiration = round(avg_et0, 2),
        soil_moisture_pct  = round(soil_moist_est, 1),
        gdd_accumulated    = gdd_accumulated,
        pest_risk_index    = _pest_risk([f.model_dump() for f in forecasts]),
    )

    return WeatherResponse(
        district   = district,
        latitude   = lat,
        longitude  = lon,
        forecast   = forecasts,
        indices    = indices,
        fetched_at = datetime.utcnow().isoformat() + "Z",
    )


# ── Public API ──────────────────────────────────────────────────────────────

class WeatherService:
    """
    Async weather service with Redis cache.

    Usage:
        svc = WeatherService(redis_client)
        data = await svc.get_forecast("Pune")
    """

    def __init__(self, redis_client: aioredis.Redis | None = None):
        self.redis = redis_client

    async def get_forecast(self, district: str) -> WeatherResponse:
        """
        Return 7-day forecast for a district.
        Hits Redis cache first; falls back to OpenMeteo.
        """
        district = district.strip().title()
        cache_key = f"weather:{district}"

        # ── Try cache ─────────────────────────────────────────────────────
        if self.redis:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    return WeatherResponse.model_validate_json(cached)
            except Exception as e:
                logger.warning("Redis read failed: %s", e)

        # ── Resolve coordinates ───────────────────────────────────────────
        if district not in DISTRICT_COORDS:
            raise ValueError(
                f"District '{district}' not found. "
                f"Available: {sorted(DISTRICT_COORDS)}"
            )
        lat, lon = DISTRICT_COORDS[district]

        # ── Fetch from OpenMeteo ──────────────────────────────────────────
        try:
            raw  = await _fetch_openmeteo(lat, lon)
            data = _parse_response(raw, district, lat, lon)
        except httpx.HTTPError as e:
            logger.error("OpenMeteo request failed: %s", e)
            raise RuntimeError(f"Weather fetch failed: {e}") from e

        # ── Write cache ───────────────────────────────────────────────────
        if self.redis:
            try:
                await self.redis.setex(
                    cache_key,
                    CACHE_TTL_SECS,
                    data.model_dump_json(),
                )
            except Exception as e:
                logger.warning("Redis write failed: %s", e)

        return data

    async def get_indices(self, district: str) -> AgroIndices:
        """Return just the agro-met indices (subset of full forecast)."""
        resp = await self.get_forecast(district)
        return resp.indices

    async def get_all_districts(self) -> list[WeatherResponse]:
        """Bulk-fetch all districts in parallel (for dashboard heatmap)."""
        import asyncio
        tasks = [self.get_forecast(d) for d in DISTRICT_COORDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, WeatherResponse)]