# Environment Overlays

This directory holds environment-specific overlays for the base manifests in `../` and mirrors the
k3s layout we deploy with sugarkube (see `docs/k3s-sugarkube-dev.md`). Use these overlays to tune
replicas, image tags, and environment variables without changing the shared templates that
`infra/k8s/` exports.

Apply an overlay with kustomize-style commands:

```bash
kubectl apply -k infra/k8s/environments/production
```

Each overlay should:

- Reference the base manifests from `../../k8s`
- Capture any environment-only values (e.g., replica counts, hostnames)
- Avoid storing secrets; use external secret managers or sealed secrets instead
