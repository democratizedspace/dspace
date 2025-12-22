# Production Overlay

This overlay layers production-specific knobs on top of the shared manifests in `infra/k8s/`. It
tracks the staging deployment documented in
[`docs/k3s-sugarkube-dev.md`](../../../../docs/k3s-sugarkube-dev.md) so the HA k3s cluster managed by
sugarkube can run the published `v3` images.

- Bumps the replica count to 2 for high availability
- Reuses the published `ghcr.io/democratizedspace/dspace:v3-latest` image
- Keeps the base health probes and port mapping in sync with the root manifests

Apply with:

```bash
kubectl apply -k infra/k8s/environments/production
```
