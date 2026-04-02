# DSPACE staging runbook on sugarkube (evergreen)

> **Status:** Live.

## Current topology and purpose

- Environment: `env=staging`
- Hostname: `https://staging.democratized.space`
- Nodes: `sugarkube3`, `sugarkube4`, `sugarkube5`
- Availability model: 3-node HA
- Role: canonical pre-production validation environment

Staging is the promotion gate for every release. Validate candidates here before prod.

## QA Cheats policy

Staging keeps QA Cheats **ON** via `environment: staging` (`DSPACE_ENV=staging`).

## Artifact/tag policy

- Candidate validation: immutable tags (`main-<shortsha>` or approved release-branch immutable tag)
- Convenience only (not sign-off): `main-latest`
- Promotion target: exactly the immutable tag that passed staging

## Prerequisites

- sugarkube staging cluster online (`env=staging`)
- Traefik and Cloudflare tunnel already configured for staging hostname
- GHCR pull access for dspace image and chart
- `kubectl` and `just` available on operator host

## Deploy a chosen candidate tag to staging

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

Use `helm-oci-install` only if the release is not yet installed:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

## Verify staging candidate

```bash
kubectl -n dspace rollout status deploy/dspace
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

## Iterate if candidate fails

Deploy the next immutable candidate and retest:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_NEXT_SHORTSHA
```

## Promote to prod

After staging sign-off, deploy the **same immutable tag** to prod using:

- [k3s-sugarkube-prod.md](./k3s-sugarkube-prod.md)
- [merge-plan.md](./merge-plan.md)

## Staging rollback

Redeploy the last known-good immutable tag:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```
