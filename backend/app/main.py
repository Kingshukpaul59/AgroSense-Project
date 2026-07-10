from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
import random
import math
from datetime import datetime, timedelta

# ─────────────────────────────────────────────
#  App setup
# ─────────────────────────────────────────────
app = FastAPI(
    title="AgroSense API",
    description="Intelligent Pre-Harvest Advisory Platform — Techathon Demo",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  Static mock data
# ─────────────────────────────────────────────
CROPS = {
    "rice":    {"name": "Rice (Paddy)", "base_yield": 4.8, "unit": "MT/ha"},
    "wheat":   {"name": "Wheat",        "base_yield": 3.9, "unit": "MT/ha"},
    "maize":   {"name": "Maize",        "base_yield": 3.2, "unit": "MT/ha"},
    "soybean": {"name": "Soybean",      "base_yield": 2.6, "unit": "MT/ha"},
    "cotton":  {"name": "Cotton",       "base_yield": 1.9, "unit": "MT/ha"},
}

DISTRICTS = {
    "ludhiana":   {"state": "Punjab",       "lat": 30.90, "lng": 75.85},
    "ambala":     {"state": "Haryana",      "lat": 30.37, "lng": 76.77},
    "indore":     {"state": "Madhya Pradesh","lat": 22.71, "lng": 75.85},
    "nagpur":     {"state": "Maharashtra",  "lat": 21.14, "lng": 79.08},
    "guntur":     {"state": "Andhra Pradesh","lat": 16.30, "lng": 80.43},
}

SEASONS = ["kharif2024", "rabi2024", "kharif2025", "rabi2025"]

WEATHER_CONDITIONS = ["sunny", "partly_cloudy", "overcast", "light_rain", "heavy_rain"]

ADVISORIES = {
    "rice": [
        "Stagger harvest by 10–14 days to avoid regional price glut in October.",
        "Apply 20 kg/ha potassium fertiliser before the next rain event.",
        "Monitor for blast fungus — humidity above 85% detected this week.",
    ],
    "wheat": [
        "Optimal sowing window: Nov 15–30. Delay risks terminal heat stress.",
        "Irrigation needed within 48 hours — soil moisture at 28%, below threshold.",
        "Strong MSP signal expected — hold 30% stock post-harvest for 3 weeks.",
    ],
    "maize": [
        "Consider switching 15% land to soybean — demand index 19% higher.",
        "Apply pre-emergence herbicide within 3 days of sowing.",
        "Export demand rising — lock forward contracts before harvest.",
    ],
    "soybean": [
        "Increase sown area by 15% — export demand at 5-year high.",
        "Rhizobium inoculation recommended for new fields this season.",
        "Delay harvest by 7 days — prices projected to rise post-festival.",
    ],
    "cotton": [
        "High oversupply risk — consider replacing 20% area with maize.",
        "Pink bollworm alert — apply IPM measures immediately.",
        "Global inventory surplus detected — sell at MSP, don't hold stock.",
    ],
}

# ─────────────────────────────────────────────
#  Helper functions
# ─────────────────────────────────────────────
def jitter(base: float, pct: float = 0.08) -> float:
    """Add small realistic variation to a base value."""
    return round(base * (1 + random.uniform(-pct, pct)), 2)

def demand_curve(crop: str, months: int = 6) -> list[dict]:
    """Generate a realistic demand forecast curve."""
    bases = {"rice": 78, "wheat": 71, "maize": 55, "soybean": 82, "cotton": 44}
    trends = {"rice": 0.8, "wheat": 0.4, "maize": 1.2, "soybean": 2.1, "cotton": -1.5}
    base = bases.get(crop, 60)
    trend = trends.get(crop, 0.5)
    today = datetime.now()
    result = []
    for i in range(months):
        month_date = today + timedelta(days=30 * i)
        value = base + trend * i + random.uniform(-3, 3)
        result.append({
            "month": month_date.strftime("%b %Y"),
            "demand_index": round(max(10, min(100, value)), 1),
        })
    return result

def soil_health(district: str) -> dict:
    """Return realistic soil health metrics."""
    profiles = {
        "ludhiana": {"nitrogen": 280, "phosphorus": 42, "potassium": 195, "ph": 6.8, "moisture": 38, "organic_carbon": 0.72},
        "ambala":   {"nitrogen": 260, "phosphorus": 38, "potassium": 180, "ph": 7.1, "moisture": 34, "organic_carbon": 0.65},
        "indore":   {"nitrogen": 310, "phosphorus": 55, "potassium": 210, "ph": 6.5, "moisture": 42, "organic_carbon": 0.88},
        "nagpur":   {"nitrogen": 240, "phosphorus": 35, "potassium": 165, "ph": 7.4, "moisture": 30, "organic_carbon": 0.58},
        "guntur":   {"nitrogen": 295, "phosphorus": 48, "potassium": 200, "ph": 6.9, "moisture": 40, "organic_carbon": 0.79},
    }
    p = profiles.get(district, profiles["ludhiana"])
    return {k: jitter(v, 0.05) for k, v in p.items()}

def weather_forecast(district: str) -> list[dict]:
    """Generate 7-day weather forecast."""
    base_temps = {
        "ludhiana": 33, "ambala": 32, "indore": 30, "nagpur": 31, "guntur": 34
    }
    base = base_temps.get(district, 32)
    today = datetime.now()
    forecast = []
    for i in range(7):
        day = today + timedelta(days=i)
        cond = random.choice(WEATHER_CONDITIONS)
        rain = round(random.uniform(0, 35), 1) if "rain" in cond else 0
        forecast.append({
            "date": day.strftime("%a %d %b"),
            "condition": cond,
            "temp_max_c": round(base + random.uniform(-3, 3), 1),
            "temp_min_c": round(base - 8 + random.uniform(-2, 2), 1),
            "rainfall_mm": rain,
            "humidity_pct": round(random.uniform(55, 90), 1),
        })
    return forecast

# ─────────────────────────────────────────────
#  Root — HTML landing page
# ─────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse, tags=["Info"])
def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
      <title>AgroSense API</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 700px; margin: 60px auto;
               padding: 0 24px; color: #1a1a1a; background: #f9f9f6; }
        h1   { color: #145220; font-size: 2rem; margin-bottom: 4px; }
        p    { color: #555; margin-bottom: 24px; }
        .grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .card{ background: #fff; border: 1px solid #e0e0d8; border-radius: 10px;
               padding: 16px 20px; }
        .card h3 { margin: 0 0 4px; color: #145220; font-size: .95rem; }
        .card p  { margin: 0; font-size: .85rem; color: #666; }
        a    { color: #1D9E75; font-weight: 500; }
        .badge { display:inline-block; padding:2px 10px; border-radius:20px;
                 background:#e8f5e9; color:#1D9E75; font-size:.8rem; margin-bottom:20px; }
      </style>
    </head>
    <body>
      <h1>AgroSense API</h1>
      <span class="badge">Techathon Demo v1.0</span>
      <p>Intelligent Pre-Harvest Advisory Platform — FastAPI demo server with realistic mock data.</p>
      <div class="grid">
        <div class="card"><h3>Interactive docs</h3>
          <p><a href="/docs">Swagger UI</a> — test all endpoints live</p></div>
        <div class="card"><h3>Health check</h3>
          <p><a href="/health">/health</a> — server status</p></div>
        <div class="card"><h3>Yield prediction</h3>
          <p><a href="/api/yield/predict?crop=rice&district=ludhiana&season=kharif2025">/api/yield/predict</a></p></div>
        <div class="card"><h3>Demand forecast</h3>
          <p><a href="/api/demand/forecast?crop=rice">/api/demand/forecast</a></p></div>
        <div class="card"><h3>Advisory</h3>
          <p><a href="/api/advisory/1">/api/advisory/{farmer_id}</a></p></div>
        <div class="card"><h3>Dashboard</h3>
          <p><a href="/api/dashboard?district=ludhiana">/api/dashboard</a></p></div>
      </div>
    </body>
    </html>
    """

# ─────────────────────────────────────────────
#  Health
# ─────────────────────────────────────────────
@app.get("/health", tags=["Info"])
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "model_status": {
            "yield_model":  "loaded",
            "demand_model": "loaded",
            "recommender":  "loaded",
        },
    }

# ─────────────────────────────────────────────
#  Yield prediction
# ─────────────────────────────────────────────
@app.get("/api/yield/predict", tags=["Yield"])
def predict_yield(
    crop:     str = Query("rice",     enum=list(CROPS.keys()),    description="Crop type"),
    district: str = Query("ludhiana", enum=list(DISTRICTS.keys()),description="District name"),
    season:   str = Query("kharif2025", enum=SEASONS,             description="Crop season"),
    area_ha:  float = Query(5.0, ge=0.1, le=1000,                description="Land area in hectares"),
):
    crop_info = CROPS[crop]
    base      = crop_info["base_yield"]
    predicted = jitter(base, 0.10)
    low       = round(predicted * 0.88, 2)
    high      = round(predicted * 1.12, 2)
    total     = round(predicted * area_ha, 2)

    # Risk scoring
    risk_score = round(random.uniform(18, 72), 1)
    risk_label = "Low" if risk_score < 35 else "Medium" if risk_score < 60 else "High"

    prev_yield  = jitter(base * 0.91, 0.05)
    change_pct  = round((predicted - prev_yield) / prev_yield * 100, 1)

    return {
        "crop":           crop_info["name"],
        "district":       district.capitalize(),
        "state":          DISTRICTS[district]["state"],
        "season":         season,
        "area_ha":        area_ha,
        "predicted_yield": {
            "value": predicted,
            "unit":  crop_info["unit"],
            "low":   low,
            "high":  high,
        },
        "total_production_mt": total,
        "vs_last_season": {
            "previous_yield": prev_yield,
            "change_pct":     change_pct,
            "trend":          "up" if change_pct > 0 else "down",
        },
        "risk": {
            "score": risk_score,
            "label": risk_label,
        },
        "model": {
            "name":     "XGBoost Yield Predictor",
            "accuracy": "91.3%",
            "features": 12,
        },
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Demand forecast
# ─────────────────────────────────────────────
@app.get("/api/demand/forecast", tags=["Demand"])
def forecast_demand(
    crop:   str = Query("rice", enum=list(CROPS.keys()), description="Crop type"),
    months: int = Query(6, ge=1, le=12, description="Forecast horizon in months"),
):
    curve  = demand_curve(crop, months)
    latest = curve[-1]["demand_index"]
    first  = curve[0]["demand_index"]
    trend  = round(latest - first, 1)

    signal = "Strong" if latest > 75 else "Moderate" if latest > 55 else "Weak"
    price_outlook = {
        "rice":    "Prices stable, slight upward pressure post-festival season.",
        "wheat":   "MSP likely to increase — hold partial stock 3–4 weeks.",
        "maize":   "Ethanol demand driving 12% price rise — favourable.",
        "soybean": "Export demand at 5-year high — strong sell signal.",
        "cotton":  "Global surplus — sell at MSP, avoid holding stock.",
    }

    return {
        "crop":           CROPS[crop]["name"],
        "forecast_months": months,
        "demand_signal":  signal,
        "trend_change":   trend,
        "trend_direction": "rising" if trend > 0 else "falling",
        "monthly_forecast": curve,
        "price_outlook":  price_outlook[crop],
        "model": {
            "name":     "LSTM Demand Forecaster",
            "accuracy": "87.6%",
            "horizon":  f"{months} months",
        },
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Supply–demand gap
# ─────────────────────────────────────────────
@app.get("/api/demand/gap", tags=["Demand"])
def supply_demand_gap(
    district: str = Query("ludhiana", enum=list(DISTRICTS.keys())),
):
    gaps = []
    for crop_id, crop_info in CROPS.items():
        supply_idx  = round(random.uniform(40, 95), 1)
        demand_idx  = round(random.uniform(40, 95), 1)
        gap         = round(supply_idx - demand_idx, 1)
        status      = "Oversupply" if gap > 10 else "Undersupply" if gap < -10 else "Balanced"
        risk        = "High" if abs(gap) > 20 else "Medium" if abs(gap) > 10 else "Low"
        gaps.append({
            "crop":        crop_info["name"],
            "supply_index": supply_idx,
            "demand_index": demand_idx,
            "gap":         gap,
            "status":      status,
            "risk":        risk,
        })

    return {
        "district":    district.capitalize(),
        "state":       DISTRICTS[district]["state"],
        "season":      "Kharif 2025",
        "gaps":        gaps,
        "alert_count": sum(1 for g in gaps if g["risk"] == "High"),
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Advisory
# ─────────────────────────────────────────────
@app.get("/api/advisory/{farmer_id}", tags=["Advisory"])
def get_advisory(
    farmer_id: int,
    crop:     str = Query("rice",     enum=list(CROPS.keys())),
    district: str = Query("ludhiana", enum=list(DISTRICTS.keys())),
):
    tips      = ADVISORIES[crop]
    soil      = soil_health(district)
    ph_alert  = soil["ph"] > 7.5 or soil["ph"] < 6.0
    n_alert   = soil["nitrogen"] < 250
    moisture  = soil["moisture"] < 32

    actions = tips.copy()
    if ph_alert:
        actions.append(f"Soil pH at {soil['ph']} — apply lime to correct before sowing.")
    if n_alert:
        actions.append(f"Nitrogen at {soil['nitrogen']} kg/ha — apply 25 kg/ha urea immediately.")
    if moisture:
        actions.append("Soil moisture critically low — irrigate within 48 hours.")

    urgency = "High" if (ph_alert or n_alert or moisture) else "Medium"

    return {
        "farmer_id":   farmer_id,
        "crop":        CROPS[crop]["name"],
        "district":    district.capitalize(),
        "season":      "Kharif 2025",
        "urgency":     urgency,
        "action_count": len(actions),
        "advisories":  actions,
        "soil_alerts": {
            "ph_imbalance":      ph_alert,
            "nitrogen_deficient": n_alert,
            "moisture_low":      moisture,
        },
        "next_review": (datetime.now() + timedelta(days=7)).strftime("%d %b %Y"),
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Crop recommendation
# ─────────────────────────────────────────────
@app.get("/api/recommend", tags=["Advisory"])
def recommend_crops(
    district:  str   = Query("ludhiana", enum=list(DISTRICTS.keys())),
    land_ha:   float = Query(10.0, ge=0.5, le=500, description="Total land in hectares"),
    risk_pref: str   = Query("medium", enum=["low", "medium", "high"], description="Risk appetite"),
):
    allocations = {
        "low":    {"rice": 0.50, "wheat": 0.30, "maize": 0.20},
        "medium": {"rice": 0.40, "soybean": 0.35, "maize": 0.25},
        "high":   {"soybean": 0.45, "maize": 0.30, "cotton": 0.25},
    }
    alloc = allocations[risk_pref]

    recommendations = []
    for crop_id, pct in alloc.items():
        area       = round(land_ha * pct, 2)
        yield_val  = jitter(CROPS[crop_id]["base_yield"], 0.08)
        price_msp  = round(random.uniform(1800, 6200), 0)
        revenue    = round(area * yield_val * price_msp, 0)
        recommendations.append({
            "crop":         CROPS[crop_id]["name"],
            "area_ha":      area,
            "area_pct":     round(pct * 100, 1),
            "exp_yield_mt_ha": yield_val,
            "msp_per_mt":   price_msp,
            "exp_revenue_inr": revenue,
        })

    total_rev = sum(r["exp_revenue_inr"] for r in recommendations)

    return {
        "district":        district.capitalize(),
        "total_land_ha":   land_ha,
        "risk_preference": risk_pref,
        "recommendations": recommendations,
        "total_expected_revenue_inr": total_rev,
        "profitability_score": round(random.uniform(6.8, 9.2), 1),
        "model": "Portfolio Optimizer (Pareto-optimal crop mix)",
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Weather
# ─────────────────────────────────────────────
@app.get("/api/weather/forecast", tags=["Weather"])
def get_weather(
    district: str = Query("ludhiana", enum=list(DISTRICTS.keys())),
):
    forecast  = weather_forecast(district)
    rain_days = sum(1 for d in forecast if d["rainfall_mm"] > 0)
    total_rain = round(sum(d["rainfall_mm"] for d in forecast), 1)
    alert     = total_rain > 60

    return {
        "district":      district.capitalize(),
        "state":         DISTRICTS[district]["state"],
        "lat":           DISTRICTS[district]["lat"],
        "lng":           DISTRICTS[district]["lng"],
        "forecast_days": 7,
        "summary": {
            "rainy_days":      rain_days,
            "total_rainfall_mm": total_rain,
            "alert":           alert,
            "alert_message":   "Heavy rainfall expected — delay spray operations." if alert else None,
        },
        "daily": forecast,
        "source": "OpenMeteo API (simulated)",
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Soil health
# ─────────────────────────────────────────────
@app.get("/api/soil/health", tags=["Soil"])
def get_soil_health(
    district: str = Query("ludhiana", enum=list(DISTRICTS.keys())),
):
    soil = soil_health(district)

    def status(key, val):
        thresholds = {
            "nitrogen":       (250, 350),
            "phosphorus":     (30,  60),
            "potassium":      (150, 250),
            "ph":             (6.0, 7.5),
            "moisture":       (30,  55),
            "organic_carbon": (0.5, 1.0),
        }
        lo, hi = thresholds[key]
        if val < lo: return "Low"
        if val > hi: return "High"
        return "Optimal"

    metrics = []
    for k, v in soil.items():
        metrics.append({
            "parameter": k.replace("_", " ").title(),
            "value":     round(v, 2),
            "unit": {
                "nitrogen": "kg/ha", "phosphorus": "kg/ha",
                "potassium": "kg/ha", "ph": "", "moisture": "%",
                "organic_carbon": "%",
            }[k],
            "status": status(k, v),
        })

    alerts = [m for m in metrics if m["status"] != "Optimal"]

    return {
        "district":    district.capitalize(),
        "state":       DISTRICTS[district]["state"],
        "last_scanned": (datetime.now() - timedelta(days=2)).strftime("%d %b %Y"),
        "overall_health_score": round(random.uniform(62, 91), 1),
        "metrics":     metrics,
        "alerts":      alerts,
        "alert_count": len(alerts),
        "source":      "ICAR / NBSS&LUP (simulated)",
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Full dashboard — single call for frontend
# ─────────────────────────────────────────────
@app.get("/api/dashboard", tags=["Dashboard"])
def get_dashboard(
    district: str  = Query("ludhiana", enum=list(DISTRICTS.keys())),
    crop:     str  = Query("rice",     enum=list(CROPS.keys())),
    area_ha:  float = Query(5.0),
):
    # Aggregate everything into one response for the demo frontend
    yield_data   = predict_yield(crop, district, "kharif2025", area_ha)
    demand_data  = forecast_demand(crop, 6)
    advisory_data = get_advisory(1, crop, district)
    weather_data = get_weather(district)
    soil_data    = get_soil_health(district)
    gap_data     = supply_demand_gap(district)

    return {
        "farmer": {
            "id":       1,
            "name":     "Demo Farmer",
            "district": district.capitalize(),
            "state":    DISTRICTS[district]["state"],
            "season":   "Kharif 2025",
        },
        "kpi": {
            "predicted_yield_mt_ha": yield_data["predicted_yield"]["value"],
            "demand_index":          demand_data["monthly_forecast"][0]["demand_index"],
            "supply_demand_gap_pct": round(random.uniform(-18, 22), 1),
            "profitability_score":   round(random.uniform(6.5, 9.0), 1),
        },
        "yield":    yield_data,
        "demand":   demand_data,
        "advisory": advisory_data,
        "weather":  weather_data,
        "soil":     soil_data,
        "gaps":     gap_data,
        "generated_at": datetime.now().isoformat(),
    }

# ─────────────────────────────────────────────
#  Farmer registration
# ─────────────────────────────────────────────
class FarmerIn(BaseModel):
    name:      str
    phone:     str
    district:  str
    state:     str
    land_ha:   float
    crops:     list[str]

@app.post("/api/farmers/register", tags=["Farmers"])
def register_farmer(farmer: FarmerIn):
    farmer_id = random.randint(1000, 9999)
    return {
        "success":   True,
        "farmer_id": farmer_id,
        "message":   f"Welcome, {farmer.name}! Your AgroSense account is ready.",
        "next_steps": [
            "Visit /api/dashboard to see your personalised insights.",
            "Check /api/advisory/{id} for today's pre-harvest advisory.",
            f"Your farmer ID is {farmer_id} — save it for future logins.",
        ],
        "registered_at": datetime.now().isoformat(),
    }