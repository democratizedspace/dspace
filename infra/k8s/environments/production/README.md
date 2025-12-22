# Production Overlay

This overlay layers production-specific knobs on top of the shared manifests in
`infra/k8s/` and keeps them aligned with the k3s + sugarkube staging setup in
[`docs/k3s-sugarkube-dev.md`](../../../../docs/k3s-sugarkube-dev.md).

- Bumps the replica count to 2 for high availability
- Reuses the published `ghcr.io/democratizedspace/dspace:v3-latest` image
- Keeps the base health probes and port mapping in sync with the root manifests

Apply with:

```bash
kubectl apply -k infra/k8s/environments/production
```
