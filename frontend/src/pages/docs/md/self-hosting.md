---
title: 'Self-hosting DSPACE'
slug: 'self-hosting'
---

# Self-hosting DSPACE

Run your own DSPACE instance on your hardware. The repo ships with Docker Compose definitions for
the production container (root `docker-compose.yml`) and a frontend-only dev container
(`frontend/docker-compose.yml`).

## Requirements

- Git
- Docker and Docker Compose

## Quick start

1. Clone this repository and enter the directory:
    ```bash
    git clone https://github.com/democratizedspace/dspace.git
    cd dspace
    ```
2. Build and launch the production container:
    ```bash
    docker compose up -d
    ```
    The production container listens on `http://localhost:8080`.
3. Stop the container at any time with:
    ```bash
    docker compose down
    ```

## Frontend-only dev container

If you only need the frontend development server (no backend services), you can use the compose
file in `frontend/`:

```bash
cd frontend
docker compose up -d
```

This exposes the dev server at `http://localhost:3002`.

## Helper script

The repository includes a convenience script that proxies common Docker commands. It uses the
frontend compose file for local dev and Playwright runs:

```bash
./run-dspace.sh start   # start the frontend dev container
./run-dspace.sh stop    # stop containers
```

## Advanced guides

These additional documents cover more complex deployments:

- [Raspberry Pi k3s Deployment][raspi-k3s]
- [Failover Procedures][failover]
- [Monitoring Setup][monitoring]

[raspi-k3s]: https://github.com/democratizedspace/dspace/blob/main/docs/deploy/raspi.md
[failover]: https://github.com/democratizedspace/dspace/blob/main/docs/failover_procedures.md
[monitoring]: https://github.com/democratizedspace/dspace/blob/main/docs/monitoring_setup.md
