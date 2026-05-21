# DSPACE production runbook: k3s + sugarkube

Related release docs:

- [Release procedure](./merge-plan.md)
- [Patch QA checklist (`v3.0.1`)](./qa/v3.0.1.md)
- [Feature QA checklist (`v3.1`)](./qa/v3.1.md)

## Topology and role (current live state)

- Environment: `env=prod`
- Public host: `https://democratized.space`
- Live cluster nodes: `sugarkube0`, `sugarkube1`, `sugarkube2`
- Availability model: 3-node HA
- QA Cheats: **OFF** (`DSPACE_ENV=prod`)

Production is the steady-state public environment. This runbook is for repeated releases and
rollbacks using immutable tags.

## `prod.democratized.space` guidance

`prod.democratized.space` is an optional alias/rehearsal host. It is **not** part of the default
production path to `democratized.space`, and it is never required for a normal production deploy.
Use it only when you explicitly want temporary rehearsal/preview validation.

## Release model for prod

- Deploy from immutable tags only (`main-<shortsha>`, `sha-<longsha>`, or release-tag artifacts
  such as `3.0.1`).
- Do not deploy mutable tags (`main-latest`, `v<package-version>`) to prod.
- Keep the previous known-good immutable tag available for explicit rollback.

See release workflow and branch/tag policy: [docs/merge-plan.md](./merge-plan.md).

## Prerequisites

- Access to prod cluster context (`env=prod`)
- sugarkube checkout at `~/sugarkube`
- GHCR pull access for image and chart artifacts
- Traefik and Cloudflare tunnel already configured for `democratized.space`
- tools: `just`, `kubectl`, `curl`

## Deploy approved immutable tag to prod

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_APPROVED_SHORTSHA
```

## Validate production health

```bash
kubectl -n dspace get deploy,po,svc,ingress
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
```

```bash
curl -fsS https://democratized.space/config.json
```

```bash
curl -fsS https://democratized.space/healthz
```

```bash
curl -fsS https://democratized.space/livez
```

## Optional: deploy release-tag artifact directly

Use the tag format published by `build.yml` (for example, git tag `v3.0.1` publishes image tag
`3.0.1`).

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=3.0.1
```

## Roll back production

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version tag=<previous-immutable-tag>
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
```

```bash
curl -fsS https://democratized.space/healthz
```

## Optional rehearsal on `prod.democratized.space`

Only use this when explicitly needed for rehearsal or temporary alias validation. It is not part of the default production flow.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod-subdomain.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

```bash
curl -fsS https://prod.democratized.space/healthz
```

If rehearsal succeeds and you proceed to production, switch back to `docs/examples/dspace.values.prod.yaml` for the real prod deployment.

## Troubleshooting and recovery notes

### Keep prod release scope strict

- Do not deploy staging RC tags to production unless explicitly promoted.
- For staging-only deploy windows, verify production/apex remains on the intended stable release
  by checking `https://democratized.space/config.json`.

### Prefer positional env arguments for Sugarkube commands

Use positional env form:

```bash
just up prod
just save-logs prod
```

### Fresh cluster install vs. existing release upgrade

If prod cluster state is rebuilt and the `dspace` release is missing, use install first:

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_APPROVED_SHORTSHA
```

Then return to `helm-oci-upgrade` for steady-state releases. Running upgrade first on a wiped
cluster can fail with `UPGRADE FAILED: "dspace" has no deployed releases`.

### GHCR Helm OCI auth failure handling

If chart pulls fail with `403 denied: denied`, re-auth to GHCR with a PAT that has
`read:packages`:

```bash
helm registry login ghcr.io
helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
```

### Cluster-level failures: use Sugarkube canonical docs/outage

DSPACE runbooks cover app deploy flows; Sugarkube owns cluster-level RCA and remediation:

- <https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md>
- <https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md>
- <https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_troubleshooting.md>
- <https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.md>
