# DSPACE Helm chart

The `charts/dspace` Helm chart deploys the DSPACE application with sensible defaults for
Traefik-based ingress, HTTP health checks, and optional configuration via ConfigMaps or Secrets.
It is the canonical chart packaged by the GHCR Helm publishing workflow for direct Helm and
Sugarkube usage; do not rely on the duplicate `deploy/charts/dspace/` tree for canonical release
evidence. The chart uses the application container port `8080` by default, matching the
`Dockerfile` `EXPOSE` and health check settings.

## Key values

- `replicaCount`: Pod replica count. Defaults to `2` for redundancy.
- `nameOverride` / `fullnameOverride`: Optional overrides for release naming.
- `image.repository`: Defaults to `ghcr.io/democratizedspace/dspace`.
- `image.tag`: Image tag to deploy. Defaults to `v3.0.1`, matching the current package version.
- `image.pullPolicy`: Defaults to `IfNotPresent`.
- `service.type`: Kubernetes service type. Defaults to `ClusterIP`.
- `service.port`: Container and service port. Defaults to `8080`.
- `ingress.enabled`: Enable Traefik ingress. Defaults to `false`.
- `ingress.host`: Hostname routed to the service. Required when ingress is enabled.
- `ingress.className`: Ingress class name. Defaults to `traefik`.
- `ingress.tls.enabled`: Enable TLS termination on the ingress. Defaults to `false`.
- `ingress.tls.secretName`: Secret containing the TLS certificate when TLS is enabled.
- `serviceAccount.create`: Create a service account for the deployment. Defaults to `true` with
  token automount disabled.
- `podSecurityContext` / `securityContext`: Hardened defaults with non-root user/group `1000`,
  `runAsNonRoot: true`, dropped capabilities, read-only root filesystem, and `seccompProfile:
RuntimeDefault`.
- `ingress.annotations`: Map of annotations applied to the ingress object.
- `resources.requests` / `resources.limits`: Default to `500m` CPU / `768Mi` memory requests and
  `1` CPU / `1536Mi` memory limits, matching the production baseline. Override as needed for
  smaller clusters.
- `configMap.enabled` and `configMap.data`: Optional key-value pairs exposed as a ConfigMap.
- `secret.enabled` and `secret.stringData`: Optional key-value pairs exposed as a Secret.
- `probes.livenessPath` and `probes.readinessPath`: HTTP probe paths, defaulting to `/livez`
  (liveness) and `/healthz` (readiness) respectively.
- `probes.liveness` / `probes.readiness`: Probe timing defaults (`initialDelaySeconds`,
  `periodSeconds`, `timeoutSeconds`, `failureThreshold`).
- `metrics.enabled`: Enable the application `/metrics` endpoint guard wiring. Defaults to `false`.
- `metrics.auth.existingSecret` / `metrics.auth.secretKey`: Existing Secret reference used to
  inject `METRICS_TOKEN`; no token value belongs in chart values.
- `serviceMonitor.enabled`: Render one Prometheus Operator `ServiceMonitor`. Defaults to `false`.
- `serviceMonitor.additionalLabels`: Extra labels for discovery, defaulting to
  `release: kube-prometheus-stack`.

For development, `charts/dspace/values.dev.yaml` enables ingress and sets a placeholder host:
`dspace-v3.example.dev`. Override this host for your own environment.

## Common commands

Lint the chart and render the manifests with development values:

```bash
npm run helm:lint
npm run helm:template
```

## Install example

Deploy the chart with a custom host and image tag:

```bash
helm install dspace charts/dspace \
  -f charts/dspace/values.dev.yaml \
  --set ingress.host=dspace.example.com \
  --set image.tag=v3.0.1
```

Replace `dspace.example.com` with a domain routed to your Traefik ingress controller.

## Install from GHCR (OCI)

For the standard Sugarkube staging and production flow, use the
[DSPACE Sugarkube release runbook](./ops/sugarkube-release.md) as the source of truth. The direct
Helm commands below remain useful for local clusters, development environments, and manual chart
inspection.

The chart is published to the GitHub Container Registry on `v3` and `main` pushes. Install it
directly from the OCI registry using the latest version (currently `3.0.1`; see
`docs/apps/dspace.version` or the registry for available versions):

```bash
helm install dspace oci://ghcr.io/democratizedspace/charts/dspace \
  --version 3.0.1 \
  --set ingress.enabled=true \
  --set ingress.host=dspace.example.com \
  --set image.tag=v3.0.1
```

When installing from the OCI registry, you will not have access to
`charts/dspace/values.dev.yaml` unless you clone the repository. To customize values, either
provide your own file with `-f <your-values.yaml>` or use `--set` flags as shown above.
Replace `dspace.example.com` with a domain routed to your Traefik ingress controller.

## Metrics and Prometheus ServiceMonitor

The canonical chart keeps the metrics scrape contract disabled by default so local installs and
existing releases do not need a metrics Secret:

```yaml
metrics:
  enabled: false
  path: /metrics
  auth:
    existingSecret: ''
    secretKey: token
serviceMonitor:
  enabled: false
```

For Sugarkube staging, create a Kubernetes Secret out of band and reference only its fake example
name from values. Do not place the token value in Helm values, rendered templates, docs, or logs.
The ServiceMonitor uses Prometheus Operator `authorization.credentials` Secret wiring, labels the
resource for kube-prometheus-stack discovery, selects only the DSPACE Service from this Helm
release, and scrapes the named `http` application port at `/metrics`:

```yaml
metrics:
  enabled: true
  path: /metrics
  auth:
    existingSecret: dspace-metrics-token-example
    secretKey: token
serviceMonitor:
  enabled: true
  interval: 30s
  scrapeTimeout: 10s
  additionalLabels:
    release: kube-prometheus-stack
  cluster: sugarkube-staging
  relabelings: []
```

The chart does not create Prometheus, Grafana, a metrics Ingress, or a separate metrics Service.
If the public Prefix ingress can reach `/metrics`, the application-side `METRICS_TOKEN` guard is
still required. Prometheus can scrape with the Secret while unauthenticated public requests should
receive `401` or another deliberate denial.

Verification examples:

```bash
# Internal success from a trusted operator shell; keep the token out of command history when possible.
METRICS_TOKEN="$(kubectl -n dspace get secret dspace-metrics-token-example -o jsonpath='{.data.token}' | base64 -d)"
kubectl -n dspace run dspace-metrics-check --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- \
  curl -fsS -H "Authorization: Bearer ${METRICS_TOKEN}" http://dspace:8080/metrics

# Public denial through the normal public ingress.
curl -i https://dspace-staging.example.com/metrics
```
