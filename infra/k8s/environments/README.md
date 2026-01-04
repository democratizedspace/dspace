# Environment Overlays

This directory holds environment-specific overlays for the base manifests in `../`. Use these
overlays to tune replicas, image tags, and environment variables without changing the shared
templates that `infra/k8s/` exports. They are intended for the k3s + sugarkube deployments described
in [`docs/k3s-sugarkube-staging.md`](../../../docs/k3s-sugarkube-staging.md) (see the sibling dev
and prod runbooks for environment-specific guidance).

Apply an overlay with kustomize-style commands:

```bash
kubectl apply -k infra/k8s/environments/production
```

Each overlay should:

- Reference the base manifests from `../..`
- Capture any environment-only values (e.g., replica counts, hostnames)
- Avoid storing secrets; use external secret managers or sealed secrets instead
