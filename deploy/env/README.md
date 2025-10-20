# DSPACE v3 environment overlays

Each directory under `deploy/env/` contains a Helm values file tailored for a
specific sugarkube-managed environment. Flux can reference these values by
mounting the repository and pointing a `HelmRelease` at the shared chart in
`deploy/charts/dspace`.

## Using with Flux

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta2
kind: HelmRelease
metadata:
  name: dspace
  namespace: dspace
spec:
  chart:
    spec:
      chart: ./deploy/charts/dspace
      sourceRef:
        kind: GitRepository
        name: dspace
        namespace: flux-system
  interval: 30m
  valuesFiles:
    - ./deploy/env/dev/values.yaml
```

Update the `valuesFiles` entry for `int` or `prod` clusters. Secrets referenced
in the values should be managed with SOPS and synchronized to the cluster ahead
of time.

## Files

- `dev/values.yaml` – single replica, debug-friendly feature flags, metrics
  token sourced from `dspace-dev-secrets`.
- `int/values.yaml` – two replicas for soak testing and matching ingress host.
- `prod/values.yaml` – three replicas, persistent volume, ServiceMonitor, and
  Prometheus label alignment.
