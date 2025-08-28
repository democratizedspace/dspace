# Monitoring

This stack runs [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/)
locally to collect and visualize metrics without sending data to third parties.

## Usage

```bash
docker-compose up
```

Once the containers start:

- Prometheus is available at [http://localhost:9090](http://localhost:9090).
- Grafana runs at [http://localhost:3000](http://localhost:3000) with a preloaded
  **DSpace Overview** dashboard.

## Features

- Prometheus scrapes the DSpace metrics endpoint and evaluates alert rules.
- Grafana provisions a Prometheus data source and a sample dashboard.
- The dashboard shows service availability and HTTP 5xx error rate over time.
- Metrics follow standard Prometheus naming such as `up` and `http_requests_total`.

## Alerts

### DspaceDown

Alert expression:

```promql
up{job="dspace"} == 0
```

Fires when the `dspace` job stops reporting `up` for one minute.

**Runbook**

1. Check the application logs for crashes or outages.
2. Restart the DSpace service if it is not running.

### DspaceHighErrorRate

Alert expression:

```promql
rate(http_requests_total{job="dspace",status=~"5.."}[5m]) /
rate(http_requests_total{job="dspace"}[5m]) > 0.05
```

Triggers when more than 5% of HTTP requests return 5xx status codes for five minutes.

**Runbook**

1. Inspect recent server logs for stack traces or failed requests.
2. Investigate upstream dependencies that might be causing errors.

All services are self-hosted to respect user privacy.
