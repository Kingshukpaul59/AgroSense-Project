"""
backend/app/routers/yield_router.py
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from app.ml.yield_model import FarmerYieldPredictor

router = APIRouter(prefix="/api/yield", tags=["Yield"])

_predictor = None
def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = FarmerYieldPredictor("models/yield_xgb.pkl")
    return _predictor


class FarmerInput(BaseModel):
    # Land
    land_area_ha:        float = Field(..., gt=0,  example=2.0,  description="Your total land in hectares")

    # Soil
    soil_type:           Literal["loamy","sandy","clay","silty","peaty","chalky","saline"] = Field(..., example="loamy")
    soil_nitrogen:       float = Field(..., ge=0,  example=65,   description="From soil health card (kg/ha)")
    soil_phosphorus:     float = Field(..., ge=0,  example=42,   description="From soil health card (kg/ha)")
    soil_ph:             float = Field(..., ge=0, le=14, example=6.8)

    # Weather
    weather_condition:   Literal["normal","drought","flood","hot_dry","cold_wet"] = Field(..., example="normal")
    rainfall_mm:         float = Field(..., ge=0,  example=850,  description="Expected seasonal rainfall (mm)")
    avg_temp_c:          float = Field(...,        example=28,   description="Average temperature (°C)")
    humidity_pct:        float = Field(..., ge=0, le=100, example=70)

    # Crop
    crop_id:             int   = Field(...,        example=1,    description="1=Rice, 2=Wheat, 3=Maize")
    irrigated_area_pct:  float = Field(50.0, ge=0, le=100)
    sowing_week:         int   = Field(22,   ge=1, le=52)
    prev_year_yield:     float = Field(3.0,  ge=0)


class YieldResult(BaseModel):
    yield_per_hectare_mt:  float
    total_expected_mt:     float
    minimum_expected_mt:   float
    maximum_expected_mt:   float
    land_area_ha:          float
    soil_type:             str
    weather_condition:     str
    message:               str


@router.post("/predict", response_model=YieldResult,
    summary="How much can I produce from my land?")
def predict(body: FarmerInput):
    try:
        return get_predictor().predict(**body.model_dump())
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(503, detail="Model not trained yet. Run: python yield_model.py")
    except Exception as e:
        raise HTTPException(500, detail=str(e))