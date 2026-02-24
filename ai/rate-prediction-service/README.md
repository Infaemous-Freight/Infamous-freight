# Rate Prediction Service

FastAPI microservice scaffold for predictive freight rate estimation.

## Endpoints

- `GET /health`
- `POST /predict`

## Inputs

The `/predict` endpoint expects:

- `mileage`
- `fuel_price`
- `seasonality_index`
- `broker_score`

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8081 --reload
```
