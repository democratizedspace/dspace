# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space` with a subdomain-first
> rollout at `https://prod.democratized.space`. QA Cheats must remain **disabled**.

## Preconditions

- Sugarkube cluster running with `env=prod` (HA strongly recommended)
- Traefik installed and healthy (`just traefik-install` / `just traefik-status`)
- Cloudflare tunnel for the production hostname, configured with `SUGARKUBE_TOKEN_PROD`
- GHCR access for images/charts and `kubectl`+`just` on the control node

## QA Cheats policy (prod)

Production runs with QA Cheats **OFF**. The production values set `environment: prod`, mapping to
`DSPACE_ENV=prod`, which disables cheats in the UI. Do not override this value.

## Immutable tags only

Production must use immutable tags so every rollout is reproducible and auditable:

- During `v3` validation, use `v3-<shortsha>` tags.
- After merging `v3` into `main`, use `main-<shortsha>` tags for apex deploys.
- Avoid mutable tags like `*-latest`. Mutable tags do not trigger a new rollout on image republish,
  and they make it harder to confirm which build is running during an incident.
- Pin `default_tag` in the Helm helper to one of the immutable tags above (for example,
  `default_tag=v3-a1b2c3d` or `default_tag=main-a1b2c3d`), not `v3-latest`.

## Production cutover sequence (subdomain first)

Use this exact sequence to keep the apex stable while validating v3 in production infrastructure:

1. **Phase A (validation host): deploy v3 to `prod.democratized.space` first** from branch `v3`
   using immutable tag `v3-<shortsha>`.
   - For this validation deploy, production ingress hostname/routing must point to
     `prod.democratized.space` while still running `env=prod` with QA Cheats OFF.
2. **Validate Phase A on `prod.democratized.space` using `v3-<shortsha>`** (health checks, smoke
   flow, logs).
3. **Merge `v3` into `main`** after validation sign-off.
4. **Phase B (apex host): deploy `democratized.space` from `main`** with immutable
   `main-<shortsha>`.
5. **Convert `prod.democratized.space` to a redirect** pointing to `https://democratized.space`
   once Phase B (`democratized.space` on `main-<shortsha>`) is confirmed healthy.

## Deployment steps

1. **Select an immutable tag:** Use an immutable branch SHA tag published by the GHCR workflows
   ([ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml) and
   [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)).
   - Subdomain validation phase: `v3-<shortsha>`
   - Post-merge apex phase: `main-<shortsha>`

2. **Install/upgrade via sugarkube Helm helper:**

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=<immutable-tag-from-step-1>
   ```

3. **Verify ingress and health endpoints:**
   - Confirm the Cloudflare route targets the active host (`prod.democratized.space` during
     validation, then `democratized.space` after cutover) →
     `traefik.kube-system.svc.cluster.local`
   - `kubectl -n dspace get deploy,po,ingress`
   - `curl -fsS https://<active-host>/healthz`
   - `curl -fsS https://<active-host>/livez`
   - `curl -fsS https://<active-host>/config.json`

## Alias-first rollout details

- During Phase A, `prod.democratized.space` should route to the production dspace ingress while the
  apex `democratized.space` remains unchanged.
- Complete all production-grade smoke checks against `https://prod.democratized.space` before
  merging `v3` into `main`.
- During Phase B, switch production ingress/routing to `democratized.space` and deploy the
  immutable `main-<shortsha>` build.
- Only after Phase B validation should `prod.democratized.space` be changed to an HTTP redirect to
  `https://democratized.space`.

## Safe rollout/rollback

- For upgrades, use `just helm-oci-upgrade ... default_tag=<new-tag>` and wait for pods to become
  ready before switching traffic.
- Keep staging/dev values and tokens out of production. Use only `SUGARKUBE_TOKEN_PROD` and the
  production values file.
- Roll back Phase A (`prod.democratized.space`) by redeploying the previous `v3-<shortsha>` tag to
  `prod.democratized.space`.
- Roll back Phase B (`democratized.space`) by redeploying the previous `main-<shortsha>` tag to
  `democratized.space`.
- If Phase B fails after alias redirect is configured, revert `prod.democratized.space` from
  redirect back to a live route, then redeploy the last known-good immutable production tag.
