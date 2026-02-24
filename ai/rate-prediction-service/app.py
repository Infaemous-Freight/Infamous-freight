from fastapi import FastAPI
import joblib

app = FastAPI(title="Infamous Freight Rate Prediction Service")
model = joblib.load("rate_model.pkl")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(data: dict) -> dict[str, float]:
    prediction = model.predict([
        [
            data["mileage"],
            data["fuel_price"],
            data["seasonality_index"],
            data["broker_score"],
        ]
    ])
    return {"predicted_rate": float(prediction[0])}
