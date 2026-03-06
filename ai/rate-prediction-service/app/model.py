from app.features import build_feature_vector
from app.schemas import RatePredictionRequest
from app.config import MODEL_VERSION
def predict_rate(payload: RatePredictionRequest) -> float:
    features = build_feature_vector(payload)

    distance = features[0]
    weight = features[1]
    fuel_index = features[2]
    equipment_factor = features[3]

    base = distance * 2.15
    weight_adj = weight * 0.00008
    fuel_adj = fuel_index * 0.35

    prediction = (base + weight_adj + fuel_adj) * equipment_factor
    return round(prediction, 2)
