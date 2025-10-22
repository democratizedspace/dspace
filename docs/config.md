# DSPACE v3 Configuration Reference

DSPACE v3 runs as a single Node.js service built with Astro. All runtime configuration
is injected through environment variables so deployments stay immutable and predictable
across `dev`, `int`, and `prod` clusters.

## Container Images

- The CI pipeline publishes multi-architecture images (`linux/amd64` and `linux/arm64`) to
  [GHCR](https://ghcr.io/) and tags every push with an immutable `sha-<full commit>` identifier so
  clusters can pin exact builds.

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

## Environment overlays

Three Flux overlays live in `deploy/env/{dev,int,prod}`. Each overlay packages its `values.yaml`
into a deterministic ConfigMap that the corresponding `HelmRelease` consumes. The table below
summarises the runtime differences so operators can confirm hostnames, scaling choices, and
feature toggles without opening each values file.

| Environment | Hostname | Image strategy | Metrics | Feature flags | Notes |
| --- | --- | --- | --- | --- | --- |
| dev | `dev.dspace.example.com` | Follows tag `main` for rapid iteration | Disabled (`serviceMonitor.enabled=false`) | `beta-chat` | Single replica, metrics exporter left off to minimize noise. |
| int | `int.dspace.example.com` | Pins an immutable digest for release verification | Enabled (`serviceMonitor` scrapes namespace `dspace`) | `beta-chat,balance-panel` | Autoscaling between two and four replicas with 60% CPU target. |
| prod | `dspace.example.com` | Pins an immutable digest for production rollouts | Enabled (`serviceMonitor` scrapes namespace `dspace`) | `beta-chat,balance-panel,observability` | Alerts enabled and resources raised (500m/768Mi requests). |

Flux consumption details:

- `deploy/env/dev/kustomization.yaml` renders `dspace-dev-values` and `helmrelease.yaml` mounts it
  via `valuesFrom`, so Flux keeps development hosts and feature flags in sync.
- `deploy/env/int/kustomization.yaml` emits `dspace-int-values`; the integration release tracks a
  pinned digest while allowing HPA to scale between two and four replicas.
- `deploy/env/prod/kustomization.yaml` publishes `dspace-prod-values`, which keeps production on a
  digest-only image, enables alerting, and shares the metrics namespace with the integration
  overlay.

## Observability & Probes

- **Liveness**: `GET /livez` returns `{ status: 'alive', uptimeSeconds, timestamp }`.
- **Readiness**: `GET /healthz` returns `{ status: 'ready', features: [], timestamp }` and echoes
  `DSPACE_FEATURE_FLAGS` so operators can confirm feature toggles in-flight.
- **Metrics**: `GET /metrics` exposes Prometheus counters/gauges via `prom-client`. Protect this
  endpoint with `METRICS_TOKEN`.
- **Kubernetes probes**: The Helm chart issues HTTP GET probes against `/livez` and `/healthz` on
  port `8080` with a `terminationGracePeriodSeconds` of 30 to ensure in-flight requests drain
  cleanly during rollouts.
- **Prometheus ServiceMonitor**: Disabled by default. Set `serviceMonitor.enabled=true` in
  environment values to create a `ServiceMonitor` that scrapes the dedicated `metrics` port (9464)
  at `/metrics`, tags the resource with `release: kube-prometheus-stack`, and defaults discovery to
  the Helm release namespace while still allowing `namespaceSelector` overrides when the target
  Service lives elsewhere. When metrics are enabled, the Helm `NetworkPolicy` also admits traffic
  from the namespace configured via `networkPolicy.metricsScraper` (default `monitoring`) so the
  collector can reach the metrics port.
- **Logs**: The container emits structured JSON logs (fields: `time`, `level`, `msg`, etc.) and
  includes feature-flag metadata during startup and shutdown.

## Scaling & Resources

- Default container resources request `100m` CPU / `128Mi` memory with limits of `300m` CPU /
  `256Mi` memory to suit Raspberry Pi 5-class nodes. Override `resources.requests` or
  `resources.limits` per environment if additional capacity is required.
- Horizontal Pod Autoscaling is optional. Enable it by setting `autoscaling.enabled=true` and tune
  `minReplicas`, `maxReplicas`, and `targetCPUUtilizationPercentage` (default `60`) through the
  values files.

## Storage

DSPACE runs entirely from its build artefacts and does not require persistent storage by default.
If you enable persistence (for future worker state or exported assets), mount a PVC at `/app/data`.
The Helm chart exposes `persistence.*` values for provisioning a Longhorn-backed volume with
`ReadWriteOnce` by default. Switch to `ReadWriteMany` if multiple replicas must share the same data.

## Networking & Ports

The container listens on port `8080` internally. The Helm chart configures:

- A `ClusterIP` service exposing port `8080`.
- Traefik ingress (`ingressClassName: traefik`) annotated for cert-manager using
  `cert-manager.io/cluster-issuer: letsencrypt-dns01`. Each environment overlay defines the host
  list and TLS secret name.
- A default-deny `NetworkPolicy` that allows ingress from Traefik for web traffic and, when metrics
  are enabled, from the Prometheus namespace specified by `values.networkPolicy.metricsScraper`.
  DNS egress to `kube-dns` stays open; use `values.networkPolicy.extraIngress` or
  `values.networkPolicy.extraEgress` to permit additional peers as needed.

Cloudflared provides outbound access from the cluster; no extra configuration is required within the
container beyond the defaults above.
