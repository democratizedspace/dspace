# Monitoring

This stack runs [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/)
locally to collect and visualize metrics without sending data to third parties.

## Usage

```bash
docker-compose up
```

## Features

- Prometheus scrapes the DSpace metrics endpoint and evaluates alert rules.
- Grafana provisions a Prometheus data source and a sample dashboard.
- Alerts include `DspaceDown`, which fires when the `dspace` job stops reporting `up`.

All services are self-hosted to respect user privacy.
