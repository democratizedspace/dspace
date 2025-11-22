# Deploying dspace v3 to k3s with sugarkube

This guide stitches together dspace’s v3 CI/CD pipeline, GHCR artifacts, and sugarkube’s k3s
playbooks so you can go from a blank 3-server HA cluster to a live dspace site without guessing.
It complements the sugarkube-side walkthrough in [docs/apps/dspace.md][sugarkube-dspace-guide].

## Essential references

- dspace GHCR build: [Build and publish GHCR image workflow][ci-image]
- dspace chart publish: [Publish Helm chart workflow][ci-helm]
- Merge readiness: [v3 → main merge checklist](../docs/merge-plan.md)
- sugarkube platform:
  - [Raspberry Pi HA cluster bring-up][raspi-cluster]
  - [Cloudflare Tunnel setup][cloudflare-tunnel]
  - [dspace deployment guide][sugarkube-dspace-guide]
  - [OCI Helm helpers in the justfile][sugarkube-justfile]

## Prerequisites

- A k3s cluster with Traefik enabled (default ingress class `traefik`). Use sugarkube’s
  [3-node HA recipe][raspi-cluster] to bootstrap `env=dev` on Raspberry Pis.
- `kubectl` access to the cluster and `just` installed where you invoke sugarkube commands.
- Cloudflare account with a managed DNS zone plus a tunnel token that can route
  `<hostname> → http://traefik.kube-system.svc.cluster.local:80`.
- GitHub access that can read GHCR packages in the `democratizedspace/dspace` org.
- A domain name that will front dspace (for example `dspace-v3.example.com`).

## Publish dspace artifacts to GHCR (branch-aware)

Run these once per release candidate. Both workflows now expose a branch picker with `v3` and
`main` options so you can publish from the correct ref while v3 is still in flight:

1. **Build/push the application image** via [Build and publish GHCR image][ci-image]. Trigger the
   workflow on the `v3` branch (default) or `main` as needed. It pushes multi-arch tags:
   `v3-<shortsha>`, `v3-latest`, and `v<package.json version>`.
2. **Package/push the Helm chart** via [Publish Helm chart][ci-helm]. Select the same branch when
   manually dispatching. The job publishes to `oci://ghcr.io/democratizedspace/charts/dspace` and
   outputs the exact chart reference.
3. Consult the [merge checklist](../docs/merge-plan.md) before promoting v3 into main so the chart
   and image tags stay in sync across environments.

## Bring up the sugarkube k3s cluster

Follow sugarkube’s bootstrap steps on the target nodes:

1. Install dependencies and create the HA control plane: `just ha3 env=dev` ([guide][raspi-cluster]).
2. Confirm Traefik is present: `kubectl -n kube-system get svc -l app.kubernetes.io/name=traefik`.
3. Install Cloudflare Tunnel into the cluster after setting `CF_TUNNEL_TOKEN` in your shell:
   `just cf-tunnel-install env=dev` ([tunnel doc][cloudflare-tunnel]).
4. Create a DNS route in Cloudflare from your chosen FQDN to
   `http://traefik.kube-system.svc.cluster.local:80`.

## Deploy dspace with sugarkube

Use the sugarkube-side playbook as the source of truth; the commands below mirror that document so
you can run them end-to-end without cross-referencing:

```bash
# Install or upgrade the release with a Traefik ingress host
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  host=dspace-v3.<your-domain> \
  default_tag=v3-latest

# Inspect status and ingress URL
just app-status namespace=dspace release=dspace

# Roll forward to a specific image tag from the GHCR workflow output
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  tag=v3-<shortsha>
```

Notes:

- `version_file` pins the chart to the latest validated v3 build recorded in sugarkube.
- Override `version=<semver>` if you need to test a specific chart version.
- Override `host` for per-environment ingress (for example `dspace-int.example.com`).

## Validate the deployment

- Check resources: `kubectl -n dspace get ingress,pods,svc`
- Verify app health at `https://dspace-v3.<your-domain>`.
- Confirm the Cloudflare Tunnel service is ready:
  `kubectl -n cloudflare get deploy,po -l app.kubernetes.io/name=cloudflare-tunnel`.

## Troubleshooting

- Helm release state: `helm -n dspace status dspace` and `helm -n dspace get values dspace`.
- Image/chart drift: cross-check the tags produced by the [GHCR image workflow][ci-image] and the
  chart ref from the [Helm chart workflow][ci-helm] before rolling upgrades.
- Ingress reachability: confirm Traefik service DNS (`traefik.kube-system.svc.cluster.local`) from
  the Cloudflare Tunnel pod and verify the Cloudflare route targets that host:port.
- Sugarkube helpers: rerun `just app-status namespace=dspace release=dspace` to surface ingress
  hosts pulled from Helm values ([helper source][sugarkube-justfile]).

## Quick local Helm smoke test (optional)

To validate connectivity without sugarkube, run from any machine with cluster access:

```bash
helm upgrade --install dspace-v3 oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --set ingress.enabled=true \
  --set ingress.host=dspace-v3.<your-domain> \
  --set ingress.className=traefik
```

The service DNS for the app will be `<release>.<namespace>.svc.cluster.local`
(`dspace-v3.dspace.svc.cluster.local` in this example).

[ci-image]: https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml
[ci-helm]: https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml
[cloudflare-tunnel]: https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md
[raspi-cluster]: https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md
[sugarkube-dspace-guide]: https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md
[sugarkube-justfile]: https://github.com/futuroptimist/sugarkube/blob/main/justfile#L281-L347
