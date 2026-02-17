#!/bin/sh
set -e

echo "Starting Infamous Freight dev environment..."
cp .env.example .env 2>/dev/null || true

docker compose -f configs/docker/docker-compose.yml -f configs/docker/docker-compose.dev.yml up --build
