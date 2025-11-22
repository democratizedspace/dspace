# Deploying dspace v3 to k3s with sugarkube

This guide collects the steps, links, and commands needed to bring up `dspace@v3` on a
three-server sugarkube k3s cluster (HA control plane) with Cloudflare Tunnel ingress. It links to
all upstream resources so you can go from zero to a running web server without prior context.

## Quick links

- CI workflows that publish to GHCR:
  - [GHCR application image workflow](../.github/workflows/ci-image.yml)
  - [Helm chart publishing workflow](../.github/workflows/ci-helm.yml)
- sugarkube onboarding and operations:
  - [Raspberry Pi cluster setup (part 2, HA bring-up)](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  - [Raspberry Pi cluster operations & Helm (part 3)](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
  - [dspace on sugarkube guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
  - [Helm + Cloudflare helpers in the `justfile`](https://github.com/futuroptimist/sugarkube/blob/main/justfile)
- Release hygiene: [v3 → main merge checklist](./merge-plan.md)

## Platform prerequisites

1. Finish the sugarkube cluster bring-up, including the 3-server HA control plane, using the
   [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
   guide. That guide and the follow-on
   [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
   document cover mDNS discovery, `just ha3 env=dev`, kubeconfig setup, and cluster health checks.
2. Keep Traefik enabled (default in k3s) so the ingress class `traefik` is available.
3. Set up Cloudflare DNS and Tunnel access to forward your chosen hostname to
   `traefik.kube-system.svc.cluster.local:80`. The sugarkube [`cf-tunnel-install`](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
   and [`cf-tunnel-route`](https://github.com/futuroptimist/sugarkube/blob/main/justfile#L240) recipes
   install the chart and prompt you to create the route.
4. Ensure your workstation can authenticate to GHCR (usually via `gh auth login --scopes write:packages`
   or a fine-grained PAT) so Helm can pull the chart and Kubernetes can pull the application image.

## Build and publish artifacts to GHCR

The v3 CI builds both the multi-arch application image (`ghcr.io/democratizedspace/dspace`) and the
Helm chart (`oci://ghcr.io/democratizedspace/charts/dspace`). Both workflows now accept a branch
selector for manual runs so you can publish from `v3` or `main`.

### Publish the application image

1. Run the "Build and publish GHCR image" workflow from GitHub → Actions → `ci-image.yml`.
2. For manual runs choose **Branch: v3** (current release line) or **Branch: main** (merge
   hardening). The workflow checks out that ref and pushes tags `v3-<shortsha>` and `v3-latest`.
3. Confirm the pushed tags exist:
   ```bash
   crane ls ghcr.io/democratizedspace/dspace | grep v3-
   ```

### Publish the Helm chart

1. Run the "Publish Helm chart" workflow from GitHub → Actions → `ci-helm.yml`.
2. Pick the same branch selection (v3 or main). The workflow packages the chart and pushes it to
   `oci://ghcr.io/democratizedspace/charts/dspace` with the version from `charts/dspace/Chart.yaml`.
3. Capture the chart reference from the workflow output; you can also inspect locally:
   ```bash
   helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version <semver>
   ```

## Quick Helm test (no sugarkube)

Validate connectivity with a direct Helm install before automating with sugarkube. Replace
`<your-domain>` with the Cloudflare-managed zone:

```bash
helm upgrade --install dspace-v3 oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --set ingress.enabled=true \
  --set ingress.host=dspace-v3.<your-domain> \
  --set ingress.className=traefik
```

The in-cluster service DNS name will be `<release>.<namespace>.svc.cluster.local`
(e.g., `dspace-v3.dspace.svc.cluster.local`).

## Deploy with sugarkube

Follow the sugarkube dspace guide for the end-to-end automated path; the commands below mirror that
flow and point back to the upstream resources.

1. Install the Cloudflare Tunnel chart and create the route (with `CF_TUNNEL_TOKEN` exported):
   ```bash
   just cf-tunnel-install env=dev
   just cf-tunnel-route host=dspace-v3.<your-domain>
   ```
2. Install or upgrade the release using the sugarkube Helm helpers in the
   [`justfile`](https://github.com/futuroptimist/sugarkube/blob/main/justfile#L279):
   ```bash
   just helm-oci-install \
     release=dspace namespace=dspace \
     chart=oci://ghcr.io/democratizedspace/charts/dspace \
     values=docs/examples/dspace.values.dev.yaml \
     version_file=docs/apps/dspace.version \
     host=dspace-v3.<your-domain> \
     default_tag=v3-latest
   ```
   See the
   [dspace app guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
   for the first-deployment walkthrough and image bump flow using `just helm-oci-upgrade`.
3. Validate the rollout:
   ```bash
   just app-status namespace=dspace release=dspace
   kubectl -n dspace get ingress,pods,svc
   ```

## Troubleshooting

- GHCR authentication: ensure the node pull secret (if using a private org) or your workstation is
  logged in (`crane auth login ghcr.io`), especially when testing from freshly provisioned Pis.
- Chart/image availability: confirm the workflow tags and chart versions you referenced actually
  exist in GHCR before retrying Helm.
- Cloudflare Tunnel: use `kubectl -n cloudflare get deploy,pods` and the dashboard to verify the
  route points at `traefik.kube-system.svc.cluster.local:80`.
- Ingress/Traefik:
  - `kubectl -n dspace describe ingress` to check the host and class (`traefik`).
  - `kubectl -n kube-system logs deploy/traefik` if routes are not being created.
- sugarkube cluster health: the
  [raspi cluster operations guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
  includes day-two checks and log capture tips (`just save-logs env=dev`).
- Release readiness: before promoting to main, work through the [v3 → main merge checklist](./merge-plan.md)
  so the published chart and image line up with the documented defaults.
