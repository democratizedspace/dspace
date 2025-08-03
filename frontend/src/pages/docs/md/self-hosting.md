---
title: 'Self-hosting DSPACE'
slug: 'self-hosting'
---

# Self-hosting DSPACE

Run your own DSPACE instance on your hardware. Docker Compose builds the site and
serves it locally.

## Requirements

-   Git
-   Docker and Docker Compose

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
    The site will be available at `http://localhost:3002`.
3. Stop the container at any time with:
    ```bash
    docker compose down
    ```

## Helper script

The repository includes a convenience script that proxies common Docker
commands. Use it from the repository root:

```bash
./run-dspace.sh start   # start the app
./run-dspace.sh stop    # stop containers
```

## Advanced guides

These additional documents cover more complex deployments:

-   [Raspberry Pi k3s Deployment](https://github.com/democratizedspace/dspace/blob/v3/docs/deploy/raspi.md)
-   [Failover Procedures](https://github.com/democratizedspace/dspace/blob/v3/docs/failover_procedures.md)
-   [Monitoring Setup](https://github.com/democratizedspace/dspace/blob/v3/docs/monitoring_setup.md)
