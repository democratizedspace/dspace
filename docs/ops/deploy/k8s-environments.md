# Kubernetes environment overlays

Use the `infra/k8s/environments/` overlays when you need to tune replica counts or image tags for
a specific environment without rewriting the base manifests under `infra/k8s/`. These overlays are
intended for the Raspberry Pi k3s cluster managed by sugarkube; review the end-to-end deployment
runbook in [docs/k3s-sugarkube-dev.md](../../k3s-sugarkube-dev.md) before applying them.

## Layout

- `infra/k8s/` – base Deployment and Service used by every environment
- `infra/k8s/environments/` – overlay entrypoints
    - `production/` – references the base manifests and bumps replicas for HA

## Applying an overlay

Run kustomize-style applies against the overlay root with your `kubectl` context pointed at the
Sugarkube-provisioned cluster:

```bash
kubectl apply -k infra/k8s/environments/production
```

Add additional overlays (for example, `staging/`) by creating a new folder next to `production/`
with its own `kustomization.yaml` and any patches you need. Keep secrets out of these overlays—use a
secret manager or sealed secrets instead.
