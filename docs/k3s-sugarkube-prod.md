# Deploying dspace v3 to k3s with sugarkube (prod)

> **Scope:** This runbook covers **production** for `https://democratized.space`. QA Cheats must be
> **disabled** (`DSPACE_ENV=production`). Prefer immutable tags (semantic versions or git SHAs) to
> avoid surprise rollbacks when reusing mutable tags.

Production tracks the same GHCR build and chart workflows as staging but uses production-only
values, tunnel tokens and DNS. Follow this guide after changes have baked in staging.

## Prerequisites

- prod sugarkube cluster online following
  [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  and [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md).
- Traefik installed and healthy (`just traefik-status`).
- Cloudflare Tunnel configured for the production host with the prod tunnel token.
- `kubectl` and `just` installed on the control node.

## Build artifacts

Trigger the GHCR workflows for the `main` branch after merging from `v3`:

- [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
- [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

Use immutable tags for the deploy (for example `v3.0.0`, `main-<shortsha>`, or
`v3.0.0+<sha>`). Avoid relying on `*-latest` in production; Kubernetes may not roll pods without an
explicit restart when the tag digest changes.

## Deploy

From `~/sugarkube` on a control node:

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=v3.0.0 env=prod
```

- Ensure the prod values set `host: democratized.space` and `DSPACE_ENV=production` so QA Cheats
  stay disabled.
- If you must deploy a mutable tag, follow with a manual restart:

```bash
kubectl -n dspace rollout restart deploy dspace
kubectl -n dspace rollout status deploy dspace --timeout=180s
```

## Post-deploy verification

1. Confirm ingress and DNS:
   - `kubectl -n dspace get ingress` shows `democratized.space` with the Traefik class.
   - DNS CNAME points `democratized.space` (or desired subdomain) to the production tunnel.
2. Confirm tunnel health: `kubectl -n cloudflare port-forward deploy/cloudflare-tunnel 2000:2000`
   and `curl -fsS http://localhost:2000/ready` returns status 200.
3. Smoke test the site: `curl -fsS https://democratized.space/healthz`.

## Rollback guidance

- Prefer Helm rollbacks with an immutable tag pinned in the target release:

```bash
helm -n dspace rollback dspace <revision>
```

- Avoid pulling dev or staging values into production; double-check `values.prod.yaml` before any
  rollback or upgrade.

## QA Cheats policy

- Production must **not** expose QA Cheats. Keep `DSPACE_ENV=production` and avoid enabling any
  cheat-related feature gates.
