---
title: 'Self-hosting DSPACE'
slug: 'self-hosting'
---

# Self-hosting DSPACE

Run your own DSPACE instance on your hardware. The repository ships with two Docker Compose
configurations:

- **Root `docker-compose.yml`** for the full production-style build (serves on port 8080).
- **`frontend/docker-compose.yml`** for the frontend-only dev server (serves on port 3002).

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
    The site will be available at `http://localhost:8080`.
3. Stop the container at any time with:
    ```bash
    docker compose down
    ```

## Helper script

The repository includes a convenience script that proxies common Docker commands. It is geared
toward the frontend Docker Compose setup (port 3002). If it does not match your deployment, use
`docker compose` directly instead.

```bash
./run-dspace.sh start   # start the app
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
