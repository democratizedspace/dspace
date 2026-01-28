---
title: 'Self-hosting DSPACE'
slug: 'self-hosting'
---

# Self-hosting DSPACE

Run your own DSPACE instance on your hardware. Docker Compose builds the site and serves it
locally.

## Requirements

- Git
- Docker and Docker Compose

## Quick start

1. Clone this repository and enter the directory:
    ```bash
    git clone https://github.com/democratizedspace/dspace.git
    cd dspace
    ```
2. Build and launch the production container from the repository root:
    ```bash
    docker compose up --build -d
    ```
    The site will be available at `http://localhost:8080`.
3. Stop the container at any time with:
    ```bash
    docker compose down
    ```

## Frontend-only compose file (optional)

If you only need the frontend for local development, `frontend/docker-compose.yml` runs the
frontend dev server and maps port `3002`. Use it from the `frontend/` directory:

```bash
cd frontend
docker compose up --build -d
```

## Advanced guides

These additional documents cover more complex deployments:

- [Raspberry Pi k3s Deployment][raspi-k3s]
- [Failover Procedures][failover]
- [Monitoring Setup][monitoring]

[raspi-k3s]: https://github.com/democratizedspace/dspace/blob/main/docs/ops/RPI_DEPLOYMENT_GUIDE.md
[failover]: https://github.com/democratizedspace/dspace/blob/main/docs/ops/failover_procedures.md
[monitoring]: https://github.com/democratizedspace/dspace/blob/main/docs/ops/monitoring_setup.md
