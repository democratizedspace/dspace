# Deploying dspace v3 to k3s with sugarkube (prod)

> **Scope:** Production (`democratized.space`) on the Sugarkube cluster (`env=prod`). QA Cheats must
> be **disabled** (`DSPACE_ENV=prod`). Prefer immutable image tags (versioned or git SHA) so rollouts
> and rollbacks are deterministic.

Use this runbook to deploy [`dspace@v3`](https://github.com/democratizedspace/dspace/tree/v3) to the
production Sugarkube environment. For staging and dev, see the sibling runbooks.

## Source of truth and upstream references

- dspace Helm chart: [`charts/dspace`](../charts/dspace)
- CI workflows that publish GHCR artifacts:
  - Container image: [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
  - Helm chart: [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
- sugarkube deployment guide for this app: [docs/apps/dspace.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
- sugarkube platform bring-up:
  - [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  - [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
- Cloudflare Tunnel setup: [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)

## Published artifacts

- dspace multi-arch images: `ghcr.io/democratizedspace/dspace`
  - Use immutable tags (`v3-<shortsha>` or `v3.<minor>.<patch>+<sha>`). Avoid `*-latest` in prod
    unless you force a rollout restart.
- Helm chart: `oci://ghcr.io/democratizedspace/charts/dspace:<chartVersion>`
  (chartVersion comes from `charts/dspace/Chart.yaml`, mirrored in [`docs/apps/dspace.version`](./apps/dspace.version)).

## Prerequisites (prod)

- Sugarkube prod cluster online with Traefik installed (`just ha3 env=prod`).
- `SUGARKUBE_TOKEN_PROD` exported so nodes and helpers target the prod control plane.
- Cloudflare manages `democratized.space`; a tunnel is created for the prod hostname per
  [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md).
- `kubectl` points at the prod cluster; `just` installed.

## Quick start (prod)

1. **Build artifacts** (GHCR workflows):
   - [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
   - Choose immutable tags for deployment (avoid `v3-latest` unless you plan to restart pods
     explicitly).

2. **Confirm Cloudflare + DNS** for `democratized.space`:
   - Tunnel route sends `democratized.space` → `traefik.kube-system.svc.cluster.local`.
   - DNS CNAME points `democratized.space` at the tunnel endpoint.

3. **Install/upgrade the release** from `~/sugarkube` on a prod control-plane node:

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.dev.yaml,docs/examples/dspace.values.prod.yaml \
     version_file=docs/apps/dspace.version \
     tag=v3-<shortsha>
   ```

   The prod values set `environment: prod` so QA-only UI stays disabled. Swap `tag=` for a semantic
   version if preferred.

4. **Verify**:

   ```bash
   kubectl -n dspace get pods
   kubectl -n dspace get ingress
   curl -fsS https://democratized.space/healthz | jq
   ```

## Safe rollout and rollback

- Stick to immutable tags. Mutable tags like `v3-latest` may not roll pods without an explicit
  restart:

  ```bash
  sudo kubectl rollout restart deploy dspace -n dspace
  sudo kubectl rollout status deploy dspace -n dspace --timeout=120s
  ```

- To roll back, redeploy the previous known-good immutable tag with the same `helm-oci-install`
  command.
- Avoid mixing staging/dev settings in prod: use `env=prod`, `SUGARKUBE_TOKEN_PROD`, and
  `docs/examples/dspace.values.prod.yaml` only.
- QA Cheats must remain **off** in prod (`DSPACE_ENV=prod`).
