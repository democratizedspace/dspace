# DSPACE staging runbook (evergreen) for k3s + sugarkube

> **Status:** Live and stable.

## Environment definition

- URL: `https://staging.democratized.space`
- Environment label: `env=staging`
- Cluster topology: HA on `sugarkube3`, `sugarkube4`, `sugarkube5`
- Role: canonical pre-production validation environment
- QA Cheats: **ON** (`DSPACE_ENV=staging`)

For release policy and promotion rules, see [docs/merge-plan.md](./merge-plan.md).

## Steady-state release workflow in staging

Staging is used repeatedly for each candidate release.

1. Choose an immutable candidate tag (`main-<shortsha>` or `vX.Y.Z-rc.N`).
2. Deploy the candidate.
3. Run smoke + release QA.
4. If failed, fix forward and deploy a new immutable candidate.
5. If passed, promote the same approved immutable tag to prod.

## Prerequisites

```bash
kubectl config current-context
```

```bash
kubectl -n kube-system get pods -l app.kubernetes.io/name=traefik
```

```bash
kubectl get nodes -o wide
```

## Deploy a chosen immutable candidate

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version tag=main-REPLACE_SHORTSHA
```

Example RC deployment (if using release-candidate tags):

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version tag=v3.1.0-rc.1
```

## Validate staging candidate

```bash
kubectl -n dspace get deploy,pods,svc,ingress
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

## Roll back staging

Redeploy the previous known-good immutable tag.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version tag=main-REPLACE_PREVIOUS_SHORTSHA
```

## Notes

- `main-latest` can be useful for quick staging experiments, but final sign-off should be done on immutable tags.
- Keep `environment: staging` in staging values so QA Cheats remain enabled for pre-prod verification.
