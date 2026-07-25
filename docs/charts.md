# DSPACE Helm chart

The `charts/dspace` Helm chart deploys the DSPACE application with sensible defaults for
Traefik-based ingress, HTTP health checks, optional configuration via ConfigMaps or Secrets, and an
explicit opt-in Prometheus scrape contract. This is the canonical chart packaged by the DSPACE GHCR
Helm publishing workflow. Do not use `deploy/charts/dspace/` as release evidence unless release
automation is intentionally migrated. The chart uses the application container port `8080` by
default, matching the `Dockerfile` `EXPOSE` and health check settings.

## Key values

- `replicaCount`: Pod replica count. Defaults to `2` for redundancy.
- `nameOverride` / `fullnameOverride`: Optional overrides for release naming.
- `image.repository`: Defaults to `ghcr.io/democratizedspace/dspace`.
- `image.tag`: Image tag to deploy. Defaults to the human-readable semantic application tag
  `v3.1.0`; it is not an immutable deployment coordinate. Use a branch-SHA tag or digest when
  recording or proving the exact deployed image.
- `image.pullPolicy`: Defaults to `IfNotPresent`.
- `service.type`: Kubernetes service type. Defaults to `ClusterIP`.
- `service.port`: Container and service port. Defaults to `8080`.
- `metrics.enabled`: Enables application-side metrics configuration. Defaults to `false`.
- `metrics.path`: Prometheus scrape path. Defaults to `/metrics`.
- `metrics.auth.existingSecret`: Existing Secret name that contains the bearer token for
  `METRICS_TOKEN`. Defaults to empty, so no Secret is required for default rendering; it is
  required when `metrics.enabled=true`.
- `metrics.auth.secretKey`: Secret key for the bearer token. Defaults to `token`.
- `serviceMonitor.enabled`: Renders a `monitoring.coreos.com/v1` `ServiceMonitor` only when set to
  `true`. Defaults to `false`.
- `serviceMonitor.interval` / `serviceMonitor.scrapeTimeout`: Default to `30s` and `10s`.
- `serviceMonitor.additionalLabels`: Labels for Prometheus Operator discovery. Defaults to
  `release: kube-prometheus-stack`, matching Sugarkube's current kube-prometheus-stack release
  label convention.
- `serviceMonitor.cluster`: Cluster metadata label used by the ServiceMonitor relabeling contract
  and, when ServiceMonitor is enabled, the Service target labels. Defaults to `sugarkube`.
- `serviceMonitor.relabelings`: Optional bounded target relabel hooks appended after the chart's
  default `app`, `environment`, `namespace`, `release`, and `cluster` relabels.
- `ingress.enabled`: Enable Traefik ingress. Defaults to `false`.
- `ingress.host`: Hostname routed to the service. Required when ingress is enabled.
- `ingress.className`: Ingress class name. Defaults to `traefik`.
- `ingress.tls.enabled`: Enable TLS termination on the ingress. Defaults to `false`.
- `ingress.tls.secretName`: Secret containing the TLS certificate when TLS is enabled.
- `serviceAccount.create`: Create a service account for the deployment. Defaults to `true` with
  token automount disabled.
- `podSecurityContext` / `securityContext`: Hardened defaults with non-root user/group `1000`,
  `runAsNonRoot: true`, dropped capabilities, read-only root filesystem, and
  `seccompProfile: RuntimeDefault`.
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
`dspace-v3.example.dev`. Override the host for your own environment. Metrics remain disabled in
dev values unless you opt in with your own Secret.

## Metrics and ServiceMonitor examples

Metrics are disabled by default for backward compatibility and to avoid requiring a Secret in local
development:

```yaml
metrics:
    enabled: false
serviceMonitor:
    enabled: false
```

Sugarkube staging can opt in with a pre-created Secret. The chart never stores or renders the token
value; it only references the Secret name and key. The ServiceMonitor uses `bearerTokenSecret`, which
is supported by the Prometheus Operator `monitoring.coreos.com/v1` ServiceMonitor endpoint API used
by kube-prometheus-stack, including Sugarkube's pinned stack. The newer `authorization` field is not
required for this contract and `bearerTokenSecret` remains compatible with older pinned CRDs.

