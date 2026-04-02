# DSPACE staging runbook: k3s + sugarkube

Related release docs:

- [Release procedure](./merge-plan.md)
- [Patch QA checklist (`v3.0.0.1`)](./qa/v3.0.0.1.md)
- [Feature QA checklist (`v3.1`)](./qa/v3.1.md)

## Topology and role (current live state)

- Environment: `env=staging`
- Public host: `https://staging.democratized.space`
- Live cluster nodes: `sugarkube3`, `sugarkube4`, `sugarkube5`
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

## Promotion handoff to prod

Promote only after staging sign-off. Hand off:

- immutable tag approved in staging
- commit SHA
- checklist link + sign-off timestamp
- rollback tag confirmed

Prod should deploy the same approved immutable artifact (not `main-latest`).
