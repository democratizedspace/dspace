# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space`, with a subdomain-first v3
> rollout on `https://prod.democratized.space`. QA Cheats must remain **disabled**.

## Preconditions

- Sugarkube cluster running with `env=prod` (HA strongly recommended)
- Traefik installed and healthy (`just traefik-install` / `just traefik-status`)
- Cloudflare tunnel for the production hostname, configured with `SUGARKUBE_TOKEN_PROD`
- GHCR access for images/charts and `kubectl`+`just` on the control node

## QA Cheats policy (prod)

Production runs with QA Cheats **OFF**. The production values set `environment: prod`, mapping to
`DSPACE_ENV=prod`, which disables cheats in the UI. Do not override this value.

## Immutable tags only (required)

Production must use immutable tags so every rollout is reproducible and auditable:

- During v3 validation on `prod.democratized.space`, prefer `v3-<shortsha>`.
- After promotion/merge to `main`, prefer `main-<shortsha>` for apex deployment.
- Avoid mutable tags like `*-latest`. Mutable tags do not trigger a new rollout on image republish,
  and they make it harder to confirm which build is running during an incident.
- Pin `default_tag` in the Helm helper to one of the immutable tags above (for example,
  `default_tag=v3-a1b2c3d` or `default_tag=main-a1b2c3d`), never `*-latest`.

## Production rollout plan (subdomain-first, then apex)

1. **Deploy v3 to `prod.democratized.space` first (parallel alias):**
   - Select a `v3-<shortsha>` image tag from the GHCR image workflow.
   - Apply production values so ingress host is `prod.democratized.space` while keeping
     `environment: prod` (QA Cheats off).
   - Deploy using immutable tag:

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=v3-<shortsha>
   ```

2. **Validate `prod.democratized.space`:**
   - Confirm Cloudflare route points `prod.democratized.space` to
     `traefik.kube-system.svc.cluster.local`.
   - Verify deployment resources: `kubectl -n dspace get deploy,po,ingress`
   - Verify app health endpoints:
     - `curl -fsS https://prod.democratized.space/healthz`
     - `curl -fsS https://prod.democratized.space/livez`
   - Run targeted production smoke checks before promotion.

3. **Promote code and deploy apex:**
   - Merge `v3` into `main` once subdomain validation is approved.
   - Select the resulting `main-<shortsha>` image tag from the GHCR workflows
   ([ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml) and
   [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)).
   - Deploy apex with immutable main tag:

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=main-<shortsha>
   ```

4. **Post-promotion DNS/routing cleanup:**
   - Keep `democratized.space` as the primary production hostname.
   - Convert `prod.democratized.space` to a redirect that points to
     `https://democratized.space` after apex validation completes.

## Safe rollout/rollback

- For upgrades, use `just helm-oci-upgrade ... default_tag=<new-tag>` and wait for pods to become
  ready before switching traffic.
- Keep staging/dev values and tokens out of production. Use only `SUGARKUBE_TOKEN_PROD` and the
  production values file.
- Roll back by redeploying the previous immutable tag with the same Helm command:
  - If validating subdomain rollout, revert `prod.democratized.space` to the prior `v3-<shortsha>`.
  - If apex rollout regresses, redeploy prior `main-<shortsha>` and keep the redirect step on hold.
