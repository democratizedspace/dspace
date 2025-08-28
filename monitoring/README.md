# Monitoring

This stack runs [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/)
locally to collect and visualize metrics without sending data to third parties.

## Usage

```bash
docker-compose up
```

### Access

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default `admin`/`admin`)
- DSpace Overview dashboard: http://localhost:3000/d/dspace-overview/dspace-overview

## Features

- Prometheus scrapes the DSpace metrics endpoint and evaluates alert rules.
- Grafana provisions a Prometheus data source and a sample dashboard.
- The dashboard shows service availability and HTTP 5xx error rate over time.
- Metrics follow Prometheus conventions: `up{job="dspace"}` reports service health and
  `http_requests_total{job="dspace",status=...}` tracks request outcomes.

## Alerts

### DspaceDown

Fires when the `dspace` job stops reporting `up` for one minute.

**Runbook**

1. Check the application logs for crashes or outages.
2. Restart the DSpace service if it is not running.

### DspaceHighErrorRate

Triggers when more than 5% of HTTP requests return 5xx status codes for five
minutes.

**Runbook**

1. Inspect recent server logs for stack traces or failed requests.
2. Investigate upstream dependencies that might be causing errors.

All services are self-hosted to respect user privacy.
