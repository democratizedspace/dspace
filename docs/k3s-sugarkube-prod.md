# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space`, with a subdomain-first v3
> rollout at `https://prod.democratized.space` before apex cutover. QA Cheats must remain
> **disabled**.

## Preconditions

- Sugarkube cluster running with `env=prod` (HA strongly recommended)
- Traefik installed and healthy (`just traefik-install` / `just traefik-status`)
- Cloudflare tunnel for the production hostname, configured with `SUGARKUBE_TOKEN_PROD`
- GHCR access for images/charts and `kubectl`+`just` on the control node

## QA Cheats policy (prod)

Production runs with QA Cheats **OFF**. The production values set `environment: prod`, mapping to
`DSPACE_ENV=prod`, which disables cheats in the UI. Do not override this value.

## Immutable tags only (no `*-latest` in prod)

Production must use immutable tags so every rollout is reproducible and auditable:

- On branch `v3` (before promotion), use `v3-<shortsha>` for production-candidate deployments.
- After merging `v3` into `main`, use `main-<shortsha>` for apex production deploys.
- Avoid mutable tags like `*-latest`; they are not acceptable for production change control.
- Pin `default_tag` in the Helm helper to a SHA tag (for example, `default_tag=v3-a1b2c3d` before
  promotion, then `default_tag=main-d4e5f6g` after promotion).

## Cutover sequence: subdomain-first rollout, then apex

1. **Deploy v3 to `prod.democratized.space` from `v3`:**
   - Select an immutable `v3-<shortsha>` tag published by
     [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml).
   - Configure a production alias route in Cloudflare:
     `prod.democratized.space` → `traefik.kube-system.svc.cluster.local`.
   - Deploy with production values and that immutable tag:

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=v3-<shortsha>
   ```

2. **Validate v3 on the production alias (`prod.democratized.space`):**
   - `curl -fsS https://prod.democratized.space/healthz`
   - `curl -fsS https://prod.democratized.space/livez`
   - Run the production smoke checks before promoting branch state.

3. **Promote branch state:**
   - Merge `v3` into `main` after alias validation passes.
   - Build/publish main artifacts (`main-<shortsha>`) via CI workflows.

4. **Deploy apex (`democratized.space`) from `main`:**
   - Confirm Cloudflare apex route points at Traefik.
   - Deploy with immutable `main-<shortsha>`:

   ```bash
   cd ~/sugarkube
   just helm-oci-upgrade \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=main-<shortsha>
   ```

5. **Post-cutover alias behavior:**
   - Keep apex as the canonical production URL.
   - Convert `prod.democratized.space` into a redirect to `https://democratized.space` after the
     apex deployment is validated.

## Safe rollout/rollback

- For upgrades, use `just helm-oci-upgrade ... default_tag=<new-sha-tag>` and wait for pods to
  become ready before switching traffic.
- Keep staging/dev values and tokens out of production. Use only `SUGARKUBE_TOKEN_PROD` and the
  production values file.
- Verify app health with `/healthz` and `/livez` on the active hostname after deploy and rollback.
- Roll back by redeploying the previous immutable SHA tag with the same Helm command.
