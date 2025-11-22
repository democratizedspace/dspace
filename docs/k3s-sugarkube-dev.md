# Deploying dspace v3 to k3s with sugarkube

Use this runbook to take `dspace@v3` from source to a running web server on the sugarkube
three-server HA k3s cluster. It links directly to the sugarkube recipes, GHCR build workflows,
and Cloudflare Tunnel notes so you can move from zero to serving traffic without hunting for
prerequisites.

## Source of truth and upstream references

- dspace Helm chart: [`charts/dspace`](../charts/dspace)
- CI workflows that publish GHCR artifacts (both add a branch selector for `v3` or `main`):
  - Container image: [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
  - Helm chart: [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
- sugarkube deployment guide for this app: [docs/apps/dspace.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
- OCI Helm helpers in the sugarkube justfile:
  - [helm-oci-install](https://github.com/futuroptimist/sugarkube/blob/main/justfile#L345-L346)
  - [helm-oci-upgrade](https://github.com/futuroptimist/sugarkube/blob/main/justfile#L348-L349)
- sugarkube platform bring-up for the Raspberry Pi HA cluster:
  - [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  - [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
- Cloudflare Tunnel installation (used to reach Traefik from the internet):
  [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
- Promotion guidance for landing v3 changes on `main`: [merge-plan.md](./merge-plan.md)

## Assumptions and prerequisites

### Hardware and cluster configuration

This guide assumes you are deploying to sugarkube's **Raspberry Pi 5 three-server HA cluster**:

- 3× Raspberry Pi 5 (or similar 64-bit ARM) nodes running the sugarkube image
- k3s installed with the default Traefik ingress controller enabled
- `env=dev` as the target environment for sugarkube commands
- Cluster brought up following [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)

The GHCR workflows build **multi-arch container images** including `linux/arm64`, so the images are
ready to run on the Raspberry Pi cluster without modification.

### Required access and tooling

- You have sugarkube's three-server HA cluster online following the Raspberry Pi setup guide
  (`just ha3 env=dev`), with Traefik enabled by default in k3s.
- You can log in to GHCR with a token that can pull `ghcr.io/democratizedspace` images and charts.
- Cloudflare manages the DNS zone for the hostname that will front dspace, and you can create a
  tunnel route that targets `traefik.kube-system.svc.cluster.local:80` inside the cluster.
- `kubectl` is pointed at the cluster and `just` is installed where you will run the sugarkube
  commands.

## Quick start: happy path for Raspberry Pi HA cluster

Once you have completed the [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
and configured your Cloudflare Tunnel, deploying dspace from the `v3` branch requires:

1. **Build artifacts**: Manually trigger both GHCR workflows from the Actions tab, selecting `v3`:
   - [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

2. **Deploy to cluster**: Run the sugarkube helm-oci-install command from your control node:

```bash
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  host=dspace-v3.<your-domain> \
  default_tag=v3-latest
```

3. **Verify**: Check the deployment and open the site at `https://dspace-v3.<your-domain>`.

The sections below provide full context for each step, branch-specific tag conventions, and
troubleshooting guidance.

## Step 1: Build and publish GHCR artifacts from the right branch

Both workflows accept a branch selector (`v3` or `main`) and produce branch-specific tags:

- **For `v3` builds**: tags are `v3-<shortsha>` and `v3-latest`
- **For `main` builds**: tags are `main-<shortsha>` and `main-latest`

This prevents `main` builds from overwriting `v3-latest` and keeps environments isolated.

### Running the workflows

1. Container image: trigger the
   [Build and publish GHCR image workflow](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   and choose the branch (`v3` for ongoing work, `main` after following [merge-plan.md](./merge-plan.md)).
   - The workflow generates `<branch>-<shortsha>`, `<branch>-latest`, and `v{version}` tags for multi-arch images.
   - Images include both `linux/amd64` and `linux/arm64` platforms for Raspberry Pi compatibility.
2. Helm chart: trigger the
   [Publish Helm chart workflow](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
   with the same branch selection. It packages `charts/dspace` and pushes to
   `oci://ghcr.io/democratizedspace/charts`.
3. Confirm the outputs match the tags you plan to deploy:

```bash
# List pushed images (requires GHCR login)
crane ls ghcr.io/democratizedspace/dspace | grep "^<branch>-"

# Check available chart versions
helm pull oci://ghcr.io/democratizedspace/charts/dspace --version <version> --untar
```

## Step 2: Prepare the sugarkube cluster for ingress

1. Bring up or refresh the HA cluster on each Raspberry Pi by following the sugarkube guide:
   [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
   and day-two operations in
   [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md).
2. Verify Traefik is available (required for the ingress class):

```bash
kubectl -n kube-system get svc -l app.kubernetes.io/name=traefik
```

3. Install the Cloudflare Tunnel connector on a node that can reach the cluster API, then create a
   DNS route to the Traefik service using the sugarkube guide:
   [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md).

## Step 3: Deploy with sugarkube

The sugarkube [dspace app guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
wraps the `helm-oci-*` recipes so you can install or upgrade with one command. Substitute your domain
and desired tags as needed.

```bash
# Install or upgrade the release with Traefik ingress
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  host=dspace-<branch>.<your-domain> \
  default_tag=<branch>-latest

# Roll forward to a specific build (e.g., <branch>-<shortsha>)
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  tag=<branch>-<shortsha>
```

Notes:

- `version_file` pins the Helm chart version tested with sugarkube; override with `version=<semver>`
  if you need a specific chart release.
- `default_tag` sets the fallback image tag. Provide `tag=<imageTag>` to target a specific image.
- When deploying from `main`, align `default_tag` or `tag` with the `main-*` tags created by the
  workflow.
- Values file reference: `docs/examples/dspace.values.dev.yaml` in the sugarkube repo contains the
  ingress host and Cloudflare defaults for the dev environment.
- If you prefer a direct Helm check before running sugarkube, run the quick test from the
  [Helm install section](./charts.md#install-from-ghcr-oci) with the same ingress host.

## Step 4: Verify the rollout

```bash
# Confirm pods, services, and ingress objects
kubectl -n dspace get pods,svc,ingress

# Check sugarkube status helper
just app-status namespace=dspace release=dspace

# Open the site at https://dspace-<branch>.<your-domain>
```

If you use Cloudflare, ensure the tunnel route points to the Traefik service hostname and that the
DNS record for `dspace-<branch>.<your-domain>` is proxied through the tunnel.

## Troubleshooting

- Pull or Helm auth failures: log in to GHCR (`helm registry login ghcr.io -u <user> -p <token>`) and
  confirm the branch you built matches the tag you are deploying.
- Ingress not reachable:
  - Validate Cloudflare Tunnel status and the route target (`traefik.kube-system.svc.cluster.local`).
  - Confirm the ingress uses the `traefik` class and that Traefik reports healthy in
    `kubectl -n kube-system get deploy,svc | grep traefik`.
- Release drift: inspect rendered values and history with `helm -n dspace status dspace` and
  `helm -n dspace get values dspace`.
- Pods failing readiness:
  - Check pod logs (`kubectl -n dspace logs deploy/dspace-frontend`) and describe events to see if
    the image tag or chart version mismatches the published artifacts.
- Cluster-level issues: use sugarkube's HA diagnostics and log capture from the Raspberry Pi runbooks
  if mDNS discovery, etcd health, or networking regress after upgrades.
