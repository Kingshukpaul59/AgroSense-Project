import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

model_path = os.path.join(BASE_DIR, "artifacts", "yield_xgb.pkl")

model = joblib.load(model_path)

# 🔹 preprocessing function
def preprocess(crop, district, season):
    crop_map = {"rice": 0, "wheat": 1}
    district_map = {"kolkata": 0, "howrah": 1}
    season_map = {"kharif": 0, "rabi": 1}

    return [[
        crop_map.get(crop.lower(), 0),
        district_map.get(district.lower(), 0),
        season_map.get(season.lower(), 0)
    ]]

# 🔹 prediction function
def predict(features):
    prediction = model.predict(features)
    return float(prediction[0])