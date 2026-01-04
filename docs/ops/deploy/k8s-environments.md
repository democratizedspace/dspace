# Kubernetes environment overlays

Use the `infra/k8s/environments/` overlays when you need to tune replica counts or image tags for
a specific environment without rewriting the base manifests under `infra/k8s/`. These overlays are
kept in sync with the k3s + sugarkube deployment flow documented in
[`docs/k3s-sugarkube-staging.md`](../../k3s-sugarkube-staging.md); see the dev/prod runbooks in the
same folder for environment-specific details. This guide stays as the raw `kubectl` / `kustomize`
fallback if you need to operate outside sugarkube.

## Layout

- `infra/k8s/` – base Deployment and Service used by every environment
- `infra/k8s/environments/` – overlay entrypoints
    - `production/` – references the base manifests and bumps replicas for HA

## Applying an overlay

Run kustomize-style applies against the overlay root:

```bash
kubectl apply -k infra/k8s/environments/production
```

Add additional overlays (for example, `staging/`) by creating a new folder next to `production/`
with its own `kustomization.yaml` and any patches you need. Keep secrets out of these overlays—use a
secret manager or sealed secrets instead.
