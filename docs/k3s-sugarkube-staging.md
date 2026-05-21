# DSPACE staging runbook: k3s + sugarkube

Related release docs:

- [Release procedure](./merge-plan.md)
- [Patch QA checklist (`v3.0.1`)](./qa/v3.0.1.md)
- [Feature QA checklist (`v3.1`)](./qa/v3.1.md)

## Topology and role (current live state)

- Environment: `env=staging`
- Public host: `https://staging.democratized.space`
- Live cluster nodes: `sugarkube3`, `sugarkube4`, `sugarkube5`
  - These are the hostnames used by this staging instantiation. Sugarkube operators may
    choose arbitrary hostnames for their own three-node HA staging clusters.
- Availability model: 3-node HA
- QA Cheats: **ON** (`DSPACE_ENV=staging`)

Staging is the canonical pre-production validation environment. It is where candidate tags are
validated before production promotion.

## Release model for staging

- Prefer immutable branch build tags from CI: `main-<shortsha>`.
- For tag-driven release candidates, use artifact tags published by `build.yml` from git tags
  (for example `3.1.0-rc.2` from git tag `v3.1.0-rc.2`).
- Avoid mutable tags (`main-latest`, `v<package-version>`) for release sign-off.

See the cross-environment release procedure: [docs/merge-plan.md](./merge-plan.md).

## Prerequisites

- Access to staging cluster context (`env=staging`)
- sugarkube checkout at `~/sugarkube`
- GHCR pull access for image and Helm chart artifacts
- Traefik and Cloudflare tunnel already configured for `staging.democratized.space`
- tools: `just`, `kubectl`, `curl`

## Deploy a candidate tag

```bash
cd ~/sugarkube
```

Use install semantics when the `dspace` Helm release does not exist yet, such as after a
cluster wipe or first-time staging bootstrap. The upgrade helper requires an existing deployed
release and fails on a fresh cluster with `UPGRADE FAILED: "dspace" has no deployed releases`.

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

Use upgrade semantics only after the `dspace` release exists in the staging namespace.

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

## Validate candidate in staging

```bash
kubectl -n dspace get deploy,po,svc,ingress
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
```

```bash
curl -fsS https://staging.democratized.space/config.json
```

```bash
curl -fsS https://staging.democratized.space/healthz
```

```bash
curl -fsS https://staging.democratized.space/livez
```

Run the release checklist from the QA index:

- [QA checklists index](./qa/README.md)

## Iterate with a newer candidate

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_NEW_SHORTSHA
```

## Roll back staging

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version tag=<previous-immutable-tag>
```


## Troubleshooting and recovery notes (v3.0.1-rc.5 lessons)

### Use positional Sugarkube environment arguments

Use positional env arguments for Sugarkube commands:

```bash
just up staging
just save-logs staging
```

Legacy named form (`just up env=staging`) previously produced malformed values before
Sugarkube PR #2165. Prefer positional form in operator runbooks.

### Cloudflare tunnel command caveat

Until the Sugarkube tunnel parsing fix lands, prefer positional env for tunnel install:

```bash
just cf-tunnel-install staging token="$CF_TUNNEL_TOKEN"
```

Avoid `just cf-tunnel-install env=staging token="$CF_TUNNEL_TOKEN"` for now because it can
create malformed tunnel names such as `sugarkube-env=staging`.

### Fresh cluster install vs upgrade

If k3s state was wiped or the namespace was rebuilt, run install first:

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=3.0.1-rc.5
```

Use upgrade only after the release exists:

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=3.0.1-rc.5
```

If you run upgrade first on a fresh cluster, Helm reports:

```
UPGRADE FAILED: "dspace" has no deployed releases
```

### GHCR Helm OCI authentication failures

If GHCR auth is stale or PAT scope is wrong, you can see `403 denied: denied` during chart
pulls. Re-login with a token that has `read:packages`:

```bash
helm registry login ghcr.io
```

Then verify chart access:

```bash
helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
```

### Validate cluster add-ons after rebuild

After cluster rebuilds, validate infra before blaming DSPACE app deploys:

```bash
just cluster-status
just traefik-status
just traefik-crd-doctor
```

Run `just traefik-install` only when Traefik is missing or broken, then reinstall tunnel as
needed:

```bash
just cf-tunnel-install staging token="$CF_TUNNEL_TOKEN"
```

For cluster-level remediation after DHCP/IP reassignment incidents, use Sugarkube docs and the
canonical Sugarkube outage record instead of duplicating RCA in DSPACE:

- `https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md`
- `https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md`
- `https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_troubleshooting.md`
- `https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.md`
- `https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.json`

### Post-deploy release verification

For staging-only deploys, confirm both outcomes:

1. `https://staging.democratized.space/config.json` shows the expected deployed SHA/tag.
2. `https://democratized.space/config.json` remains on the intended production release (for the
   v3.0.1-rc.5 cycle, prod remained on v3.0.0).

## Promotion handoff to prod

Promote only after staging sign-off. Hand off:

- immutable tag approved in staging
- commit SHA
- checklist link + sign-off timestamp
- rollback tag confirmed

Prod should deploy the same approved immutable artifact (not `main-latest`).
