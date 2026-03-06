from app.schemas import RatePredictionRequest


EQUIPMENT_BIAS: dict[str, float] = {
    "van": 1.0,
    "reefer": 1.2,
    "flatbed": 1.15,
}


def build_feature_vector(payload: RatePredictionRequest) -> list[float]:
    equipment_factor = EQUIPMENT_BIAS.get(payload.equipment_type.lower(), 1.0)
    return [
        payload.distance_miles,
        payload.weight_lbs or 0.0,
        payload.fuel_index or 0.0,
        equipment_factor,
    ]
