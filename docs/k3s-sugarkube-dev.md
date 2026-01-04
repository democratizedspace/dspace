# Deploying dspace v3 to k3s with sugarkube (dev)

> **Scope:** This runbook covers **dev** clusters that are not internet-exposed by default. It
> favors a single-node k3s install for fast iteration and uses port-forwards for access. QA
> Cheats **must remain ON** in dev via `DSPACE_ENV=dev`.

Use this guide to run [`dspace@v3`](https://github.com/democratizedspace/dspace/tree/v3) on a dev
sugarkube cluster. It reuses the same GHCR artifacts as staging and production but keeps the
network surface area minimal by avoiding Cloudflare Tunnel unless you deliberately opt in.

## Prerequisites

- A dev sugarkube node or small cluster built via
  [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md).
  The convenience target is `just dev env=dev` from the sugarkube repo.
- `kubectl` pointing at the dev cluster and `just` installed.
- Ability to pull GHCR artifacts from `ghcr.io/democratizedspace`.

## Quick start

1. **Build artifacts** (once per code change): Trigger the GHCR workflows for branch `v3`:
   - [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
2. **Install Traefik**: From the sugarkube repo, follow
   [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md#install-and-verify-traefik-ingress)
   to install Traefik. A tunnel is optional for dev; port-forwarding is the default access path.
3. **Deploy the chart** from `~/sugarkube` on a control node:

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.dev.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=v3-latest env=dev
   ```

   - The dev values set `DSPACE_ENV=dev` to keep QA Cheats enabled.
   - No hostname is required; Traefik can expose the service on `127.0.0.1` via port-forward.

4. **Verify** with a local port-forward:

   ```bash
   kubectl -n dspace port-forward svc/dspace 8080:8080
   curl -fsS http://localhost:8080/healthz | jq
   ```

   Load `http://localhost:8080` in a browser to confirm the UI loads with QA Cheats visible.

## Optional: enable external access

If you want the dev cluster reachable from the internet, you can reuse the Cloudflare Tunnel flow
from staging but set `env=dev` when calling the sugarkube tunnel helpers and ensure the host entry
in `dspace.values.dev.yaml` points at a dev-specific domain.

## Redeploying fast

When reusing a mutable tag such as `v3-latest`, force a rollout so pods pull the new digest:

```bash
cd ~/sugarkube
just dspace-oci-redeploy
kubectl -n dspace rollout restart deploy dspace
kubectl -n dspace rollout status deploy dspace --timeout=120s
```

## QA Cheats policy

- Dev **must** run with `DSPACE_ENV=dev` so QA-only controls are present.
- Do not set production-only values (e.g., Cloudflare hostnames) unless you intentionally expose
  the cluster; keep the defaults local-first.
