# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space`. Uses the `main` branch once
> v3 is promoted. QA Cheats must remain **disabled**.

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

- Prefer semantic versions or git SHA tags such as `v3.0.0`, `v3-2024-08-15`, or `main-<shortsha>`.
- Avoid mutable tags like `*-latest`. Mutable tags do not trigger a new rollout on image republish,
  and they make it harder to confirm which build is running during an incident.
- Pin `default_tag` in the Helm helper to one of the immutable tags above (for example,
  `default_tag=main-a1b2c3d` or `default_tag=v3.0.1`), not `v3-latest`.

## Deployment steps

1. **Select the tag:** Use a versioned or SHA tag published by the GHCR workflows
   ([ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml) and
   [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)).

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

3. **Verify ingress and readiness:**
   - Confirm the Cloudflare route targets `democratized.space` → `traefik.kube-system.svc.cluster.local`
   - `kubectl -n dspace get deploy,po,ingress`
   - `curl -fsS https://democratized.space/ready` (via Cloudflare) or port-forward and curl

## Safe rollout/rollback

- For upgrades, use `just helm-oci-upgrade ... default_tag=<new-tag>` and wait for pods to become
  ready before switching traffic.
- Keep staging/dev values and tokens out of production. Use only `SUGARKUBE_TOKEN_PROD` and the
  production values file.
- Roll back by redeploying the previous immutable tag with the same Helm command.
