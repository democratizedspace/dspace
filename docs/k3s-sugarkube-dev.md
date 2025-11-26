# Deploying dspace v3 to k3s with sugarkube

Use this runbook to take [`dspace@v3`](https://github.com/democratizedspace/dspace/tree/v3) from source to a running web server on the sugarkube
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

## Published artifacts

- dspace multi-arch container images are published to GHCR at
  `ghcr.io/democratizedspace/dspace`.
  - Tags include `v3-latest`, `v3-<short-sha>`, and semantic versions such as `v3.0.0`.
  - Example image reference: `ghcr.io/democratizedspace/dspace:v3-latest`.
- The Helm chart is published as an OCI artifact to
  `oci://ghcr.io/democratizedspace/charts/dspace:<chartVersion>`, where `<chartVersion>` comes
  from `charts/dspace/Chart.yaml`.

## Assumptions and prerequisites

Prerequisites:

- Sugarkube ha3 cluster is running *and* you have completed the Traefik installation in the
  sugarkube operations guide:
  [Install and verify Traefik ingress](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md#install-and-verify-traefik-ingress).
- Cloudflare Tunnel is configured following the sugarkube guide so that
  `staging.democratized.space` forwards to `http://traefik.kube-system.svc.cluster.local:80`
  through the tunnel’s `*.cfargotunnel.com` endpoint. See
  [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md).

### Hardware and cluster configuration

This guide assumes you are deploying to sugarkube's **Raspberry Pi 5 three-server HA cluster**:

- 3× Raspberry Pi 5 (or similar 64-bit ARM) nodes running the sugarkube image
- k3s installed on the cluster
- `env=dev` as the target environment for sugarkube commands
- Cluster brought up following [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)

The Raspberry Pi base cluster setup does **not** install an ingress controller automatically.
dspace v3's k3s deployment assumes Traefik is installed as the cluster ingress. Before continuing,
follow the sugarkube instructions to install and confirm Traefik is running in `kube-system`:
[Install and verify Traefik ingress](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md#install-and-verify-traefik-ingress).
Once `kubectl -n kube-system get svc -l app.kubernetes.io/name=traefik` shows a `traefik` service,
return here and continue with the dspace deployment steps.

The GHCR workflows build **multi-arch container images** including `linux/arm64`, so the images are
ready to run on the Raspberry Pi cluster without modification.

### Staging domain

- Default public URL for the v3 sugarkube + k3s environment: `staging.democratized.space`
- You can substitute a different domain or subdomain, but examples below assume
  `staging.democratized.space`.

### Required access and tooling

- You have sugarkube's three-server HA cluster online following the Raspberry Pi setup guide
  (`just ha3 env=dev`) and have installed Traefik using the sugarkube operations guide.
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
  host=staging.democratized.space \
  default_tag=v3-latest
```

3. **Verify**: Check the deployment and open the site at `staging.democratized.space`.

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

## Step 2: Confirm sugarkube + Cloudflare Tunnel prerequisites

These checks assume you have already followed the sugarkube docs for cluster bring-up, Traefik, and
Cloudflare Tunnels. Refer back to
[raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
and [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
if anything below is missing.

1. Cluster online: `just cluster-status env=dev` should show the three nodes Ready.
2. Traefik healthy:

   ```bash
   just traefik-status env=dev
   kubectl -n kube-system get svc -l app.kubernetes.io/name=traefik
   ```

3. Cloudflare Tunnel connector installed in the cluster (from the sugarkube tunnel guide):

   ```bash
   just cf-tunnel-install env=dev token="$CF_TUNNEL_TOKEN"
   kubectl -n cloudflare get deploy,po
   ```

   The tunnel should route `staging.democratized.space` to
   `http://traefik.kube-system.svc.cluster.local:80` and your DNS should contain
   `staging.democratized.space` → `<UUID>.cfargotunnel.com` as a proxied CNAME.

## Step 3: Deploy dspace v3 on a Sugarkube + Cloudflare Tunnel cluster

This section assumes you have already completed the sugarkube bring-up, Traefik installation, and
Cloudflare Tunnel steps in the sugarkube repo:

- 3-node HA k3s cluster created with sugarkube
- Traefik installed and healthy (`just traefik-install env=dev`, `just traefik-status env=dev`)
- Cloudflare Tunnel connector running in the cluster via
  `just cf-tunnel-install env=dev token="$CF_TUNNEL_TOKEN"`
- Cloudflare route forwarding `staging.democratized.space` →
  `http://traefik.kube-system.svc.cluster.local:80`
- DNS CNAME: `staging.democratized.space` → `<UUID>.cfargotunnel.com`

See sugarkube’s [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
and [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
for the full tunnel and ingress setup.

### 3.1 Create or confirm the namespace

```bash
kubectl create namespace dspace --dry-run=client -o yaml | kubectl apply -f -
```

### 3.2 Prepare secrets and configuration

Add the runtime secrets the chart needs (replace placeholder values):

```bash
kubectl -n dspace create secret generic dspace-secrets \
  --from-literal=DATABASE_URL='postgres://user:pass@db-host:5432/dspace' \
  --from-literal=JWT_SECRET='replace-me-with-a-random-string' \
  --dry-run=client -o yaml | kubectl apply -f -
```

In your Helm values (see below), enable `secret.enabled: true` and map the keys to environment
variables:

```yaml
secret:
  enabled: true
  stringData:
    DATABASE_URL: ${DATABASE_URL}
    JWT_SECRET: ${JWT_SECRET}
env:
  - name: NODE_ENV
    value: production
```

### 3.3 Define ingress values for staging

Create a minimal override file (for example `values-sugarkube-staging.yaml`) that sets the ingress
host and class for Traefik:

```yaml
image:
  repository: ghcr.io/democratizedspace/dspace
  tag: v3-latest

ingress:
  enabled: true
  className: traefik
  host: staging.democratized.space
```

You can also start from the sugarkube defaults in
`docs/examples/dspace.values.dev.yaml` (in the sugarkube repo) and override the ingress host and
image tag for the build you want to run.

### 3.4 Install or upgrade the Helm release

Use the sugarkube `helm-oci-*` recipes to install the chart into the `dspace` namespace. Substitute
your image tag if you are not using `v3-latest`.

```bash
# Install or upgrade the release with Traefik ingress
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  host=staging.democratized.space \
  default_tag=v3-latest

# Roll forward to a specific build (e.g., v3-<shortsha>)
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  tag=v3-<shortsha>
```

Notes:

- `version_file` pins the Helm chart version tested with sugarkube; override with `version=<semver>`
  if you need a specific chart release.
- `default_tag` sets the fallback image tag. Provide `tag=<imageTag>` to target a specific image.
- When deploying from `main`, align `default_tag` or `tag` with the `main-*` tags created by the
  workflow.
- If you prefer a direct Helm check before running sugarkube, run the quick test from the
  [Helm install section](./charts.md#install-from-ghcr-oci) with the same ingress host.

## Step 4: Verify the rollout

```bash
# Confirm pods, services, and ingress objects
kubectl -n dspace get pods,svc,ingress

# Check sugarkube status helper
just app-status namespace=dspace release=dspace
```

### Verification

After the Helm deployment, verify the ingress host and Traefik routing:

```bash
kubectl -n dspace get pods
kubectl -n dspace get svc,ingress
```

The Ingress should show `staging.democratized.space` as the host with the `traefik` class. Open
`https://staging.democratized.space` in a browser; you should see the dspace v3 UI served through
the Cloudflare Tunnel.

## End-to-end checklist (dspace staging)

- [ ] Sugarkube cluster: `just cluster-status` is healthy.
- [ ] Traefik: `just traefik-status` is healthy.
- [ ] Cloudflare Tunnel: connector running (`kubectl -n cloudflare get deploy,po`) and `/ready`
      returns 200.
- [ ] Cloudflare route: `staging.democratized.space` → `http://traefik.kube-system.svc.cluster.local:80`.
- [ ] DNS: `staging.democratized.space` CNAME → `<UUID>.cfargotunnel.com` (proxied).
- [ ] dspace Helm release deployed in `dspace`.
- [ ] `kubectl -n dspace get ingress` shows host `staging.democratized.space`.
- [ ] Browsing `https://staging.democratized.space` shows the dspace v3 UI.

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
