# Environment Overlays

Each directory under `deploy/env/` maps to a sugarkube-managed k3s cluster. The manifests are
Flux-ready: `kustomization.yaml` turns the environment-specific `values.yaml` into a ConfigMap and
attaches it to a `HelmRelease` that points back to this repository's in-tree chart. All overlays
deploy into the shared `dspace` namespace; the generated ConfigMaps remain unique via environment-
specific names (e.g., `dspace-dev-values`).

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

Each `values.yaml` also maps its TLS secret to the ingress hostname so Traefik and cert-manager can
issue the appropriate certificate per environment. The automated test
`tests/helmChartTls.test.ts` guards this wiring.

For a quick reference of the values baked into each overlay, see **Environment overlays** in
[`docs/config.md`](../../docs/config.md); it captures the hostnames, image strategy, metrics, and
feature flags surfaced by these `values.yaml` files.

## Static assets and cache headers

- Rolling updates with at least two replicas (default in the chart and enabled for `int`/`prod`)
  keep the previous pod online while the new build becomes ready so clients with old HTML can still
  fetch hashed assets during a deployment window.
- The Astro middleware now sets `Cache-Control: no-store` for HTML, `Cache-Control: no-cache` for
  `/service-worker.js`, and long-lived immutable caching for `/_astro/*` bundles to align with
  Traefik and any downstream CDN behavior.

## Metrics & Monitoring

- Enable metrics collection by setting the overlay's `env.extra` entry for
  `DSPACE_ENABLE_METRICS` to `"1"`; the SSR container skips exporting `/metrics` unless the flag is
  flipped on.
- Turn on Prometheus scraping with `serviceMonitor.enabled: true` and ensure the
  `serviceMonitor.namespaceSelector` (or the release namespace) lines up with the namespace that
  hosts your monitoring stack, such as `monitoring` for kube-prometheus-stack.
- Keep production images pinned by digest (empty tag + populated `image.digest`) so Flux always
  deploys the exact immutable build you validated, including its metrics instrumentation.
