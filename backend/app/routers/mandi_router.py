"""
backend/app/routers/mandi_router.py

FastAPI router for mandi price endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.mandi_service import MandiService, MandiSummary, CROP_ALIASES, STATE_ALIASES
from app.core.dependencies import get_mandi_service

router = APIRouter(prefix="/mandi", tags=["Mandi Prices"])


@router.get(
    "/prices",
    response_model=MandiSummary,
    summary="Latest mandi prices for a crop and state",
    description="""
    Fetches today's mandi prices from AGMARKNET via data.gov.in.
    Results are cached for 6 hours.
    Requires DATA_GOV_API_KEY env var (free at https://data.gov.in/user/register).
    """,
)
async def get_prices(
    crop:  str = Query(..., example="paddy",         description="Crop name (paddy, wheat, cotton, soybean, maize)"),
    state: str = Query(..., example="maharashtra",   description="State name"),
    date:  str = Query(None, example="15/04/2024",   description="Date DD/MM/YYYY (defaults to today)"),
    svc:   MandiService = Depends(get_mandi_service),
) -> MandiSummary:
    try:
        return await svc.get_prices(crop, state, date)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get(
    "/trend",
    response_model=list[MandiSummary],
    summary="Price trend for last N days",
)
async def get_price_trend(
    crop:  str = Query(..., example="wheat"),
    state: str = Query(..., example="punjab"),
    days:  int = Query(30, ge=1, le=90, description="Number of days of history"),
    svc:   MandiService = Depends(get_mandi_service),
) -> list[MandiSummary]:
    try:
        return await svc.get_price_trend(crop, state, days)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get(
    "/multi-crop",
    summary="Prices for multiple crops in one request",
    description="Fetch today's modal price for several crops at once. Useful for dashboard KPI bar.",
)
async def get_multi_crop(
    crops: str  = Query(..., example="paddy,wheat,soybean", description="Comma-separated crop names"),
    state: str  = Query(..., example="maharashtra"),
    svc:   MandiService = Depends(get_mandi_service),
) -> dict:
    crop_list = [c.strip() for c in crops.split(",") if c.strip()]
    try:
        summaries = await svc.get_multi_crop(crop_list, state)
        return {
            crop: {
                "avg_modal":  s.avg_modal,
                "msp_2024":   s.msp_2024,
                "vs_msp_pct": s.vs_msp_pct,
                "markets":    len(s.records),
            }
            for crop, s in summaries.items()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/supported-crops",  summary="List supported crop names")
async def supported_crops()  -> dict: return {"crops":  list(CROP_ALIASES.keys())}

@router.get("/supported-states", summary="List supported state names")
async def supported_states() -> dict: return {"states": list(STATE_ALIASES.keys())}