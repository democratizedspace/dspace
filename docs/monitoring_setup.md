# Monitoring Setup

This guide explains how to run Prometheus and Grafana to monitor your self-hosted DSPACE instance.

## Prerequisites

- Docker and Docker Compose installed
- DSPACE running via `docker compose`

## Quick Start

1. From the repository root, run:
   ```bash
   cd monitoring
   docker compose up -d
   ```
   This will start Prometheus on port **9090** and Grafana on **3001**.

2. Open `http://localhost:3001` in your browser and log in with the default credentials (`admin`/`admin`). You'll be prompted to change the password on first login.

3. Add Prometheus as a data source in Grafana using the URL `http://prometheus:9090`.

By default, Prometheus is configured to scrape the DSPACE metrics endpoint at
`http://host.docker.internal:3002/metrics`. If you run DSPACE on a different
port or host, update `monitoring/prometheus/prometheus.yml` accordingly.

You can now create dashboards to track container resource usage and the metrics
exposed by your DSPACE instance.

## Security Considerations

- The bundled `docker-compose.yml` binds Prometheus and Grafana to `127.0.0.1`
  so they are not reachable from other machines. If you need remote access,
  change the port mappings but ensure a firewall protects these services.
- Set custom Grafana credentials by exporting
  `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` before running
  `docker compose up`.
- The DSPACE metrics endpoint may expose operational details. Restrict access
  to trusted networks or add authentication if exposing it beyond localhost.

## Configuration

The `docker-compose.yml` file defines two services:

- **prometheus** – stores metrics using the configuration in `prometheus/prometheus.yml`.
- **grafana** – visualizes data from Prometheus and persists settings in the `grafana-data` volume.

Feel free to modify `prometheus/prometheus.yml` to scrape additional targets
such as node exporters or remote DSPACE instances.
