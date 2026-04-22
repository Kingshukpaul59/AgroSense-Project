import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, "..", "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "..", "data", "processed")

def find_file(folder, name):
    for f in os.listdir(folder):
        if f.lower() == name.lower():
            return os.path.join(folder, f)
    raise FileNotFoundError(f"{name} not found in {folder}")

print("Loading datasets...")

yield_path = find_file(RAW_DIR, "Yeild_production_data.csv")
yield_df = pd.read_csv(yield_path)

print("Files loaded successfully!")

# Clean columns
yield_df.columns = yield_df.columns.str.strip().str.lower()

print("Columns:", yield_df.columns)

# ✅ Select useful columns
df = yield_df[[
    "dist name",
    "year",
    "rice yield (kg per ha)"
]].copy()

# Rename properly
df.rename(columns={
    "dist name": "district_id",
    "rice yield (kg per ha)": "yield_mt_ha"
}, inplace=True)

# Convert kg/ha → ton/ha
df["yield_mt_ha"] = df["yield_mt_ha"] / 1000

# -----------------------------
# 🔥 ADD FEATURES (IMPORTANT)
# -----------------------------
df["rainfall_mm"] = 800
df["avg_temp_c"] = 28
df["humidity_pct"] = 70

df["soil_nitrogen"] = 50
df["soil_phosphorus"] = 30
df["soil_ph"] = 6.5

df["ndvi_mean"] = 0.5
df["sowing_week"] = 20
df["irrigated_area_pct"] = 50

df["prev_year_yield"] = df["yield_mt_ha"].shift(1).bfill()
df["crop_id"] = 1

# Remove missing
df.dropna(inplace=True)

# Save
os.makedirs(PROCESSED_DIR, exist_ok=True)
output_path = os.path.join(PROCESSED_DIR, "final_dataset.csv")
df.to_csv(output_path, index=False)

print("Dataset ready:", output_path)
print("Shape:", df.shape)