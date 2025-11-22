# Deploying dspace v3 to k3s with sugarkube

This guide plus the [sugarkube-side documentation][sugarkube-dspace-guide] are intended to take
you from zero to a running `dspace@v3` on sugarkube’s three-server k3s HA cluster. Traffic is
exposed via a Cloudflare Tunnel that forwards requests to Traefik (bundled with k3s by default).

## Related resources

- CI workflow that publishes the Helm chart to GHCR: [ci-helm.yml][ci-helm].
- Merge readiness checklist when promoting v3 to main: [merge-plan.md](./merge-plan.md).
- Sugarkube deployment guide: [docs/apps/dspace.md][sugarkube-dspace-guide].
- Sugarkube helm helpers and OCI recipes: [justfile][sugarkube-justfile].
- k3s HA cluster bring-up (Raspberry Pi 3-node): [raspi_cluster_setup.md][sugarkube-raspi].

## Architecture overview

1. k3s ships with Traefik enabled (its ingress class is `traefik`).
2. The `dspace` Helm chart is published as an OCI artifact to GHCR by the CI workflow.
3. sugarkube installs the chart and sets an ingress host such as `dspace-v3.<your-domain>`.
4. A Cloudflare Tunnel runs in-cluster and forwards internet traffic to the Traefik service.

## Prerequisites

- A sugarkube-managed k3s cluster with the default Traefik ingress controller enabled
  (see the [3-server HA bootstrap guide][sugarkube-raspi]).
- A Cloudflare account with a managed DNS zone and a tunnel token that can be used from the
  cluster.
- Access to the GHCR images and charts produced by the CI workflow (`packages:write` is required
  when testing publishes from forks).
- Local tools: `helm`, `kubectl`, and `just` (used by sugarkube).

## Publish the Helm chart to GHCR (v3 or main)

The GHCR publish workflow supports both the `v3` branch (current deployment target) and `main`
for release candidates:

1. Go to the [Publish Helm chart workflow run page][ci-helm] and click **Run workflow**.
2. Select the branch (`v3` or `main`) to build. The selected branch is checked out before
   packaging and pushing the chart.
3. Verify the job succeeded and note the emitted chart reference in the logs (for example,
   `oci://ghcr.io/democratizedspace/charts/dspace:3.0.0`).

Troubleshooting:

- If authentication fails, confirm the `GITHUB_TOKEN` in the workflow has `packages:write` and
  that your account is allowed to push to `ghcr.io/democratizedspace`.
- If the wrong branch was built, re-run the workflow and choose the correct branch from the
  dropdown.
- To validate the pushed artifact locally:

  ```bash
  helm registry login ghcr.io
  helm pull oci://ghcr.io/democratizedspace/charts/dspace --version <chart-version>
  helm show values oci://ghcr.io/democratizedspace/charts/dspace --version <chart-version>
  ```

## Quick local test without sugarkube

You can install the chart directly with Helm to verify connectivity before automating the
deployment with sugarkube. Replace `<your-domain>` with the DNS zone managed in Cloudflare:

```bash
helm upgrade --install dspace-v3 oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --set ingress.enabled=true \
  --set ingress.host=dspace-v3.<your-domain> \
  --set ingress.className=traefik
```

Traffic between cluster components uses Kubernetes service DNS names. For the dspace deployment,
the service DNS name will be `<release-name>.<namespace>.svc.cluster.local` (for example,
`dspace-v3.dspace.svc.cluster.local`).

## End-to-end install on sugarkube

The sugarkube guide walks through the full rollout with example values and Cloudflare setup
instructions. Key entry points:

1. Follow the sugarkube [Raspberry Pi HA cluster bring-up][sugarkube-raspi] to get three control
   plane nodes online with `kubectl` access.
2. Install the Cloudflare Tunnel chart and route traffic to Traefik using the sugarkube
   recipes (`cf-tunnel-install` and `cf-tunnel-route`) from the [justfile][sugarkube-justfile].
3. Deploy dspace with the sugarkube Helm helpers documented in
   [docs/apps/dspace.md][sugarkube-dspace-guide]. The guide uses `helm-oci-install`/
   `helm-oci-upgrade` from the [justfile][sugarkube-justfile] to render and apply the stack with a
   Traefik ingress host and optional image tag overrides.
4. Confirm the ingress and pods are healthy with `just app-status namespace=dspace release=dspace`
   (also defined in the sugarkube `justfile`).

Suggested defaults (align with the sugarkube examples):

- Chart: `oci://ghcr.io/democratizedspace/charts/dspace`.
- Namespace/release: `dspace`.
- Values file: `docs/examples/dspace.values.dev.yaml` from the sugarkube repo.
- Host: `dspace-v3.<your-domain>` fronted by your Cloudflare Tunnel route.
- Image tag: `v3-latest` (override with `tag=v3-<shortsha>` when testing a specific build).

## Troubleshooting

- **Ingress 404s**: Verify the Cloudflare Tunnel route points to
  `http://traefik.kube-system.svc.cluster.local:80` and that the tunnel pod reports ready.
- **Chart/image mismatch**: Re-run the GHCR publish workflow for the correct branch and pull the
  chart locally to confirm the packaged `values.yaml` and default image tag match expectations.
- **Helm reuse issues**: If `helm-oci-upgrade` fails while reusing values, retry with
  `helm-oci-install` and the same parameters to allow fresh values to be applied.
- **Traefik ingress class**: Keep `ingress.className=traefik`; using another class requires updating
  both the Helm values and the sugarkube ingress host configuration.

[ci-helm]: https://github.com/democratizedspace/dspace/blob/v3/.github/workflows/ci-helm.yml
[sugarkube-dspace-guide]: https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md
[sugarkube-justfile]: https://github.com/futuroptimist/sugarkube/blob/main/justfile#L279-L347
[sugarkube-raspi]: https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md
