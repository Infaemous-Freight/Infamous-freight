# ai

## Purpose
Standalone AI / ML services, especially Python-based inference and rate prediction.

## Owns
- model-serving runtimes
- inference APIs
- feature engineering local to ML services
- ML-specific Docker/runtime assets

## Does not own
- TypeScript app-layer AI runtime inside `apps/ai`
- shared contracts that belong in `packages/shared`

## Runbook / entrypoints
- service entrypoint: see local service README/files
- Docker runtime: see `docker/` and local Dockerfile

## Owner
AI Platform
