# Deploying dspace v3 to k3s with sugarkube

> **Scope:** This runbook covers **staging** (`staging.democratized.space`) using the `v3` branch.
> The production site (`democratized.space`) currently runs v2.x from the `main` branch and is
> managed separately.

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

- Sugarkube ha3 cluster is running _and_ you have completed the Traefik installation in the
  sugarkube operations guide:
  [Install and verify Traefik ingress](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md#install-and-verify-traefik-ingress).

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
  published application route that targets `traefik.kube-system.svc.cluster.local` inside the cluster.
- `kubectl` is pointed at the cluster and `just` is installed where you will run the sugarkube
  commands.

## Quick start: happy path for Raspberry Pi HA cluster

Once you have completed the [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
and configured your Cloudflare Tunnel, deploying dspace from the `v3` branch requires:

1. **Build artifacts**: Manually trigger both GHCR workflows from the Actions tab, selecting `v3`:
   - [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

2. **Deploy to cluster**: On a sugarkube control node (e.g., `sugarkube0`), run the following from
   `~/sugarkube`. The staging host (`staging.democratized.space`) is defined in
   `dspace.values.staging.yaml`:

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml,docs/examples/dspace.values.staging.yaml \
  version_file=docs/apps/dspace.version \
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

## Step 2: Confirm the sugarkube + Cloudflare Tunnel prerequisites

This runbook assumes you already finished the ingress and tunnel setup documented in the sugarkube
repo. Use the sugarkube guides to reach the following starting point before touching the dspace
Helm release:

- 3-node HA k3s cluster is online via sugarkube (`just ha3 env=dev`). See
  [raspi_cluster_setup.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  and [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md).
- Traefik is installed and healthy (`just traefik-install` and `just traefik-status`).
- Cloudflare Tunnel connector is running in the cluster via
  `just cf-tunnel-install env=dev token="$CF_TUNNEL_TOKEN"`.
- Published application route sends `staging.democratized.space` to
  `traefik.kube-system.svc.cluster.local` (Type: HTTP).
- DNS CNAME points `staging.democratized.space` to the tunnel endpoint (`<UUID>.cfargotunnel.com`).

For the full tunnel and Traefik steps, follow sugarkube's
[cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
and
[raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md).

### Configure Cloudflare Tunnel hostname and DNS

Helm and `just helm-oci-install` only create Kubernetes resources (Deployment, Service, Ingress);
they do **not** configure Cloudflare routes or DNS records. You must configure those separately in
the Cloudflare dashboard **before** running the Helm install.

1. **Add a published application route:**
   - In the Cloudflare dashboard, open the `democratized.space` zone.
   - Navigate to **Zero Trust → Networks → Tunnels** and select the existing tunnel for your
     cluster (e.g., `dspace-staging-v3`).
   - Open the **Published application routes** tab and click **Add a published application route**.
   - Fill in the **Hostname** section:
     - **Subdomain**: `staging`
     - **Domain**: `democratized.space`
     - **Path**: leave blank
   - A banner will confirm that a DNS record for `staging.democratized.space` will be created.
   - Fill in the **Service** section:
     - **Type**: `HTTP`
     - **URL**: `traefik.kube-system.svc.cluster.local`
   - Leave all advanced settings (HTTP Host Header, Disable Chunked Encoding, Access JWT, etc.) at
     their defaults. This is fine for staging and causes Cloudflare to send
     `Host: staging.democratized.space` to Traefik.
   - Save the route.

2. **Verify DNS record:**
   - In the Cloudflare dashboard, go to **DNS → Records** for the `democratized.space` zone.
   - Confirm there is a proxied CNAME record:
     - **Type**: `CNAME`
     - **Name**: `staging`
     - **Target**: `<tunnel-UUID>.cfargotunnel.com`
     - **Proxy status**: Proxied (orange cloud)
   - Cloudflare typically creates this automatically when you add the published application route,
     but verify it exists.

Once those are in place, the remainder of this document focuses on deploying dspace v3 itself.

The steps below pick up after the tunnel and Traefik are live and verified. Replace example secret
values with real credentials and adjust the namespace or host only if your environment differs from
`staging.democratized.space`.

## Step 3: Prepare the namespace

> **Where to run:** Commands in Steps 3–5 (`kubectl`, `just helm-oci-install`) are executed on a
> sugarkube control node (e.g., `sugarkube0`) with the sugarkube repo checked out at `~/sugarkube`.

Create or reuse the dspace namespace:

```bash
kubectl create namespace dspace
# If it already exists, rerun with --dry-run=client -o yaml | kubectl apply -f -
```

Alternatively, Helm can create the namespace automatically when you include `--create-namespace` in
the install command.

**Note:** dspace v3 is a frontend-only deployment with no backend services. All game state is stored
client-side (localStorage and IndexedDB), so there are no secrets required by default:

- No Postgres database connection
- No JWT-based authentication
- No metrics token (metrics are served unauthenticated unless you enable `METRICS_TOKEN`)

If you later add optional features (e.g., protected metrics scraping), you can create secrets and
reference them via the chart's `secret` or `env` values. For the default v3 deployment, skip secret
creation entirely.

## Step 4: Staging ingress values

The staging ingress values for dspace are version-controlled in the sugarkube repo at
[`docs/examples/dspace.values.staging.yaml`](https://github.com/futuroptimist/sugarkube/blob/main/docs/examples/dspace.values.staging.yaml).
This file contains the staging-specific overrides:

```yaml
ingress:
  enabled: true
  className: traefik
  host: staging.democratized.space
```

The chart uses a single `host` string (not a list) and creates one Ingress rule for that hostname
with a catch-all path (`/`). TLS is disabled by default because Cloudflare terminates TLS at the
tunnel edge before forwarding to Traefik inside the cluster.

Deploys from the Pis are run from `~/sugarkube` using `just helm-oci-install`, which is already
wired to use both `dspace.values.dev.yaml` and `dspace.values.staging.yaml` together. No manual
creation of a values file is required.

## Step 5: Install or upgrade the Helm release

Deploy via the sugarkube justfile wrapper (recommended so chart versions stay aligned with the
sugarkube app guide). From `~/sugarkube` on a sugarkube control node:

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml,docs/examples/dspace.values.staging.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=v3-latest
```

To target a specific image build, add `tag=<branch>-<shortsha>` or use `just helm-oci-upgrade` with
the same arguments. If you are running Helm directly, mirror the same values files:

```bash
helm upgrade --install dspace oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --version "$(cat docs/apps/dspace.version)" \
  --values docs/examples/dspace.values.dev.yaml \
  --values docs/examples/dspace.values.staging.yaml
```

### Verification

```bash
kubectl -n dspace get pods
kubectl -n dspace get svc,ingress
```

Confirm the ingress shows `staging.democratized.space` as the host and the `traefik` ingress class,
then open `https://staging.democratized.space` in a browser. You should see the dspace v3 UI served
through the Cloudflare Tunnel and Traefik.

## End-to-end checklist for dspace staging

- [ ] Sugarkube cluster: `just cluster-status` is healthy.
- [ ] Traefik: `just traefik-status` is healthy.
- [ ] Cloudflare Tunnel: connector running (`kubectl -n cloudflare get deploy,po`) and `/ready`
      returns 200. Verify with a two-shell port-forward:
  - Shell 1: `kubectl -n cloudflare port-forward deploy/cloudflare-tunnel 2000:2000`
  - Shell 2: `curl -fsS http://localhost:2000/ready`
  - A JSON response containing `"status":200` confirms the tunnel is healthy.
- [ ] Published application route: `staging.democratized.space` →
      `traefik.kube-system.svc.cluster.local` (Type: HTTP).
- [ ] DNS: `staging.democratized.space` CNAME → `<UUID>.cfargotunnel.com` (proxied).
- [ ] dspace Helm release deployed in `dspace` (or your chosen) namespace.
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
