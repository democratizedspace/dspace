# Docker Deployment

This guide explains how to run DSPACE using Docker.

## Prerequisites

- Docker 24 or newer
- The `docker compose` plugin

## Build and Run

Clone the repository and start the stack:

```bash
docker compose up --build -d
```

The application listens on port **3002**. Visit `http://localhost:3002` to confirm it is running.

### Troubleshooting

- **Host `node_modules` conflicts**: Local `node_modules` directories in the build context can
  cause Docker to fail with `cannot copy to non-directory` when the multi-stage image installs
  dependencies internally. The root `.dockerignore` excludes `node_modules` and other build
  artifacts (caches, output directories, and test reports) to keep builds reproducible.

## Environment Variables

The container reads these environment variables:

- `PORT` (default: `3002`)
- `HOST` (default: `0.0.0.0`)
- `METRICS_TOKEN` for the `/metrics` endpoint (optional)

To override them, create a `docker-compose.override.yml` file or pass them at runtime.

## Health Checks and Metrics

The Docker Compose file defines a health check against `GET /health` and exposes Prometheus metrics at `GET /metrics`.

## Updating

Pull the latest changes and rebuild:

```bash
git pull
docker compose up --build -d
```

Stop the containers with `docker compose down`.

## High Availability

For redundancy across multiple hosts, use [Cloudflare Load Balancing](../cloudflare_load_balancing.md)
to distribute traffic among instances. Each host exposes port **3002** through its own Cloudflare
Tunnel, and the load balancer handles health checks automatically.
