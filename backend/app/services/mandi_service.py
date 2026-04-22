"""
backend/app/services/mandi_service.py

AGMARKNET mandi price service via data.gov.in open API.
Get your free API key at: https://data.gov.in/user/register
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

import httpx
import redis.asyncio as aioredis
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────────
AGMARKNET_RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070"
DATA_GOV_BASE      = "https://api.data.gov.in/resource"
CACHE_TTL_SECS     = 21_600          # 6 hours — mandi data updates daily

# Crop name aliases — AGMARKNET uses specific spellings
CROP_ALIASES: dict[str, str] = {
    "paddy":     "Paddy(Dhan)(Common)",
    "rice":      "Paddy(Dhan)(Common)",
    "wheat":     "Wheat",
    "soybean":   "Soyabean",
    "cotton":    "Cotton",
    "sugarcane": "Sugarcane",
    "maize":     "Maize",
    "onion":     "Onion",
    "tomato":    "Tomato",
    "potato":    "Potato",
}

STATE_ALIASES: dict[str, str] = {
    "maharashtra": "Maharashtra",
    "punjab":      "Punjab",
    "karnataka":   "Karnataka",
    "andhra":      "Andhra Pradesh",
    "telangana":   "Telangana",
    "gujarat":     "Gujarat",
    "mp":          "Madhya Pradesh",
    "rajasthan":   "Rajasthan",
}


# ── Pydantic Schemas ────────────────────────────────────────────────────────

class MandiRecord(BaseModel):
    state:          str
    district:       str
    market:         str
    commodity:      str
    variety:        str
    arrival_date:   str
    min_price:      float = Field(..., description="₹ per quintal")
    max_price:      float = Field(..., description="₹ per quintal")
    modal_price:    float = Field(..., description="₹ per quintal — most traded price")


class MandiSummary(BaseModel):
    commodity:      str
    state:          str
    date:           str
    records:        list[MandiRecord]
    avg_modal:      float           # weighted avg modal price across markets
    min_overall:    float
    max_overall:    float
    msp_2024:       float | None    # Minimum Support Price if known
    vs_msp_pct:     float | None    # % above/below MSP
    fetched_at:     str


# ── MSP reference table (₹/quintal, Kharif 2024) ───────────────────────────
MSP_2024: dict[str, float] = {
    "Paddy(Dhan)(Common)": 2300,
    "Wheat":               2275,
    "Soyabean":            4892,
    "Cotton":              7121,
    "Maize":               2090,
}


# ── Core fetch ──────────────────────────────────────────────────────────────

async def _fetch_agmarknet(
    api_key: str,
    commodity: str,
    state: str,
    arrival_date: str,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """
    Fetch raw records from data.gov.in AGMARKNET dataset.
    """
    url    = f"{DATA_GOV_BASE}/{AGMARKNET_RESOURCE}"
    params = {
        "api-key":                  api_key,
        "format":                   "json",
        "limit":                    limit,
        "filters[Commodity]":       commodity,
        "filters[State]":           state,
        "filters[Arrival_Date]":    arrival_date,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        body = resp.json()
        return body.get("records", [])


def _parse_record(raw: dict) -> MandiRecord | None:
    """Parse a single AGMARKNET record. Returns None if data is invalid."""
    try:
        return MandiRecord(
            state        = raw.get("State", ""),
            district     = raw.get("District", ""),
            market       = raw.get("Market", ""),
            commodity    = raw.get("Commodity", ""),
            variety      = raw.get("Variety", ""),
            arrival_date = raw.get("Arrival_Date", ""),
            min_price    = float(raw.get("Min_x0020_Price", 0) or 0),
            max_price    = float(raw.get("Max_x0020_Price", 0) or 0),
            modal_price  = float(raw.get("Modal_x0020_Price", 0) or 0),
        )
    except (ValueError, TypeError) as e:
        logger.debug("Skipping invalid mandi record: %s — %s", raw, e)
        return None


def _build_summary(records: list[MandiRecord], commodity: str, state: str, date: str) -> MandiSummary:
    valid = [r for r in records if r.modal_price > 0]
    avg   = round(sum(r.modal_price for r in valid) / len(valid), 2) if valid else 0
    msp   = MSP_2024.get(commodity)
    vs    = round((avg - msp) / msp * 100, 1) if msp and avg else None

    return MandiSummary(
        commodity    = commodity,
        state        = state,
        date         = date,
        records      = records,
        avg_modal    = avg,
        min_overall  = min((r.min_price for r in valid), default=0),
        max_overall  = max((r.max_price for r in valid), default=0),
        msp_2024     = msp,
        vs_msp_pct   = vs,
        fetched_at   = datetime.utcnow().isoformat() + "Z",
    )


# ── Public API ──────────────────────────────────────────────────────────────

class MandiService:
    """
    Async AGMARKNET mandi price service with Redis cache.

    Usage:
        svc = MandiService(api_key="YOUR_KEY", redis_client=redis)
        summary = await svc.get_prices("paddy", "maharashtra")
    """

    def __init__(self, api_key: str, redis_client: aioredis.Redis | None = None):
        self.api_key = api_key
        self.redis   = redis_client

    async def get_prices(
        self,
        crop:  str,
        state: str,
        date:  str | None = None,       # defaults to today
        limit: int        = 100,
    ) -> MandiSummary:
        """
        Fetch mandi prices for a crop+state combination.
        Caches for 6 hours to avoid hammering the API.
        """
        commodity   = CROP_ALIASES.get(crop.lower(), crop)
        state_norm  = STATE_ALIASES.get(state.lower(), state)
        date_str    = date or datetime.now().strftime("%d/%m/%Y")
        cache_key   = f"mandi:{commodity}:{state_norm}:{date_str}"

        # ── Cache hit ─────────────────────────────────────────────────────
        if self.redis:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    return MandiSummary.model_validate_json(cached)
            except Exception as e:
                logger.warning("Redis mandi read failed: %s", e)

        # ── Fetch from API ────────────────────────────────────────────────
        try:
            raw_records = await _fetch_agmarknet(
                self.api_key, commodity, state_norm, date_str, limit
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                raise PermissionError(
                    "Invalid data.gov.in API key. "
                    "Get a free key at https://data.gov.in/user/register"
                ) from e
            raise RuntimeError(f"AGMARKNET fetch failed: {e}") from e
        except httpx.HTTPError as e:
            raise RuntimeError(f"Network error fetching mandi data: {e}") from e

        # ── Parse & cache ─────────────────────────────────────────────────
        records = [r for raw in raw_records if (r := _parse_record(raw))]
        summary = _build_summary(records, commodity, state_norm, date_str)

        if self.redis and records:
            try:
                await self.redis.setex(cache_key, CACHE_TTL_SECS, summary.model_dump_json())
            except Exception as e:
                logger.warning("Redis mandi write failed: %s", e)

        return summary

    async def get_price_trend(
        self,
        crop:  str,
        state: str,
        days:  int = 30,
    ) -> list[MandiSummary]:
        """
        Fetch mandi prices for the last `days` days.
        Returns a list of daily summaries (days where data exists).
        """
        import asyncio
        dates = [
            (datetime.now() - timedelta(days=i)).strftime("%d/%m/%Y")
            for i in range(days)
        ]
        tasks   = [self.get_prices(crop, state, d) for d in dates]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, MandiSummary) and r.records]

    async def get_multi_crop(
        self,
        crops: list[str],
        state: str,
        date:  str | None = None,
    ) -> dict[str, MandiSummary]:
        """
        Fetch prices for multiple crops in one call.
        Returns { crop_name: MandiSummary }.
        """
        import asyncio
        tasks   = {crop: self.get_prices(crop, state, date) for crop in crops}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        return {
            crop: res
            for crop, res in zip(tasks.keys(), results)
            if isinstance(res, MandiSummary)
        }