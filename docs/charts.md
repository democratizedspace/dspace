# DSPACE Helm chart

The `charts/dspace` Helm chart deploys the DSPACE application with sensible defaults for
Traefik-based ingress, HTTP health checks, and optional configuration via ConfigMaps or Secrets.
It is a lightweight chart intended for direct Helm usage; Flux-managed environments continue to
use the existing production chart at `deploy/charts/dspace/`, which includes additional features
like network policies, metrics, and production ingress/TLS automation. The chart uses the
application container port `8080` by default, matching the `Dockerfile` `EXPOSE` and health check
settings.

## Key values

- `replicaCount`: Pod replica count. Defaults to `2` for redundancy.
- `nameOverride` / `fullnameOverride`: Optional overrides for release naming.
- `image.repository`: Defaults to `ghcr.io/democratizedspace/dspace`.
- `image.tag`: Image tag to deploy. Defaults to immutable recovery image `main-1a31a56`.
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
- `serviceMonitor.relabelings`: Optional list of extra Prometheus relabeling rules appended after
  the chart's five built-in `app`/`environment`/`namespace`/`release`/`cluster` relabelings.
  Defaults to `[]`. Requires `metrics.enabled=true` and `serviceMonitor.enabled=true`.

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

The chart is published to the GitHub Container Registry on `v3` pushes. Install it directly
from the OCI registry using the latest version (currently `3.0.1`; see
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

## v3.0.1 chart-only recovery release

Chart `3.0.2` is a chart-only recovery release for the canonical DSPACE application v3.0.1. It
defaults to the immutable `main-1a31a56` image built from
`1a31a569aff2dbeb238e8c2688b9e85140d2077d`; it must never fall back to the mutable `v3.0.1`
image tag. The chart keeps metrics and ServiceMonitor resources disabled by default and safely
renders the pre-observability production values contract when `metrics`, `metrics.auth`, or
`serviceMonitor` is absent or null.

Retain the long-lived `release/chart-3.0.x` branch while v3.0.1 remains an approved rollback
candidate. After the recovery PR merges into that branch, publication is permitted only by creating
`chart-v3.0.2` at the exact approved recovery-branch commit. Ordinary branch pushes and manual
branch dispatches cannot publish this chart. Chart `3.0.1` is permanently tombstoned and must not be
modified or republished.

Issue #4731 remains open after the implementation PR. Before it can be closed, independently verify
the single successful publication run and capture its full source SHA, OCI reference, packaged
archive SHA-256 digest, and OCI manifest digest. Creating or pushing the release tag and changing
GHCR or deployment state are separate, post-merge operator actions.

## v3.0.1 chart 3.0.3 observability compatibility patch

Chart `3.0.3` is a chart-only compatibility patch for the same canonical DSPACE application v3.0.1
described above; it does not promote or change the application version or the default
`main-1a31a56` image. It adds authenticated ServiceMonitor relabeling so Prometheus can attribute
scraped `/metrics` samples to `app`, `environment`, `namespace`, `release`, and `cluster` labels.
When `metrics.enabled=true` and `serviceMonitor.enabled=true`, the rendered `ServiceMonitor`
always includes five built-in `action: replace` relabelings, in this order: `app` (chart name via
`include "dspace.name" .`), `environment` (`.Values.environment`), `namespace`
(`.Release.Namespace`), `release` (`.Release.Name`), and `cluster` (`serviceMonitor.cluster`,
defaulting to `sugarkube`). Operators may append additional relabelings via the new
`serviceMonitor.relabelings` values key, which defaults to `[]`; any entries provided there are
rendered after the five built-in rules, in the order supplied.

This section is additive. The "v3.0.1 chart-only recovery release" section above documents chart
`3.0.2` and remains unchanged, immutable history; it is not superseded, rewritten, or deleted by
this patch.

As with chart `3.0.2`, merging this PR into `release/chart-3.0.x` does not publish anything.
Publication requires a separate, reviewed maintainer action creating the `chart-v3.0.3` tag at the
exact merged commit on this branch. This PR does not create or push that tag.
