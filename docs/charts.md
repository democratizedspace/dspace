# DSPACE Helm chart

The `charts/dspace` Helm chart deploys the DSPACE application with sensible defaults for
Traefik-based ingress, HTTP health checks, optional configuration via ConfigMaps or Secrets, and an
explicit opt-in Prometheus scrape contract. This chart is the canonical GHCR/Sugarkube chart path;
do not rely on `deploy/charts/dspace/` for release scrape behavior unless release automation is
intentionally migrated. The chart uses the application container port `8080` by default, matching
the `Dockerfile` `EXPOSE` and health check settings.

## Key values

- `replicaCount`: Pod replica count. Defaults to `2` for redundancy.
- `nameOverride` / `fullnameOverride`: Optional overrides for release naming.
- `image.repository`: Defaults to `ghcr.io/democratizedspace/dspace`.
- `image.tag`: Image tag to deploy. Defaults to `v3.0.1`, matching the current package version.
- `image.pullPolicy`: Defaults to `IfNotPresent`.
- `service.type`: Kubernetes service type. Defaults to `ClusterIP`.
- `service.port`: Container and service port. Defaults to `8080`.
- `metrics.enabled`: Enable the application `/metrics` endpoint contract. Defaults to `false`.
- `metrics.path`: Metrics scrape path. Defaults to `/metrics`.
- `metrics.auth.existingSecret`: Existing Secret name used for the bearer credential. Empty by
  default, so the default render does not require a Secret.
- `metrics.auth.secretKey`: Secret key read for `METRICS_TOKEN` and Prometheus bearer
  authorization. Defaults to `token`.
- `serviceMonitor.enabled`: Render one Prometheus Operator `ServiceMonitor` only when explicitly
  enabled. Defaults to `false`.
- `serviceMonitor.interval` / `serviceMonitor.scrapeTimeout`: Defaults to `30s` and `10s`. Keep
  the timeout below the interval.
- `serviceMonitor.additionalLabels`: Labels for Prometheus discovery. The Sugarkube-compatible
  default is `release: kube-prometheus-stack`.
- `serviceMonitor.cluster`, `serviceMonitor.targetLabels`, `serviceMonitor.relabelings`, and
  `serviceMonitor.metricRelabelings`: Bounded metadata hooks for cluster, app, namespace,
  environment, release, and any future operator-approved relabeling.
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

For development, `charts/dspace/values.dev.yaml` enables ingress and sets a placeholder host:
`dspace-v3.example.dev`. Override this host for your own environment.

## Common commands

Lint the chart and render the manifests with development values:

```bash
npm run helm:lint
npm run helm:template
```

## Metrics scrape modes

Default/local rendering keeps metrics disabled and does not require a metrics Secret:

```bash
helm template dspace charts/dspace -f docs/examples/dspace.values.local-disabled.yaml
```

Sugarkube staging can opt into the authenticated scrape contract with a pre-created Secret:

```bash
helm template dspace charts/dspace -f docs/examples/dspace.values.sugarkube-staging-metrics.yaml
```

When both `metrics.enabled` and `metrics.auth.existingSecret` are set, the Deployment injects
`METRICS_TOKEN` from `secretKeyRef`. When `serviceMonitor.enabled` is also set, the chart renders
exactly one `ServiceMonitor` that selects the current DSPACE Service by Helm release labels, scrapes
the named `http` port at `metrics.path`, and wires the same Secret through the Prometheus Operator
`authorization.credentials` bearer-token fields used by kube-prometheus-stack 58.2.0. The public
Ingress still routes the normal application prefix only; it does not create a Prometheus, Grafana,
separate metrics ingress, or unauthenticated metrics bypass. Because the application Prefix ingress
can reach `/metrics`, keep application-side token authentication enabled for staging and production.

Internal success check after deploying staging values:

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
curl -fsS 'http://127.0.0.1:9090/api/v1/query?query=up%7Bapp%3D%22dspace%22%2Cenvironment%3D%22staging%22%7D'
```

Public denial check from outside the cluster:

```bash
curl -i https://dspace-staging.example.com/metrics
```

The public check must return `401` or another deliberate denial unless a request supplies the
approved bearer credential through trusted operational tooling.

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
