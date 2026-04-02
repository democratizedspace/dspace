# DSPACE production runbook on sugarkube (evergreen)

> **Status:** Live steady-state production.

## Current topology and purpose

- Environment: `env=prod`
- Primary hostname: `https://democratized.space`
- Nodes: `sugarkube0`, `sugarkube1`, `sugarkube2`
- Availability model: 3-node HA
- Role: user-facing production service

`prod.democratized.space` should be treated as an optional alias/rehearsal hostname, not a required
permanent preview phase.

## QA Cheats policy

Production keeps QA Cheats **OFF** via `environment: prod` (`DSPACE_ENV=prod`).

## Artifact/tag policy

- Deploy immutable tags only (`main-<shortsha>` or approved release immutable tag)
- Never sign off production with mutable tags (`main-latest`, `*-latest`)
- Semver tags (`vX.Y.Z`) are release labels and may be used when they resolve to an approved immutable build

## Prerequisites

- sugarkube prod cluster online (`env=prod`)
- Traefik and Cloudflare tunnel configured for `democratized.space`
- GHCR pull access for dspace image/chart
- `kubectl` and `just` available on operator host

## Deploy approved immutable tag to production

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_APPROVED_SHORTSHA
```

Use `helm-oci-install` only if production release does not exist yet:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_APPROVED_SHORTSHA
```

## Verify production release

```bash
kubectl -n dspace rollout status deploy/dspace
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

## Rollback

Rollback is an explicit redeploy of a previously approved immutable tag:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```

Re-run health verification after rollback:

```bash
kubectl -n dspace rollout status deploy/dspace
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

## Optional `prod.democratized.space` guidance

If you intentionally use `prod.democratized.space` for a future rehearsal window, treat it as
temporary and document:

- why the rehearsal is needed,
- which immutable tag is under test, and
- when traffic returns to standard apex-only operation.

## Related docs

- Release management: [merge-plan.md](./merge-plan.md)
- Staging promotion gate: [k3s-sugarkube-staging.md](./k3s-sugarkube-staging.md)
