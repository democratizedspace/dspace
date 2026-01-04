# Deploying dspace v3 to k3s with sugarkube (dev)

> **Scope:** Development environment only. QA Cheats **must be enabled** (`DSPACE_ENV=dev`). Default
> access is via local port-forward; Cloudflare tunnels are optional.

For full context on build workflows and Helm packaging, see the staging runbook
(`docs/k3s-sugarkube-staging.md`). This document highlights the deltas for a lightweight dev setup.

## Prerequisites

- Sugarkube dev cluster (single-node k3s is acceptable) brought up with `just up env=dev`.
- Traefik installed if you plan to expose an ingress; otherwise a port-forward is sufficient.
- GHCR credentials that can pull `ghcr.io/democratizedspace/dspace` images and charts.
- `just` available on the node where you run the sugarkube helpers.

## QA Cheats policy

- Set `DSPACE_ENV=dev` (chart env) so QA-only UI and cheats are available in development.
- Staging also keeps cheats enabled; production must disable them. See the staging/prod runbooks for
  the full matrix.

## Build artifacts

Use the same GHCR workflows as staging:

- [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
- [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

Trigger them for the branch you want to deploy (`v3` for the v3 stack).

## Install/upgrade the Helm release (dev)

Run from `~/sugarkube` on the dev node:

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=v3-latest
```

- `dspace.values.dev.yaml` sets the environment to `dev` and intentionally omits a public hostname so
  you can iterate locally with QA Cheats enabled.
- Add `--create-namespace` to the Helm command if the namespace does not exist.
- If you prefer an ingress, add a host override or reuse the staging values file with a dev hostname.

## Access dspace in dev

1. Port-forward the service:

   ```bash
   kubectl -n dspace port-forward svc/dspace 8080:8080
   ```

2. Open `http://localhost:8080` to reach the dev instance with QA Cheats enabled.

If you need remote access, configure an ingress hostname and optionally a Cloudflare tunnel as
documented in `docs/cloudflare_tunnel.md`, but keep the environment `dev` and use
`SUGARKUBE_TOKEN_DEV`.

## Fast redeploy

To force a rollout when using mutable tags (`v3-latest`), rerun the install command above and then:

```bash
kubectl -n dspace rollout restart deploy/dspace
kubectl -n dspace rollout status deploy/dspace --timeout=120s
```

## References

- Staging runbook: `docs/k3s-sugarkube-staging.md`
- Prod runbook: `docs/k3s-sugarkube-prod.md`
- Sugarkube app guide for dspace:
  <https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md>
