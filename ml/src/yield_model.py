import xgboost as xgb
import pandas as pd
import joblib
import mlflow
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# ─────────────────────────────────────────────────────────────────
# Soil type → (nitrogen_factor, ph_optimal_distance_penalty)
# These reflect how each soil naturally affects yield capacity
# ─────────────────────────────────────────────────────────────────
SOIL_YIELD_FACTORS = {
    "loamy":  1.00,   # Best all-round soil — baseline
    "silty":  0.92,
    "clay":   0.85,   # Waterlogging risk, harder to work
    "peaty":  0.80,
    "chalky": 0.72,
    "sandy":  0.65,   # Low water retention, nutrient-poor
    "saline": 0.45,   # Severe salt stress
}

# ─────────────────────────────────────────────────────────────────
# Weather condition → how it modifies the base rainfall & temp
# ─────────────────────────────────────────────────────────────────
WEATHER_FACTORS = {
    "normal":   {"rain_mult": 1.00, "temp_mult": 1.00, "yield_penalty": 0.00},
    "hot_dry":  {"rain_mult": 0.50, "temp_mult": 1.20, "yield_penalty": 0.18},
    "drought":  {"rain_mult": 0.25, "temp_mult": 1.10, "yield_penalty": 0.30},
    "cold_wet": {"rain_mult": 1.50, "temp_mult": 0.85, "yield_penalty": 0.10},
    "flood":    {"rain_mult": 2.50, "temp_mult": 0.95, "yield_penalty": 0.25},
}

FEATURES = [
    "rainfall_mm", "avg_temp_c", "humidity_pct",
    "soil_nitrogen", "soil_phosphorus", "soil_ph",
    "soil_factor",           # encodes soil type as a numeric yield multiplier
    "ndvi_mean", "sowing_week", "irrigated_area_pct",
    "prev_year_yield", "crop_id",
]


