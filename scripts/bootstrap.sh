#!/usr/bin/env bash
set -euo pipefail

# Unified bootstrap entrypoint for local and CI-like environments.
bash scripts/bootstrap-environment.sh
bash scripts/bootstrap-deps-docker.sh
