# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space` with an alias-first
> rollout at `https://prod.democratized.space`. QA Cheats must remain **disabled**.

## Preconditions

- Sugarkube cluster running with `env=prod` (HA strongly recommended)
- Traefik installed and healthy (`just traefik-install` / `just traefik-status`)
- Cloudflare tunnel for production hostnames, configured with `SUGARKUBE_TOKEN_PROD`
- GHCR access for images/charts and `kubectl` + `just` on the control node

## QA Cheats policy (prod)

Production runs with QA Cheats **OFF**. The production values set `environment: prod`, mapping to
`DSPACE_ENV=prod`, which disables cheats in the UI. Do not override this value.

## Immutable tags only

Production must use immutable tags so every rollout is reproducible and auditable:

- During `v3` validation on the alias host, use `v3-<shortsha>`.
- After merging `v3` into `main`, use `main-<shortsha>` for apex deploys.
- Avoid mutable tags like `*-latest`. Mutable tags can hide what build is running and may not
  produce the rollout behavior you expect on republish.
- Pin `default_tag` in Helm helpers to immutable tags only.

## Production cutover sequence (alias-first: `prod.democratized.space`)

Use this exact sequence so v3 is validated on production infrastructure before apex cutover:

1. Publish immutable artifacts from branch `v3` and pick one `v3-<shortsha>`.
2. Configure production routing for validation host `prod.democratized.space` (still `env=prod`).
3. Deploy `v3-<shortsha>` and validate on `https://prod.democratized.space`.
4. Merge `v3` to `main` after validation sign-off.
5. Publish immutable artifacts from `main` and pick the target `main-<shortsha>`.
6. Deploy `main-<shortsha>` to `https://democratized.space`.
7. Validate apex host health and smoke flows.
8. Convert `prod.democratized.space` into a redirect to `https://democratized.space`.

## Deployment steps

1. **Select immutable image tags** from GHCR workflows:
   - [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

2. **Install/upgrade via sugarkube Helm helper:**

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=<immutable-tag>
   ```

3. **Verify active host health and release state after each phase:**
   - `kubectl -n dspace get deploy,po,ingress`
   - `curl -fsS https://<active-host>/healthz`
   - `curl -fsS https://<active-host>/livez`
   - `curl -fsS https://<active-host>/config.json`

4. **Cloudflare routing checks by phase:**
   - Alias validation phase: `prod.democratized.space` → `traefik.kube-system.svc.cluster.local`
   - Apex phase: `democratized.space` → `traefik.kube-system.svc.cluster.local`
   - Post-cutover: redirect `prod.democratized.space` to `https://democratized.space`

## Rollback plan (explicit)

- **General rule:** roll back by redeploying the last known-good immutable tag for that host.
- **Never roll back to mutable `*-latest` tags in production.**

### Rollback scenarios

1. **Failure during alias validation (`prod.democratized.space`)**
   - Keep apex unchanged.
   - Redeploy previous `v3-<shortsha>` to alias host.
   - Re-run `/healthz`, `/livez`, and `/config.json` checks on alias host.

2. **Failure after apex cutover (`democratized.space`)**
   - Redeploy previous `main-<shortsha>` to apex host.
   - Keep alias redirect disabled until apex is healthy.
   - Re-enable alias redirect only after apex validation succeeds.

3. **Emergency traffic fallback while apex is unstable**
   - Temporarily remove alias redirect.
   - Re-point `prod.democratized.space` to the last known-good production release.
   - Communicate incident status before resuming normal rollout.