```yaml
environment: staging
metrics:
    enabled: true
    path: /metrics
    auth:
        existingSecret: dspace-staging-metrics-token
        secretKey: token
serviceMonitor:
    enabled: true
    interval: 30s
    scrapeTimeout: 10s
    additionalLabels:
        release: kube-prometheus-stack
    cluster: sugarkube
```

The normal public ingress still routes `/` to the DSPACE service and does not create a separate
metrics ingress, Prometheus ingress, or Grafana ingress. When chart metrics are disabled, the
Deployment sets `METRICS_ENABLED=false` so the application deliberately returns `404` for `/metrics`,
including through a public Prefix ingress. Public metrics deployments must opt in with
`metrics.enabled=true` and `metrics.auth.existingSecret`; the chart fails rendering if metrics are
enabled without a Secret so the application receives `METRICS_TOKEN` and denies unauthenticated
public requests while Prometheus scrapes with the Secret. Optional
NetworkPolicy hardening can be added later, but application-side authentication remains required for
public Prefix ingress deployments.

Verification commands for an installed staging release, using fake names here as examples:

```bash
# Prometheus Operator discovery should show the single ServiceMonitor selected by the release label
kubectl -n dspace get servicemonitor dspace -l release=kube-prometheus-stack -o yaml

# Internal success: query Prometheus for the discovered and scraped DSPACE staging target
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
curl -fsS --get 'http://127.0.0.1:9090/api/v1/query' \
  --data-urlencode 'query=up{app="dspace",environment="staging"}'

# Public denial without a token should be 401 when metrics auth is enabled, or 404 when disabled
curl -i https://staging.democratized.space/metrics
```

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
  --set image.tag=v3.1.0
```

Replace `dspace.example.com` with a domain routed to your Traefik ingress controller.

## Install from GHCR (OCI)

For the standard Sugarkube staging and production flow, use the
[DSPACE Sugarkube release runbook](./ops/sugarkube-release.md) as the source of truth. The direct
Helm commands below remain useful for local clusters, development environments, and manual chart
inspection.

The chart is published only by pushing the exact tag `chart-v<chart-version>` (for example,
`chart-v3.1.0`). The tag must point to the reviewed immutable commit whose `Chart.yaml:version`
matches it exactly; ordinary `main` and `v3` pushes never publish charts. Publication checks GHCR
twice and fails closed unless the coordinate is authoritatively absent, so an existing chart
coordinate cannot be replaced. Chart version `3.0.1` is permanently tombstoned and cannot be
republished even if it appears absent (a later chart may still use application `appVersion: 3.0.1`).

The workflow stages provenance annotations without changing the tracked chart and records the full
source SHA, packaged archive digest, and OCI manifest digest in its successful run summary. The OCI
version comes from `Chart.yaml:version` and may differ from the application version in `appVersion`
and the package files. `docs/apps/dspace.version` pins the chart coordinate. After the publish
workflow has completed successfully, use this installation procedure:

```bash
helm install dspace oci://ghcr.io/democratizedspace/charts/dspace \
  --version 3.1.0 \
  --set ingress.enabled=true \
  --set ingress.host=dspace.example.com \
  --set image.tag=v3.1.0
```

When installing from the OCI registry, you will not have access to
`charts/dspace/values.dev.yaml` unless you clone the repository. To customize values, either
provide your own file with `-f <your-values.yaml>` or use `--set` flags as shown above.
Replace `dspace.example.com` with a domain routed to your Traefik ingress controller.

## Full-release relationship and evidence

Chart publication may occur independently, but a full application release requires the chart OCI
artifact and the immutable branch-SHA image to originate at the same approved 40-character commit.
Publish/verify the image first, publish/verify the chart second, and publish the GitHub release last.
The final release gate checks chart version, `appVersion`, OCI digest, and revision provenance before
creating the semantic image alias. Existing chart coordinates and semantic image tags remain
immutable and cannot be retried by overwriting them.

A successful GitHub release run uploads `dspace-release-manifest/dspace-release-manifest.json`. Its
schema-version-1 coordinates include the application and independently versioned chart versions,
full source revision, immutable branch-SHA `imageTag`, image index and platform digests, and chart
OCI digest. The `vX.Y.Z` image is enforced as an exact digest alias of that immutable image and is
human-readable evidence only; Helm values, deployments, and downstream promotion records should
select the manifest's immutable `imageTag` or digest.
