# Kubernetes environment overlays

Use the `infra/k8s/environments/` overlays when you need to tune replica counts or image tags for
a specific environment without rewriting the base manifests under `infra/k8s/`.

> **Prefer sugarkube for k3s**: Our primary deployment path for v3 runs on a k3s cluster managed by
> sugarkube. Follow the [k3s sugarkube runbook](../../k3s-sugarkube-dev.md) for the HA Raspberry Pi
> cluster, which installs the Helm chart with the right values for that environment. The overlays
> in this directory mirror the same container image and health endpoints so they stay compatible
> when you need a direct `kubectl apply` fallback.

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
