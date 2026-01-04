# Deploying dspace v3 to k3s with sugarkube (dev)

> **Scope:** Developer environment on Sugarkube (`env=dev`). Single-node k3s is fine. QA Cheats must
> be **enabled** (`DSPACE_ENV=dev`). No Cloudflare tunnel by default—use `kubectl port-forward` for
> access unless you explicitly wire a dev hostname.

Use this runbook to take [`dspace@v3`](https://github.com/democratizedspace/dspace/tree/v3) from
source to a running server on the dev Sugarkube environment. For staging and prod, see the sibling
runbooks in this directory.

## Source of truth and upstream references

- dspace Helm chart: [`charts/dspace`](../charts/dspace)
- CI workflows that publish GHCR artifacts (select `v3` or `main` as needed):
  - Container image: [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
  - Helm chart: [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
- sugarkube deployment guide for this app: [docs/apps/dspace.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
- sugarkube platform bring-up:
  - [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  - [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
- Optional Cloudflare Tunnel notes (dev usually skips): [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)

## Published artifacts

- dspace multi-arch container images: `ghcr.io/democratizedspace/dspace`
  - Tags include `v3-latest`, `v3-<short-sha>`, and semantic versions such as `v3.0.0`.
- Helm chart: `oci://ghcr.io/democratizedspace/charts/dspace:<chartVersion>`
  (chartVersion comes from `charts/dspace/Chart.yaml` and is mirrored in [`docs/apps/dspace.version`](./apps/dspace.version)).

## Prerequisites (dev)

- Sugarkube dev cluster is up (`just up dev` or `just ha3 env=dev`).
- `SUGARKUBE_TOKEN_DEV` set if you are joining an existing dev control plane.
- `kubectl` points at the dev cluster; `just` is installed where you will run commands.
- Traefik is optional for dev; leave ingress disabled by default and port-forward instead.

## Quick start (dev)

1. **Build artifacts** (manual trigger from GitHub Actions):
   - [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

2. **Install the Helm release** on the dev cluster from `~/sugarkube`:

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.dev.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=v3-latest
   ```

   The dev values set `environment: dev` so QA Cheats render safely outside production.

3. **Verify via port-forward** (no public ingress by default):

   ```bash
   kubectl -n dspace port-forward svc/dspace 8080:8080
   curl -fsS http://localhost:8080/healthz | jq
   ```

4. **Optional ingress/tunnel:** If you need external dev access, set a dev hostname in
   `docs/examples/dspace.values.dev.yaml`, enable `ingress.enabled`, and follow the
   [Cloudflare Tunnel guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
   with `env=dev`.

## Updates and rollouts

- Use immutable tags (for example `v3-<shortsha>`) when you want a deterministic dev rollback; for
  quick iteration `v3-latest` is fine.
- Redeploy with the latest tag:

  ```bash
  cd ~/sugarkube
  just helm-oci-upgrade \
    release=dspace namespace=dspace \
    chart=oci://ghcr.io/democratizedspace/charts/dspace \
    values=docs/examples/dspace.values.dev.yaml \
    version_file=docs/apps/dspace.version \
    default_tag=v3-latest
  sudo kubectl rollout restart deploy dspace -n dspace
  sudo kubectl rollout status deploy dspace -n dspace --timeout=120s
  ```

- QA Cheats stay **on** in dev (`DSPACE_ENV=dev`).
