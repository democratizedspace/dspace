# DSPACE staging runbook (live): k3s + sugarkube

> **Status:** Live and stable.
>
> Canonical pre-production validation environment:
> `https://staging.democratized.space` on `sugarkube3`, `sugarkube4`, and `sugarkube5`
> with `env=staging`.

## Purpose and topology

- Environment: `env=staging`
- Nodes: `sugarkube3`, `sugarkube4`, `sugarkube5`
- Topology: 3-node HA
- Hostname: `staging.democratized.space`
- QA Cheats: **ON** (`DSPACE_ENV=staging`)

Staging is the required validation gate before any prod promotion.

For release flow policy, see [docs/merge-plan.md](./merge-plan.md).

## Artifact/tag policy

- Use immutable candidate tags for sign-off (`main-<shortsha>`, optional `vX.Y.Z-rc.N`).
- Use mutable tags (like `main-latest`) only for convenience iterations.
- Record the exact promoted immutable tag for rollback readiness.

## Prerequisites

- HA cluster healthy and reachable (`env=staging`)
- Traefik and Cloudflare tunnel already configured for `staging.democratized.space`
- GHCR pull access for image + chart
- sugarkube repo present on operator machine (`~/sugarkube`)

## Repeated deployment workflow

### 1) Verify current context and cluster state

```bash
kubectl config current-context
```

```bash
kubectl get nodes -o wide
```

### 2) Confirm staging values overlay

```bash
cd ~/sugarkube
```

```bash
cat docs/examples/dspace.values.staging.yaml
```

### 3) Deploy chosen immutable candidate tag

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

### 4) Verify rollout

```bash
kubectl -n dspace rollout status deploy/dspace
```

```bash
kubectl -n dspace get deploy,po,ingress
```

### 5) Verify staging endpoints

```bash
curl -fsS https://staging.democratized.space/config.json
```

```bash
curl -fsS https://staging.democratized.space/healthz
```

```bash
curl -fsS https://staging.democratized.space/livez
```

### 6) Iterate candidate if needed

Deploy the next immutable tag and re-run the same validation loop:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_NEXT_SHORTSHA
```

## Promotion handoff to prod

When staging passes:

- Record approved immutable tag (`main-<shortsha>` or release tag).
- Record chart version from `docs/apps/dspace.version`.
- Hand off both to prod operator runbook without retagging.

## Rollback in staging

Rollback is a standard redeploy of the last known-good immutable tag:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```

```bash
kubectl -n dspace rollout status deploy/dspace
```
