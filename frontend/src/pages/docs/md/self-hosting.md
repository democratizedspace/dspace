---
title: 'Self-hosting DSPACE'
slug: 'self-hosting'
---

# Self-hosting DSPACE

Run your own DSPACE instance on your hardware. The repository includes a production-ready Docker
Compose file at the repo root.

## Requirements

- Git
- Docker and Docker Compose

## Quick start (production container)

1. Clone this repository and enter the directory:
    ```bash
    git clone https://github.com/democratizedspace/dspace.git
    cd dspace
    ```
2. Build and launch the production container:
    ```bash
    docker compose up -d --build
    ```
    The site will be available at `http://localhost:8080`.
3. Stop the container at any time with:
    ```bash
    docker compose down
    ```

## Helper script (optional)

The repository includes a convenience script for Docker workflows:

```bash
./run-dspace.sh start   # start the app via Docker Compose
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
