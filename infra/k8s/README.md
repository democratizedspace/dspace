# Kubernetes Manifests for DSPACE

These manifests deploy the `dspace-app` container built from the root `Dockerfile`. They match the
k3s + sugarkube deployment documented in [`docs/k3s-sugarkube-dev.md`](../../docs/k3s-sugarkube-dev.md)
for the staging cluster.

The container exposes port **8080** and provides health endpoints at `/healthz` (readiness)
and `/livez` (liveness).

## Using GHCR images (recommended)

The deployment uses pre-built images from GHCR by default:

```bash
kubectl apply -f infra/k8s/
```

## Building locally

To build and load the image locally for k3s:

```bash
docker build -t dspace-app:latest .
k3s ctr images import dspace-app:latest
```

Then update `infra/k8s/dspace-deployment.yaml` to use the local image tag.

## Configuration

- **Port**: 8080
- **Health endpoints**: `/healthz` (readiness), `/livez` (liveness)
- **Image**: `ghcr.io/democratizedspace/dspace:v3-latest`

Edit `infra/k8s/dspace-deployment.yaml` if you need to customize the image tag or configuration.

## Environment overlays

Environment-specific kustomize overlays live in `infra/k8s/environments/`. The `production`
overlay references the base manifests in this directory and bumps replicas for high availability:

```bash
kubectl apply -k infra/k8s/environments/production
```

Create additional overlays (for example, `staging/`) by adding a folder under
`infra/k8s/environments/` that points back to `../../k8s` in its `kustomization.yaml` and applies
any environment-only patches.
