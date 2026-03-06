from fastapi import FastAPI

from app.schemas import RatePredictionRequest, RatePredictionResponse
from app.service import generate_rate_prediction

app = FastAPI(title="Infamous Freight Rate Prediction Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict-rate", response_model=RatePredictionResponse)
def predict_rate_endpoint(payload: RatePredictionRequest) -> RatePredictionResponse:
    return generate_rate_prediction(payload)
