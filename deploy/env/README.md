# DSPACE environment overlays

The files in this directory provide environment-specific overrides for the DSPACE Helm
chart located at `deploy/charts/dspace`.

## Flux usage

Each cluster managed by sugarkube can reference the chart and the appropriate values file
from Flux. The snippet below shows a representative `HelmRelease` using the dev overlay:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: dspace
  namespace: dspace
spec:
  releaseName: dspace
  interval: 5m
  chart:
    spec:
      chart: ./deploy/charts/dspace
      sourceRef:
        kind: GitRepository
        name: dspace
        namespace: flux-system
      version: 0.1.0
  valuesFrom:
    - kind: ConfigMap
      name: dspace-dev-values
      valuesKey: values.yaml
```

Create the `ConfigMap` by pointing Flux at the desired overlay directory:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: dspace
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/democratizedspace/dspace
  ref:
    branch: main
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: dspace-dev-values
  namespace: flux-system
spec:
  interval: 1m
  targetNamespace: dspace
  path: ./deploy/env/dev
  prune: true
  sourceRef:
    kind: GitRepository
    name: dspace
```

The same pattern applies to `int` and `prod` using their respective directories and secret
names. Secrets referenced in the values files should be managed with SOPS and delivered to
the target namespace before reconciling the release.
