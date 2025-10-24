# docs/prompts/codex/dspace-v3-k3s.md
# One-click repo task: package DSPACE v3 for k3s (arm64+amd64), Helm chart, env overlays, and observability

You are the code agent for DSPACE v3. Implement the following **in one atomic PR**.

CONTEXT
- DSPACE v3 will run on the k3s cluster(s) managed by sugarkube (Traefik ingress, cert-manager TLS, cloudflared egress).
- We need reproducible, multi-arch images and clean configuration separation for `dev`, `int`, `prod`.

DELIVERABLES
1) **Containerization**
   - `Dockerfile` producing **linux/amd64** and **linux/arm64** images; non-root user.
   - Config purely via env vars; exit gracefully on SIGTERM.
   - Health endpoints: `/healthz` (readiness), `/livez` (liveness).
   - Optional `/metrics` (basic counters/gauges) and structured logs.
   - If the app needs persistence, mount a PVC (`RWX` optional) with a `StorageClass` provided by the platform (Longhorn default).

2) **Multi-arch build & publish**
   - `.github/workflows/build.yml` (Docker Buildx) to build/push to **GHCR** with semver (if any) and immutable `sha-<shortsha>` tags; add OCI labels.

3) **Helm chart (`deploy/charts/dspace`)**
   - `Deployment`, `Service`, `Ingress`, resource requests/limits for Pi 5.
   - `values.yaml` with env var mapping, secrets (referenced via K8s Secret), replicas, ingress hosts/TLS, optional PVC size/class.
   - `NetworkPolicy` (ingress from Traefik; egress minimal).
   - If background workers/cron are needed, add `Deployment`/`CronJob` accordingly.

4) **Environment overlays**
   - Under `deploy/env/`, add `dev/`, `int/`, `prod/` values files (hosts, replicas, feature flags).
   - Provide Flux-friendly kustomizations or a short README showing how sugarkube will reference these values per cluster.

5) **Docs**
   - `docs/config.md`: required env vars (with examples), Secret names (SOPS managed), storage needs, ports.
   - `docs/prompts/codex/dspace-v3-k3s.md`: keep THIS prompt + the acceptance checklist.

SNIPPETS (examples; adapt to the app)

- Minimal **Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dspace
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-dns01
spec:
  ingressClassName: traefik
  tls:
    - hosts: [ "dspace.example.com" ]
      secretName: dspace-tls
  rules:
    - host: dspace.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dspace
                port:
                  number: 8080
```

ACCEPTANCE CHECKLIST
- [x] Image builds for **arm64+amd64** and publishes to GHCR with immutable SHA tag.
- [x] Helm chart installs cleanly; probes pass; graceful shutdown verified (Helm test curls
  `/healthz` and `/livez`; configurable termination grace period defaults to 30s).
- [x] TLS via cert-manager works; app reachable at env-specific hostnames through Traefik/cloudflared.
- [ ] If PVCs are enabled, they bind with the platform default `StorageClass` (e.g., Longhorn).
- [x] NetworkPolicy present; logs/metrics visible to the platform stack (Prometheus/Loki).
- [x] `deploy/env/{dev,int,prod}` values documented and ready for Flux consumption (see
  `docs/config.md#environment-overlays`).
