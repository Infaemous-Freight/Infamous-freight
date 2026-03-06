from app.model import MODEL_VERSION, predict_rate
from app.schemas import RatePredictionRequest, RatePredictionResponse


def generate_rate_prediction(payload: RatePredictionRequest) -> RatePredictionResponse:
    predicted = predict_rate(payload)
    return RatePredictionResponse(
        predicted_rate_usd=predicted,
        model_version=MODEL_VERSION,
    )
