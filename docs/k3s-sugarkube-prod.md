# DSPACE production runbook (evergreen) for k3s + sugarkube

> **Status:** Live and stable.

## Environment definition

- Primary URL: `https://democratized.space`
- Environment label: `env=prod`
- Cluster topology: HA on `sugarkube0`, `sugarkube1`, `sugarkube2`
- Role: user-facing production
- QA Cheats: **OFF** (`DSPACE_ENV=prod`)

`https://prod.democratized.space` may be used as an optional alias/rehearsal hostname in future drills,
but it is **not** required for the normal release path.

For release policy and promotion rules, see [docs/merge-plan.md](./merge-plan.md).

## Steady-state prod release workflow

1. Receive an immutable tag approved in staging.
2. Deploy that same immutable tag to prod.
3. Validate health and critical user flows.
4. If needed, roll back to the previous known-good immutable tag.

Use immutable tags only in prod (`main-<shortsha>`, `vX.Y.Z-rc.N`, `vX.Y.Z`, `vX.Y.Z.W`).
Do not deploy `main-latest` or any other mutable tag to prod.

## Prerequisites

```bash
kubectl config current-context
```

```bash
kubectl get nodes -o wide
```

```bash
kubectl -n kube-system get pods -l app.kubernetes.io/name=traefik
```

## Deploy approved immutable tag to prod

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version tag=main-REPLACE_APPROVED_SHORTSHA
```

Semver example:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version tag=v3.0.0.1
```

## Validate prod

```bash
kubectl -n dspace get deploy,pods,svc,ingress
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

## Roll back prod

Redeploy the last known-good immutable tag.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version tag=main-REPLACE_PREVIOUS_SHORTSHA
```

## Optional rehearsal using prod alias

Use only when explicitly planning a rehearsal.

```bash
curl -fsS https://prod.democratized.space/config.json
```

Normal steady-state releases should validate directly on `https://democratized.space`.
