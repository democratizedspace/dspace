# Kubernetes Manifests for DSPACE

These manifests deploy the `dspace-app` container built from `frontend/Dockerfile`.

1. Build and load the image:
   ```bash
   docker build -t dspace-app:latest -f frontend/Dockerfile ./frontend
   k3s ctr images import dspace-app:latest
   ```
2. Apply the manifests:
   ```bash
    kubectl apply -f infra/k8s/
   ```

Edit `infra/k8s/dspace-deployment.yaml` if your image is stored in a registry.
