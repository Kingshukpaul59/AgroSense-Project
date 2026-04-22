import mlflow, mlflow.sklearn
mlflow.set_experiment("yield-prediction")
mlflow.set_experiment("demand-prediction")

with mlflow.start_run():
    mlflow.log_param("n_estimators", 500)
    mlflow.log_param("max_depth", 6)
    mlflow.log_metric("rmse", 0.34)
    mlflow.log_metric("r2", 0.91)
    mlflow.sklearn.log_model(model, "yield_xgb")

# Launch MLflow UI (in a new terminal):

# Visit: http://localhost:5000