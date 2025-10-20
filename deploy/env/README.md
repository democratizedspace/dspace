# Environment Overlays

Each directory under `deploy/env/` maps to a sugarkube-managed k3s cluster. The manifests are
Flux-ready: `kustomization.yaml` turns the environment-specific `values.yaml` into a ConfigMap and
attaches it to a `HelmRelease` that points back to this repository's in-tree chart.

## Structure

```
deploy/env/
  dev/
    values.yaml          # dev hostnames, single replica, beta flags
    kustomization.yaml   # generates ConfigMap + references helmrelease.yaml
    helmrelease.yaml     # Flux HelmRelease pointing at deploy/charts/dspace
  int/
    ...
  prod/
    ...
```

## Deploying with Flux

1. Register this repository as a `GitRepository` in `flux-system`:
   ```yaml
   apiVersion: source.toolkit.fluxcd.io/v1
   kind: GitRepository
   metadata:
     name: dspace
     namespace: flux-system
   spec:
     interval: 1m
     url: https://github.com/democratizedspace/dspace.git
     ref:
       branch: main
   ```
2. Point the cluster-specific `Kustomization` at the desired overlay:
   ```yaml
   apiVersion: kustomize.toolkit.fluxcd.io/v1
   kind: Kustomization
   metadata:
     name: dspace-dev
     namespace: flux-system
   spec:
     interval: 10m
     path: ./deploy/env/dev
     prune: true
     sourceRef:
       kind: GitRepository
       name: dspace
   ```
3. Secrets such as `dspace-secrets` (for `METRICS_TOKEN`) should be managed via SOPS so Flux can
   decrypt them during reconciliation.

Override files tweak feature flags, ingress hosts, replica counts, and monitoring for each
environment without duplicating manifests.
