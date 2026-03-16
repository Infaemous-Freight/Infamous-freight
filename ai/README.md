# AI Services

This directory contains AI and ML services for Infæmous Freight.

## Current service
- `rate-prediction-service` — predicts freight rates from shipment and lane features

## Top-level files
- `Dockerfile` — container image definition
- `main.py` — local/dev entrypoint
- `requirements.txt` — Python dependencies

## Design goals
- deterministic feature engineering
- testable model-serving code
- containerized deployment
- clean separation between API, model logic, and schemas
