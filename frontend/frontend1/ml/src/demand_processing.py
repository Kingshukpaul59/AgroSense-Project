import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, "..", "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "..", "data", "processed")

print("Loading mandi data...")

df = pd.read_csv(os.path.join(RAW_DIR, "mandi_prices_data.csv"))

df.columns = df.columns.str.strip().str.lower()

print("Columns found:", df.columns)

# Rename (adjust if needed)
df.rename(columns={
    "modal_price": "price",
    "commodity": "crop",
    "district": "district_id"
}, inplace=True)

# Date handling
if "date" in df.columns:
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["month"] = df["date"].dt.month
else:
    df["month"] = 1

df.dropna(inplace=True)

os.makedirs(PROCESSED_DIR, exist_ok=True)

output_path = os.path.join(PROCESSED_DIR, "demand_dataset.csv")
df.to_csv(output_path, index=False)

print("Dataset saved at:", output_path)