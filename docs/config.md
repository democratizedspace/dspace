# DSPACE v3 Configuration Reference

DSPACE v3 runs as a single Node.js service built with Astro. All runtime configuration
is injected through environment variables so deployments stay immutable and predictable
across `dev`, `int`, and `prod` clusters.

## Environment Variables

| Name | Required | Description | Example | Source |
| --- | --- | --- | --- | --- |
| `PORT` | No (default `8080`) | TCP port that the HTTP server binds to. The Helm chart maps this to the service port automatically. | `8080` | ConfigMap / values.yaml |
| `HOST` | No (default `0.0.0.0`) | Interface for the listener. Leave at the default to accept traffic from the Service/Ingress. | `0.0.0.0` | ConfigMap / values.yaml |
| `NODE_ENV` | No (default `production`) | Sets Node.js runtime mode. Keep `production` for optimized builds. | `production` | ConfigMap / values.yaml |
| `DSPACE_FEATURE_FLAGS` | No | Comma-separated feature flag identifiers surfaced in readiness probes and startup logs. | `beta-chat,balance-panel` | ConfigMap / values.yaml |
| `METRICS_TOKEN` | Recommended | Bearer token that protects the `/metrics` endpoint. When set, Prometheus or other collectors must send `Authorization: Bearer <token>`. | *(generated)* | Kubernetes Secret (`dspace-secrets`, key `metricsToken` managed via SOPS) |
| `SERVER_CERT_PATH` | Optional | Path to a TLS certificate inside the container. Provide along with `SERVER_KEY_PATH` to terminate TLS in-process instead of via Traefik. | `/app/tls/tls.crt` | Kubernetes Secret (mounted volume) |
| `SERVER_KEY_PATH` | Optional | Private key paired with `SERVER_CERT_PATH`. | `/app/tls/tls.key` | Kubernetes Secret (mounted volume) |

> **Secrets**: `METRICS_TOKEN`, TLS material, and any future API keys should live in a SOPS-managed
> secret named `dspace-secrets` (see Helm values below). Flux/SOPS will render them into the
> cluster at deploy time.

## Observability & Probes

- **Liveness**: `GET /livez` returns `{ status: 'alive', uptimeSeconds, timestamp }`.
- **Readiness**: `GET /healthz` returns `{ status: 'ready', features: [], timestamp }` and echoes
  `DSPACE_FEATURE_FLAGS` so operators can confirm feature toggles in-flight.
- **Metrics**: `GET /metrics` exposes Prometheus counters/gauges via `prom-client`. Protect this
  endpoint with `METRICS_TOKEN`.
- **Logs**: The container emits structured JSON logs (fields: `time`, `level`, `msg`, etc.) and
  includes feature-flag metadata during startup and shutdown.

## Storage

DSPACE runs entirely from its build artefacts and does not require persistent storage by default.
If you enable persistence (for future worker state or exported assets), mount a PVC at `/app/data`.
The Helm chart exposes `persistence.*` values for provisioning a Longhorn-backed volume with
`ReadWriteOnce` by default. Switch to `ReadWriteMany` if multiple replicas must share the same data.

## Networking & Ports

The container listens on port `8080` internally. The Helm chart configures:

- A `ClusterIP` service exposing port `8080`.
- Traefik ingress with cert-manager TLS annotations.
- A network policy allowing ingress from Traefik and egress only for DNS and HTTPS traffic.

Cloudflared provides outbound access from the cluster; no extra configuration is required within the
container beyond the defaults above.
