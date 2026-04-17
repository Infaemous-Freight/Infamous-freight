# Docker CLI Cheat Sheet

Quick reference for common Docker commands used in local development and operations.

## Installation & Docs

- Docker Desktop (Mac, Linux, Windows): https://docs.docker.com/desktop
- Example compose projects: https://github.com/docker/awesome-compose
- Docker docs: https://docs.docker.com

## General Commands

```bash
# Docker help
docker --help

# System-wide Docker information
docker info
```

## Images

```bash
# Build image from Dockerfile
docker build -t <image_name> .

# Build without cache
docker build --no-cache -t <image_name> .

# List local images
docker images

# Delete an image
docker rmi <image_name>

# Remove unused images
docker image prune
```

## Containers

```bash
# Run a container with custom name
docker run --name <container_name> <image_name>

# Run and publish ports
docker run -p <host_port>:<container_port> <image_name>

# Run detached
docker run -d <image_name>

# Start / stop by name
docker start <container_name>
docker stop <container_name>

# Start / stop by id
docker start <container_id>
docker stop <container_id>

# Remove stopped container
docker rm <container_name>

# Shell into running container
docker exec -it <container_name> sh

# Follow logs
docker logs -f <container_name>

# Inspect container
docker inspect <container_name>
docker inspect <container_id>

# List running containers
docker ps

# List all containers
docker ps --all

# Container resource usage
docker container stats
```

## Docker Hub

```bash
# Login
docker login -u <username>

# Push
docker push <username>/<image_name>

# Search
docker search <image_name>

# Pull
docker pull <image_name>
```

## Fast Practical Subset

```bash
docker build -t myapp .
docker images
docker run -d -p 8080:80 --name myapp-container myapp
docker ps
docker logs -f myapp-container
docker exec -it myapp-container sh
docker stop myapp-container
docker rm myapp-container
docker rmi myapp
```
