#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="dhi.io/github-mcp:0"

echo "==> Logging into registry"
docker login dhi.io

echo "==> Pulling image"
docker pull "$IMAGE"

echo "==> Docker Scout scan"
if command -v docker >/dev/null 2>&1; then
  docker scout cves "$IMAGE"
else
  echo "Docker not found"
fi

echo "==> Trivy scan"
if command -v trivy >/dev/null 2>&1; then
  trivy image --scanners vuln --vex repo "$IMAGE"
else
  echo "Trivy not installed, skipping"
fi

echo "==> Grype scan"
if command -v grype >/dev/null 2>&1; then
  if [ -f vex.json ]; then
    grype "$IMAGE" --vex vex.json
  else
    echo "vex.json not found, running Grype without VEX file"
    grype "$IMAGE"
  fi
else
  echo "Grype not installed, skipping"
fi

echo "==> Done"
