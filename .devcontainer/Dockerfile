FROM mcr.microsoft.com/devcontainers/javascript-node:1-24-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    postgresql-client \
    redis-tools \
    ca-certificates \
    curl \
    git \
    unzip \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

USER vscode

RUN corepack enable \
  && corepack prepare pnpm@10.33.0 --activate \
  && pnpm --version \
  && node --version \
  && npm --version
