# syntax = docker/dockerfile:1

# Docker Hardened Images:
# - use `-dev` variants in build stages
# - use non-dev variants for runtime stages
ARG NODE_VERSION=22
FROM dhi.io/node:${NODE_VERSION}-dev AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Override NODE_ENV so devDependencies (Prisma CLI, TypeScript, etc.) are installed
ENV NODE_ENV="development"

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM dhi.io/node:${NODE_VERSION}

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
