from celery import Celery
app = Celery('agrosense', broker='redis://localhost:6379/0')
 
@app.task
def run_yield_prediction(region_id, season, crop_id):
    from app.ml.yield_model import YieldPredictor
    predictor = YieldPredictor()
    result = predictor.predict(region_id, season, crop_id)
    # save to DB, trigger advisory update
    return result