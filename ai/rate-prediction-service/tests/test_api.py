from fastapi.testclient import TestClient

from app.api import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_predict_rate() -> None:
    response = client.post(
        "/predict-rate",
        json={
            "origin_state": "TX",
            "destination_state": "OK",
            "distance_miles": 300,
            "equipment_type": "van",
            "weight_lbs": 10000,
            "fuel_index": 3.2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["currency"] == "USD"
    assert body["predicted_rate_usd"] > 0
