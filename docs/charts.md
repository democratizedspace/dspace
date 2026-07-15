# DSPACE Helm chart

The `charts/dspace` Helm chart deploys the DSPACE application with sensible defaults for
Traefik-based ingress, HTTP health checks, and optional configuration via ConfigMaps or Secrets.
It is the canonical chart packaged and published by the GHCR Helm workflow for DSPACE releases.
Do not rely on the legacy duplicate `deploy/charts/dspace/` tree unless release automation is
intentionally migrated in the same change. The chart uses the application container port `8080` by
default, matching the `Dockerfile` `EXPOSE` and health check settings.

## Key values

- `replicaCount`: Pod replica count. Defaults to `2` for redundancy.
- `nameOverride` / `fullnameOverride`: Optional overrides for release naming.
- `image.repository`: Defaults to `ghcr.io/democratizedspace/dspace`.
- `image.tag`: Image tag to deploy. Defaults to `v3.0.1`, matching the current package version.
- `image.pullPolicy`: Defaults to `IfNotPresent`.
- `service.type`: Kubernetes service type. Defaults to `ClusterIP`.
- `service.port`: Container and service port. Defaults to `8080`.
- `metrics.enabled`: Enable the authenticated `/metrics` runtime contract. Defaults to `false`.
- `metrics.path`: Prometheus scrape path. Defaults to `/metrics`.
- `metrics.auth.existingSecret`: Existing Secret containing the Prometheus bearer token. Defaults to
  empty and never creates or embeds a token value.
- `metrics.auth.secretKey`: Key within `metrics.auth.existingSecret`. Defaults to `token`.
- `serviceMonitor.enabled`: Render a Prometheus Operator `ServiceMonitor` only when explicitly set
  to `true` with `metrics.enabled=true`. Defaults to `false`.
- `serviceMonitor.interval` / `serviceMonitor.scrapeTimeout`: Defaults to `30s` / `10s` so the
  timeout remains below the interval.
- `serviceMonitor.additionalLabels`: Labels applied to the `ServiceMonitor`; defaults to
  `release: kube-prometheus-stack` for Sugarkube discovery.
- `serviceMonitor.relabelings`: Optional bounded metadata relabeling hooks appended after the
  chart's app, namespace, environment, release, and cluster labels.
- `cluster`: Optional bounded cluster label used by the Service and scrape relabeling.
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


## Metrics scrape examples

### Local disabled mode

The default chart render is backward-compatible and does not require a metrics Secret:

```bash
helm template dspace charts/dspace \
  --namespace dspace-local
```

This renders no `ServiceMonitor`, no Prometheus/Grafana resources, no metrics ingress, and no
`METRICS_TOKEN` environment variable.

### Sugarkube staging mode

Create the Secret outside the chart with your secret-management process, then reference only its
name and key. The example uses a fake Secret name and intentionally does not include a token value:

```bash
helm upgrade --install dspace charts/dspace \
  --namespace dspace-staging \
  --set environment=staging \
  --set cluster=sugarkube-staging \
  --set metrics.enabled=true \
  --set metrics.auth.existingSecret=dspace-staging-metrics-token \
  --set metrics.auth.secretKey=token \
  --set serviceMonitor.enabled=true \
  --set serviceMonitor.additionalLabels.release=kube-prometheus-stack
```

The chart injects `METRICS_TOKEN` from the existing Secret and renders one
`monitoring.coreos.com/v1` `ServiceMonitor` that selects the release's DSPACE Service, scrapes the
named `http` port at `/metrics`, and uses Prometheus Operator `authorization.credentials` Secret
wiring supported by Sugarkube's pinned `kube-prometheus-stack` `58.2.0` / Prometheus Operator
`v0.73.1` CRD.

Verification examples after deployment:

```bash
# Internal success through Prometheus using the referenced Secret
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
curl -fsS 'http://127.0.0.1:9090/api/v1/query?query=up{app="dspace",environment="staging"}'

# Public denial: unauthenticated public metrics requests must fail deliberately
curl -i https://dspace-staging.example.com/metrics
```

A successful public-denial check returns `401` or another intentional denial. Because the normal
public ingress routes the application prefix, application-side `METRICS_TOKEN` authentication is
required whenever staging or production metrics are enabled.

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
