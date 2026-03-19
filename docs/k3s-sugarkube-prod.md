# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) with a subdomain-first cutover:
> 1) deploy v3 at `https://prod.democratized.space` from branch `v3`,
> 2) validate,
> 3) merge `v3` into `main`,
> 4) deploy apex `https://democratized.space` from `main`,
> 5) convert `prod.democratized.space` into a redirect to apex.
>
> QA Cheats must remain **disabled** in all production deployments.

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

- Prefer semantic versions or git SHA tags such as `v3.0.0`, `v3-<shortsha>`, or
  `main-<shortsha>`.
- Avoid mutable tags like `*-latest`. Mutable tags do not trigger a new rollout on image republish,
  and they make it harder to confirm which build is running during an incident.
- Pin `default_tag` in the Helm helper to one of the immutable tags above (for example,
  `default_tag=v3-a1b2c3d` during v3 validation or `default_tag=main-a1b2c3d` after promotion).

## Phase A: v3 production validation on `prod.democratized.space` (before main merge)

1. **Select the tag:** Use an immutable `v3-<shortsha>` (or equivalent release tag) published by
   the GHCR workflows
   ([ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml) and
   [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)).

2. **Install/upgrade via sugarkube Helm helper** (prod values + prod token). For this phase,
   ensure ingress host resolves to `prod.democratized.space` (for example, with a temporary prod
   values override):

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=v3-<shortsha>
   ```

3. **Verify ingress and app health:**
   - Confirm the Cloudflare route targets
     `prod.democratized.space` → `traefik.kube-system.svc.cluster.local`
   - `kubectl -n dspace get deploy,po,ingress`
   - `curl -fsS https://prod.democratized.space/healthz`
   - `curl -fsS https://prod.democratized.space/livez`

## Phase B: apex production cutover after v3 validation

1. Merge `v3` into `main` after validation sign-off.
2. Build/publish `main` artifacts and select immutable `main-<shortsha>`.
3. Deploy apex with the same Helm helper and production values, pinning `default_tag=main-<shortsha>`.
4. Verify app health on apex:
   - `curl -fsS https://democratized.space/healthz`
   - `curl -fsS https://democratized.space/livez`
5. After apex is stable, convert `prod.democratized.space` into an HTTP redirect to
   `https://democratized.space`.

## Safe rollout/rollback

- For upgrades, use `just helm-oci-upgrade ... default_tag=<new-tag>` and wait for pods to become
  ready before switching traffic.
- Keep staging/dev values and tokens out of production. Use only `SUGARKUBE_TOKEN_PROD` and the
  production values file.
- Roll back by redeploying the previous immutable tag with the same Helm command.
  - During Phase A, roll back to the prior `v3-<shortsha>` on `prod.democratized.space`.
  - During Phase B, roll back apex to the prior `main-<shortsha>`.
