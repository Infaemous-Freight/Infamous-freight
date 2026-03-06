from app.features import build_feature_vector
from app.schemas import RatePredictionRequest


def test_build_feature_vector() -> None:
    payload = RatePredictionRequest(
        origin_state="TX",
        destination_state="OK",
        distance_miles=250,
        equipment_type="reefer",
        weight_lbs=12000,
        fuel_index=3.5,
    )

    vector = build_feature_vector(payload)

    assert vector[0] == 250
    assert vector[1] == 12000
    assert vector[2] == 3.5
    assert vector[3] == 1.2
