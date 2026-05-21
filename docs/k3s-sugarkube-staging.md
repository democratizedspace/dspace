# DSPACE staging runbook: k3s + sugarkube

Related release docs:

- [Release procedure](./merge-plan.md)
- [Patch QA checklist (`v3.0.1`)](./qa/v3.0.1.md)
- [Feature QA checklist (`v3.1`)](./qa/v3.1.md)

## Topology and role (current live state)

- Environment: `env=staging`
- Public host: `https://staging.democratized.space`
- Live cluster nodes: `sugarkube3`, `sugarkube4`, `sugarkube5`
  - These are the hostnames used by this staging instantiation. Sugarkube operators may
    choose arbitrary hostnames for their own three-node HA staging clusters.
- Availability model: 3-node HA
- QA Cheats: **ON** (`DSPACE_ENV=staging`)

Staging is the canonical pre-production validation environment. It is where candidate tags are
validated before production promotion.

## Release model for staging

- Prefer immutable branch build tags from CI: `main-<shortsha>`.
- For tag-driven release candidates, use artifact tags published by `build.yml` from git tags
  (for example `3.1.0-rc.2` from git tag `v3.1.0-rc.2`).
- Avoid mutable tags (`main-latest`, `v<package-version>`) for release sign-off.

See the cross-environment release procedure: [docs/merge-plan.md](./merge-plan.md).

## Prerequisites

- Access to staging cluster context (`env=staging`)
- sugarkube checkout at `~/sugarkube`
- GHCR pull access for image and Helm chart artifacts
- Traefik and Cloudflare tunnel already configured for `staging.democratized.space`
- tools: `just`, `kubectl`, `curl`

## Deploy a candidate tag

```bash
cd ~/sugarkube
```

Use install semantics when the `dspace` Helm release does not exist yet, such as after a
cluster wipe or first-time staging bootstrap. The upgrade helper requires an existing deployed
release and fails on a fresh cluster with `UPGRADE FAILED: "dspace" has no deployed releases`.

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

Use upgrade semantics only after the `dspace` release exists in the staging namespace.

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

## Validate candidate in staging

```bash
kubectl -n dspace get deploy,po,svc,ingress
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
```

```bash
curl -fsS https://staging.democratized.space/config.json
```

```bash
curl -fsS https://staging.democratized.space/healthz
```

```bash
curl -fsS https://staging.democratized.space/livez
```

Run the release checklist from the QA index:

- [QA checklists index](./qa/README.md)

## Iterate with a newer candidate

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_NEW_SHORTSHA
```

## Roll back staging

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.staging.yaml version_file=docs/apps/dspace.version tag=<previous-immutable-tag>
```

## Promotion handoff to prod

Promote only after staging sign-off. Hand off:

- immutable tag approved in staging
- commit SHA
- checklist link + sign-off timestamp
- rollback tag confirmed

Prod should deploy the same approved immutable artifact (not `main-latest`).

## Troubleshooting and recovery notes

- Prefer positional environment arguments in Sugarkube commands:
  - `just up staging`
  - `just save-logs staging`
- Legacy named syntax (`just up env=staging`) had malformed env parsing before
  Sugarkube PR #2165; keep using positional form for operator consistency.
- For Cloudflare tunnel install, use positional env form until the named env parser fix lands:
  - preferred: `just cf-tunnel-install staging token="$CF_TUNNEL_TOKEN"`
  - avoid: `just cf-tunnel-install env=staging token="$CF_TUNNEL_TOKEN"`
    (`sugarkube-env=staging` tunnel-name bug)
- After a cluster wipe/rebuild, use `helm-oci-install` first.
  `helm-oci-upgrade` is for steady-state updates and fails on fresh state with
  `UPGRADE FAILED: "dspace" has no deployed releases`.
- If Helm OCI pulls fail with `403 denied: denied`, rotate/re-login GHCR credentials:

  ```bash
  helm registry login ghcr.io
  ```

  Use a PAT with `read:packages`, then verify access:

  ```bash
  helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
  ```

- After rebuilds, verify cluster networking/ingress before blaming app release content:

  ```bash
  just cluster-status
  just traefik-status
  just traefik-crd-doctor
  ```

  Reinstall only if required:

  ```bash
  just traefik-install
  just cf-tunnel-install staging token="$CF_TUNNEL_TOKEN"
  ```

- Cluster-level failures after DHCP/IP reassignment are owned by Sugarkube operations.
  Use Sugarkube docs and canonical outage RCA for remediation details:
  - [Sugarkube setup guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md)
  - [Sugarkube operations guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
  - [Sugarkube troubleshooting guide](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_troubleshooting.md)
  - [Canonical outage markdown](https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.md)
  - [Canonical outage JSON](https://github.com/futuroptimist/sugarkube/blob/main/outages/2026-05-18-sugarkube-ha-staging-dhcp-ip-reassignment.json)

- For staging-only deploys (for example `v3.0.1-rc.5` validation), verify that:
  - `https://staging.democratized.space/config.json` reports the expected SHA/tag
  - `https://democratized.space/config.json` remains on the intended prod release (for example `3.0.0`)
