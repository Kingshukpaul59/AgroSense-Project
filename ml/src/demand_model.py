import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import os
import mlflow
import mlflow.pytorch

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

# -------------------------------
# MODEL
# -------------------------------
class DemandLSTM(nn.Module):
    def __init__(self, input_size=2, hidden=64, layers=2, forecast=1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden, layers,
                            batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden, forecast)

    def forward(self, x):
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])

# -------------------------------
# CREATE SEQUENCES
# -------------------------------
def create_sequences(data, seq_length=6):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i+seq_length])
        y.append(data[i+seq_length][0])  # predict price
    return np.array(X), np.array(y)

# -------------------------------
# TRAIN FUNCTION
# -------------------------------
def train_lstm():

    print("📂 Loading demand dataset...")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_PATH = os.path.join(BASE_DIR, "..", "data", "processed", "demand_dataset.csv")

    df = pd.read_csv(DATA_PATH)

    print("Columns found:", df.columns)

    # -------------------------------
    # FIX COLUMN NAMES (SAFE)
    # -------------------------------
    df.columns = df.columns.str.strip().str.lower()

    # Try common mappings
    if "modal_price" in df.columns:
        df.rename(columns={"modal_price": "price"}, inplace=True)

    if "modal price" in df.columns:
        df.rename(columns={"modal price": "price"}, inplace=True)

    if "district_name" in df.columns:
        df.rename(columns={"district_name": "district_id"}, inplace=True)

    if "district" in df.columns:
        df.rename(columns={"district": "district_id"}, inplace=True)

    # -------------------------------
    # DATE → MONTH
    # -------------------------------
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df["month"] = df["date"].dt.month
    else:
        df["month"] = 1  # fallback

    # -------------------------------
    # SELECT FEATURES (SAFE)
    # -------------------------------
    features = []

    if "price" in df.columns:
        features.append("price")

    if "month" in df.columns:
        features.append("month")

    print("Using features:", features)

    if len(features) == 0:
        raise ValueError("❌ No valid features found. Check dataset columns.")

    df = df[features].fillna(0)

    # -------------------------------
    # SCALE DATA
    # -------------------------------
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(df)

    # -------------------------------
    # CREATE SEQUENCES
    # -------------------------------
    X, y = create_sequences(data_scaled, seq_length=6)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    X_train = torch.tensor(X_train, dtype=torch.float32)
    y_train = torch.tensor(y_train, dtype=torch.float32)

    X_test = torch.tensor(X_test, dtype=torch.float32)
    y_test = torch.tensor(y_test, dtype=torch.float32)

    # -------------------------------
    # MODEL
    # -------------------------------
    model = DemandLSTM(input_size=len(features))
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # -------------------------------
    # MLflow
    # -------------------------------
    mlflow.set_experiment("demand-prediction-lstm")

    with mlflow.start_run():

        print("🚀 Training LSTM...")

        for epoch in range(20):
            model.train()
            optimizer.zero_grad()

            outputs = model(X_train).squeeze()
            loss = criterion(outputs, y_train)

            loss.backward()
            optimizer.step()

            if epoch % 5 == 0:
                print(f"Epoch {epoch}, Loss: {loss.item()}")

        # -------------------------------
        # EVALUATION
        # -------------------------------
        model.eval()
        with torch.no_grad():
            preds = model(X_test).squeeze()
            rmse = torch.sqrt(nn.MSELoss()(preds, y_test)).item()

        # -------------------------------
        # LOGGING
        # -------------------------------
        mlflow.log_param("model", "LSTM")
        mlflow.log_param("epochs", 20)
        mlflow.log_metric("rmse", rmse)

        mlflow.pytorch.log_model(model, "demand_lstm_model")

        print("✅ LSTM model trained & logged")
        print(f"RMSE: {rmse}")

# -------------------------------
if __name__ == "__main__":
    train_lstm()