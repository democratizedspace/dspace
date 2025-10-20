# DSPACE environment overlays

The files in this directory provide opinionated Helm values for each
sugarkube-managed environment. Flux or Argo CD can reference them when
rendering the `deploy/charts/dspace` chart.

## Usage with Flux HelmRelease

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta2
kind: HelmRelease
metadata:
  name: dspace
  namespace: dspace
spec:
  interval: 5m
  chart:
    spec:
      chart: ./deploy/charts/dspace
      sourceRef:
        kind: GitRepository
        name: dspace
        namespace: flux-system
  valuesFiles:
    - deploy/env/dev/values.yaml # swap for int/prod
```

Each environment file customises replica counts, ingress hosts, TLS
secrets, and secret references. The `networkPolicy.egress.additional`
sections whitelist outbound HTTPS traffic via cloudflared.
