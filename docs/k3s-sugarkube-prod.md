# DSPACE production runbook: k3s + sugarkube

Related release docs:

- [Release procedure](./merge-plan.md)
- [Patch QA checklist (`v3.0.1`)](./qa/v3.0.1.md)
- [Feature QA checklist (`v3.1`)](./qa/v3.1.md)

## Topology and role (current live state)

- Environment: `env=prod`
- Public host: `https://democratized.space`
- Live cluster nodes: `sugarkube0`, `sugarkube1`, `sugarkube2`
- Availability model: 3-node HA
- QA Cheats: **OFF** (`DSPACE_ENV=prod`)

Production is the steady-state public environment. This runbook is for repeated releases and
rollbacks using immutable tags.

## `prod.democratized.space` guidance

`prod.democratized.space` is an optional alias/rehearsal host. It is **not** part of the default
production path to `democratized.space`, and it is never required for a normal production deploy.
Use it only when you explicitly want temporary rehearsal/preview validation.

## Release model for prod

- Deploy from immutable tags only (`main-<shortsha>`, `sha-<longsha>`, or release-tag artifacts
  such as `3.0.1`).
- Do not deploy mutable tags (`main-latest`, `v<package-version>`) to prod.
- Keep the previous known-good immutable tag available for explicit rollback.

See release workflow and branch/tag policy: [docs/merge-plan.md](./merge-plan.md).

## Prerequisites

- Access to prod cluster context (`env=prod`)
- sugarkube checkout at `~/sugarkube`
- GHCR pull access for image and chart artifacts
- Traefik and Cloudflare tunnel already configured for `democratized.space`
- tools: `just`, `kubectl`, `curl`

## Deploy approved immutable tag to prod

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_APPROVED_SHORTSHA
```

## Validate production health

```bash
kubectl -n dspace get deploy,po,svc,ingress
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
```

```bash
curl -fsS https://democratized.space/config.json
```

```bash
curl -fsS https://democratized.space/healthz
```

```bash
curl -fsS https://democratized.space/livez
```

## Optional: deploy release-tag artifact directly

Use the tag format published by `build.yml` (for example, git tag `v3.0.1` publishes image tag
`3.0.1`).

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=3.0.1
```

## Roll back production

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version tag=<previous-immutable-tag>
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
```

```bash
curl -fsS https://democratized.space/healthz
```

## Optional rehearsal on `prod.democratized.space`

Only use this when explicitly needed for rehearsal or temporary alias validation. It is not part of the default production flow.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod-subdomain.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

```bash
curl -fsS https://prod.democratized.space/healthz
```

If rehearsal succeeds and you proceed to production, switch back to `docs/examples/dspace.values.prod.yaml` for the real prod deployment.


## Troubleshooting and cross-environment guardrails

- Use positional Sugarkube env args in operator commands (`just up prod`, `just save-logs prod`)
  for consistency with staging/dev runbooks.
- For Cloudflare tunnel install, prefer positional form until named env parsing is fully fixed:
  - preferred: `just cf-tunnel-install prod token="$CF_TUNNEL_TOKEN"`
  - avoid: `just cf-tunnel-install env=prod token="$CF_TUNNEL_TOKEN"`
- If cluster state is rebuilt, install first and upgrade later:
  - fresh state: `just helm-oci-install ... values=docs/examples/dspace.values.prod.yaml ...`
  - existing release: `just helm-oci-upgrade ... values=docs/examples/dspace.values.prod.yaml ...`
  - fresh-state symptom when using upgrade too early: `UPGRADE FAILED: "dspace" has no deployed releases`
- If GHCR auth fails with `403 denied: denied`, run `helm registry login ghcr.io` with a PAT
  containing `read:packages`, then verify with:

  ```bash
  helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
  ```

- After infra churn/rebuild, verify cluster ingress components before app-level rollback:

  ```bash
  just cluster-status
  just traefik-status
  just traefik-crd-doctor
  ```

  Reinstall only if required:

  ```bash
  just traefik-install
  just cf-tunnel-install prod token="$CF_TUNNEL_TOKEN"
  ```

- Do not deploy staging RC tags to prod by accident. For staging-only validation windows, verify:
  - `https://staging.democratized.space/config.json` is on the intended candidate SHA/tag
  - `https://democratized.space/config.json` remains on the intended production release
- Cluster-level DHCP/IP reassignment failures are canonicalized in Sugarkube docs/outages:
  - [Sugarkube setup](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  - [Sugarkube operations](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
  - [Sugarkube troubleshooting](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_troubleshooting.md)
  - [Canonical outage markdown](https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.md)
  - [Canonical outage JSON](https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.json)
