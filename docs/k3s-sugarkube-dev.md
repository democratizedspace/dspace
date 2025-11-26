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
- Tunnel route sends `staging.democratized.space` to
  `http://traefik.kube-system.svc.cluster.local:80`.
- DNS CNAME points `staging.democratized.space` to the tunnel endpoint (`<UUID>.cfargotunnel.com`).

For the full tunnel and Traefik steps, follow sugarkube's
[cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
and
[raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md).

Once those are in place, the remainder of this document focuses on deploying dspace v3 itself.

## Deploy dspace v3 on a Sugarkube + Cloudflare Tunnel cluster

The steps below pick up after the tunnel and Traefik are live and verified. Replace example secret
values with real credentials and adjust the namespace or host only if your environment differs from
`staging.democratized.space`.

### Step 3: Prepare the namespace and secrets

Create or reuse the dspace namespace:

```bash
kubectl create namespace dspace
# If it already exists, rerun with --dry-run=client -o yaml | kubectl apply -f -
```

Create the secrets expected by the chart (replace placeholder values):

```bash
kubectl -n dspace create secret generic dspace-secrets \
  --from-literal=POSTGRES_PASSWORD='example-postgres-password' \
  --from-literal=JWT_SECRET='example-jwt-secret'
```

If you keep credentials in a separate repo or secret manager, sync them into this namespace before
running Helm.

### Step 4: Set ingress values for `staging.democratized.space`

Start from the sugarkube values file (`docs/examples/dspace.values.dev.yaml` in the sugarkube repo)
or create a minimal overlay such as `values-staging.yaml` to force Traefik ingress with the
Cloudflare hostname:

```yaml
ingress:
  enabled: true
  className: traefik
  hosts:
    - host: staging.democratized.space
      paths:
        - path: /
          pathType: Prefix
```

Keep any additional settings from the sugarkube defaults (database connection info, storage, etc.)
and layer this ingress block on top.

### Step 5: Install or upgrade the Helm release

Deploy via the sugarkube justfile wrapper (recommended so chart versions stay aligned with the
sugarkube app guide):

```bash
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml \
  version_file=docs/apps/dspace.version \
  host=staging.democratized.space \
  default_tag=v3-latest
```

To target a specific image build, add `tag=<branch>-<shortsha>` or use `just helm-oci-upgrade` with
the same arguments. If you are running Helm directly, mirror the same values file and ingress host:

```bash
helm upgrade --install dspace oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --version "$(cat docs/apps/dspace.version)" \
  --values docs/examples/dspace.values.dev.yaml \
  --set ingress.hosts[0].host=staging.democratized.space \
  --set ingress.className=traefik
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
      returns 200.
- [ ] Cloudflare route: `staging.democratized.space` →
      `http://traefik.kube-system.svc.cluster.local:80`.
- [ ] DNS: `staging.democratized.space` CNAME → `<UUID>.cfargotunnel.com` (proxied).
- [ ] dspace Helm release deployed in `dspace` (or your chosen) namespace.
- [ ] `kubectl -n <dspace-namespace> get ingress` shows host `staging.democratized.space`.
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
