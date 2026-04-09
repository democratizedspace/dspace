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
