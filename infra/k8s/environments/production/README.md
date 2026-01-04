# Production Overlay

This overlay layers production-specific knobs on top of the shared manifests in `infra/k8s/`. It is
derived from the deployment documented in
[`docs/k3s-sugarkube-staging.md`](../../../../docs/k3s-sugarkube-staging.md) and adapts it for the HA
prod cluster managed by sugarkube to run the published `v3` images (see
[`docs/k3s-sugarkube-prod.md`](../../../../docs/k3s-sugarkube-prod.md) for the full prod runbook).

- Bumps the replica count to 2 for high availability
- Reuses the published `ghcr.io/democratizedspace/dspace:v3-latest` image
- Keeps the base health probes and port mapping in sync with the root manifests

Apply with:

```bash
kubectl apply -k infra/k8s/environments/production
```
