# Kubernetes Manifests for DSPACE

These manifests deploy the `dspace-app` container built from the root `Dockerfile`.

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
