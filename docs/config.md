# DSPACE v3 runtime configuration

This document captures the environment variables, Kubernetes Secrets, and
storage requirements needed to operate the DSPACE v3 container image on k3s.

## Environment variables

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `PORT` | No | TCP port the Node server listens on. Must match the service port in the Helm values. | `8080` |
| `HOST` | No | Interface binding for the HTTP listener. Default is `0.0.0.0` inside the container. | `0.0.0.0` |
| `NODE_ENV` | No | Node environment hint. Set to `production` in all clusters. | `production` |
| `METRICS_TOKEN` | Optional | Bearer token required to read `/metrics`. Configure via a Secret to restrict access. | `super-secret-token` |
| `DSPACE_FEATURE_FLAGS` | Optional | Comma-separated feature toggles consumed by the frontend. Scoped per environment via Helm values. | `beta-chat,debug-panels` |
| `VITE_TOKEN_PLACE_URL` | Optional | Overrides the remote token API endpoint when the frontend runs custom integrations. | `https://tokens.dev/api` |

All variables can be defined through `values.yaml` under `env.vars` (plain text)
or `env.secretRefs` (Secret sourced) in the Helm chart.

## Secrets

Helm values reference Secrets managed via SOPS:

- `dspace-dev-secrets` – includes `metrics-token` key for the development
  cluster.
- `dspace-int-secrets` – houses the same key for integration.
- `dspace-prod-secrets` – production copy with restricted access.

Each Secret stores the Prometheus metrics token under the `metrics-token` key.
Add other sensitive values (such as custom API tokens) under additional keys and
map them through `env.secretRefs`.

## Storage

By default the chart runs stateless. Enable the persistent volume claim by
setting `persistence.enabled=true`. The default request is `1Gi` but production
values bump this to `5Gi` on the Longhorn storage class. The mount path inside
the container is `/data`, which the application can use for cached assets or
future persistence features.

## Ports and probes

- Container listens on port `8080` (`/` routes served by Astro).
- Readiness probe: `GET /healthz` (JSON payload `{ "status": "ok" }`).
- Liveness probe: `GET /livez` (plain text `ok`).
- Metrics endpoint: `GET /metrics` (Prometheus exposition format, optional
  bearer token).

## Graceful shutdown and observability

The container entrypoint traps `SIGTERM`/`SIGINT`, stops the Astro Node server,
and emits JSON-formatted structured logs. Default Prometheus counters are
collected via `prom-client`, and the optional `ServiceMonitor` template can be
enabled per environment.
