# Deploying dspace v3 to a dev k3s cluster with sugarkube

> **Scope:** Development (`env=dev`) using the `v3` branch. This guide assumes a lab or workstation
> cluster without a public hostname or Cloudflare tunnel.

This runbook takes [`dspace@v3`](https://github.com/democratizedspace/dspace/tree/v3) from source to
an accessible dev deployment. It keeps QA Cheats **enabled** (via `DSPACE_ENV=dev`) and uses
port-forward checks instead of an external tunnel.

## Prerequisites

- A single-node or small k3s cluster brought up with sugarkube (`just up dev` or `just ha3 env=dev`)
- Traefik installed from the sugarkube operations guide (for ingress), or be ready to
  `kubectl port-forward` the `dspace` Service locally
- GHCR credentials to pull `ghcr.io/democratizedspace/dspace` images and charts
- `just` and `kubectl` installed on the host running the commands

## QA Cheats policy (dev)

Dev intentionally keeps QA Cheats **ON**. The sample values file sets `environment: dev`, which maps
to `DSPACE_ENV=dev` inside the pod and enables the cheats toggle. Do not override this value in dev.

## Quick start

1. **Build artifacts (optional if already published):** Trigger the GHCR workflows on branch `v3`:
   - [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

2. **Install via Helm + sugarkube** on your control node (for example `sugarkube0`):

   ```bash
   cd ~/sugarkube
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.dev.yaml \
     version_file=docs/apps/dspace.version \
     default_tag=v3-latest
   ```

   This uses `environment: dev` from the values file, which keeps QA Cheats available.

3. **Verify locally (no tunnel by default):**
   - Port-forward the Service: `kubectl -n dspace port-forward svc/dspace 3000:8080`
   - In another shell, run `curl -fsS http://localhost:3000/healthz`,
     `curl -fsS http://localhost:3000/livez`, and `curl -fsS http://localhost:3000/config.json`
     (or open http://localhost:3000/ in a browser).

   If you prefer ingress, set a local hostname in the dev values file and route it through Traefik,
   but keep it non-public.


## Tag strategy (dev)

- Default day-to-day developer flow can use `v3-latest` for convenience and quick iteration.
- For reproducible bug hunts, pair testing, or rollback drills, deploy immutable `v3-<shortsha>`
  tags so everyone tests the same artifact.
- Do not reuse staging/prod immutable tags as mutable aliases; keep environment intent explicit.

## Notes for dev environments

- Keep tokens scoped: use `SUGARKUBE_TOKEN_DEV` for dev clusters; do not reuse staging/prod tokens.
- Cloudflare tunnels are optional in dev. If you add one, align it with `env=dev` and a non-public
  hostname.
- `v3-latest` is fine for day-to-day dev iteration, but prefer `v3-<shortsha>` when you want
  reproducible debugging, pair-testing, or rollback drills.