# ─────────────────────────────────────────────────────────────────
# Training — unchanged from your original, plus soil_factor column
# ─────────────────────────────────────────────────────────────────
def train_model():
    print("📂 Loading dataset...")
    df = pd.read_csv("data/processed/final_dataset.csv")

    # Map soil type string → numeric factor if column exists
    if "soil_type" in df.columns:
        df["soil_factor"] = df["soil_type"].map(SOIL_YIELD_FACTORS).fillna(1.0)
    else:
        df["soil_factor"] = 1.0  # default until real data has soil_type

    df["crop_id"] = df["crop_id"].astype("category")

    X = df[FEATURES]
    y = df["yield_mt_ha"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    mlflow.set_experiment("yield-prediction")
    mlflow.xgboost.autolog()

    with mlflow.start_run():
        params = {
            "n_estimators": 1000,
            "max_depth": 6,
            "learning_rate": 0.06,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "enable_categorical": True,
            "early_stopping_rounds": 50,
        }

        model = xgb.XGBRegressor(**params)

        print("🚀 Training model with early stopping...")
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

        preds = model.predict(X_test)
        rmse  = np.sqrt(mean_squared_error(y_test, preds))
        r2    = r2_score(y_test, preds)

        print(f"Best Iteration : {model.best_iteration}")
        print(f"RMSE           : {rmse:.4f} MT/ha")
        print(f"R²             : {r2:.4f}")

        mlflow.log_metric("final_test_rmse", rmse)
        mlflow.log_metric("final_test_r2",   r2)

        joblib.dump(model, "models/yield_xgb.pkl")
        print("✅ Model saved to models/yield_xgb.pkl")


# ─────────────────────────────────────────────────────────────────
# FarmerYieldPredictor
# The farmer tells us:  soil type  |  weather condition  |  land size
# We tell them:         how much they can produce this season
# ─────────────────────────────────────────────────────────────────
class FarmerYieldPredictor:

    def __init__(self, model_path: str = "models/yield_xgb.pkl"):
        self.model = joblib.load(model_path)

    def predict(
        self,
        # ── What the farmer knows about their land ──────────────
        land_area_ha:        float,   # e.g. 1.0, 2.5, 5.0
        soil_type:           str,     # "loamy" / "sandy" / "clay" / "silty" / "peaty" / "chalky" / "saline"
        soil_nitrogen:       float,   # from soil health card (kg/ha)
        soil_phosphorus:     float,   # from soil health card (kg/ha)
        soil_ph:             float,   # from soil health card

        # ── Weather this season ─────────────────────────────────
        weather_condition:   str,     # "normal" / "drought" / "flood" / "hot_dry" / "cold_wet"
        rainfall_mm:         float,   # expected seasonal rainfall
        avg_temp_c:          float,
        humidity_pct:        float,

        # ── Crop & farm details ─────────────────────────────────
        crop_id:             int,
        irrigated_area_pct:  float = 50.0,
        sowing_week:         int   = 22,
        ndvi_mean:           float = 0.65,
        prev_year_yield:     float = 3.0,
    ) -> dict:

        # Validate
        if soil_type not in SOIL_YIELD_FACTORS:
            raise ValueError(f"soil_type must be one of: {list(SOIL_YIELD_FACTORS.keys())}")
        if weather_condition not in WEATHER_FACTORS:
            raise ValueError(f"weather_condition must be one of: {list(WEATHER_FACTORS.keys())}")
        if land_area_ha <= 0:
            raise ValueError("land_area_ha must be > 0")

        # Apply weather adjustments to raw weather inputs
        wf = WEATHER_FACTORS[weather_condition]
        adj_rainfall = rainfall_mm * wf["rain_mult"]
        adj_temp     = avg_temp_c  * wf["temp_mult"]

        # Build feature row for the model
        row = {
            "rainfall_mm":        adj_rainfall,
            "avg_temp_c":         adj_temp,
            "humidity_pct":       humidity_pct,
            "soil_nitrogen":      soil_nitrogen,
            "soil_phosphorus":    soil_phosphorus,
            "soil_ph":            soil_ph,
            "soil_factor":        SOIL_YIELD_FACTORS[soil_type],
            "ndvi_mean":          ndvi_mean,
            "sowing_week":        sowing_week,
            "irrigated_area_pct": irrigated_area_pct,
            "prev_year_yield":    prev_year_yield,
            "crop_id":            crop_id,
        }

        df = pd.DataFrame([row])[FEATURES]
        df["crop_id"] = df["crop_id"].astype("category")

        # Model predicts yield per hectare
        yield_per_ha = float(self.model.predict(df)[0])

        # Apply weather penalty on top of model output
        yield_per_ha *= (1 - wf["yield_penalty"])

        # Scale to farmer's actual land
        total = yield_per_ha * land_area_ha

        # Confidence bounds  (±12%)
        low   = total * 0.88
        high  = total * 1.12

        return {
            # ── Core answer for the farmer ──────────────────────
            "yield_per_hectare_mt":  round(yield_per_ha, 2),
            "total_expected_mt":     round(total, 2),
            "minimum_expected_mt":   round(low,   2),
            "maximum_expected_mt":   round(high,  2),

            # ── Context echoed back ─────────────────────────────
            "land_area_ha":          land_area_ha,
            "soil_type":             soil_type,
            "weather_condition":     weather_condition,

            # ── Plain-English summary ────────────────────────────
            "message": (
                f"Your {land_area_ha} ha {soil_type} field with "
                f"{weather_condition} weather is expected to produce "
                f"{round(total, 2)} MT this season "
                f"(range: {round(low, 2)} – {round(high, 2)} MT)."
            ),
        }


# ─────────────────────────────────────────────────────────────────
# Quick demo — run with:  python yield_model.py
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Uncomment to train:
    # train_model()

    predictor = FarmerYieldPredictor("models/yield_xgb.pkl")

    scenarios = [
        dict(land_area_ha=1.0,  soil_type="loamy",  weather_condition="normal",
             rainfall_mm=850, avg_temp_c=28, humidity_pct=70,
             soil_nitrogen=65, soil_phosphorus=42, soil_ph=6.8,
             crop_id=1, irrigated_area_pct=80, prev_year_yield=3.5),

        dict(land_area_ha=2.5,  soil_type="sandy",  weather_condition="drought",
             rainfall_mm=400, avg_temp_c=35, humidity_pct=40,
             soil_nitrogen=30, soil_phosphorus=20, soil_ph=7.5,
             crop_id=2, irrigated_area_pct=20, prev_year_yield=2.2),

        dict(land_area_ha=5.0,  soil_type="clay",   weather_condition="flood",
             rainfall_mm=1400, avg_temp_c=25, humidity_pct=92,
             soil_nitrogen=55, soil_phosphorus=38, soil_ph=6.3,
             crop_id=3, irrigated_area_pct=60, prev_year_yield=4.1),
    ]

    print(f"\n{'Scenario':<30} {'Land':>6} {'Yield/ha':>9} {'Total (MT)':>11}  Message")
    print("-" * 90)
    for s in scenarios:
        r = predictor.predict(**s)
        label = f"{s['soil_type'].capitalize()} + {s['weather_condition']}"
        print(f"{label:<30} {r['land_area_ha']:>5.1f}ha "
              f"{r['yield_per_hectare_mt']:>8.2f} "
              f"{r['total_expected_mt']:>10.2f}  "
              f"({r['minimum_expected_mt']}–{r['maximum_expected_mt']} MT)")