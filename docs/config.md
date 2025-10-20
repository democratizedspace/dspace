# DSPACE v3 configuration reference

## Runtime environment variables

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | HTTP port exposed by the container and probes. | `8080` | No |
| `HOST` | Bind address for the Astro server. | `0.0.0.0` | No |
| `NODE_ENV` | Node runtime mode. | `production` | No |
| `METRICS_TOKEN` | Optional bearer token required to access `/metrics`. | _unset_ | Optional |
| `VITE_TOKEN_PLACE_URL` | Optional override for the token-place API endpoint. | _unset_ | Optional |

Set `METRICS_TOKEN` through a Kubernetes `Secret` so Prometheus can
scrape metrics without exposing them publicly. The Helm values files in
`deploy/env/` reference the following SOPS-encrypted secrets:

| Environment | Secret name | Keys |
| --- | --- | --- |
| `dev` | `dspace-dev-secrets` | `metrics-token` |
| `int` | `dspace-int-secrets` | `metrics-token` |
| `prod` | `dspace-prod-secrets` | `metrics-token` |

## Storage

The application is stateless by default. If you need persistence (for
uploads or generated assets), enable the `persistence` block in the Helm
values to provision a PVC mounted at `/app/data`. The example overlays
use the Longhorn storage class for integration and production clusters.

## Networking and ports

* Container listens on TCP `8080`.
* Kubernetes `Service` exposes port `80` by default.
* Liveness probe: `GET /livez`
* Readiness probe: `GET /healthz`
* Metrics endpoint: `GET /metrics` (optionally token protected)

Structured JSON logs and Prometheus-compatible metrics are emitted for
each HTTP request. The runtime traps `SIGTERM`/`SIGINT` and performs a
graceful shutdown before the pod terminates.
