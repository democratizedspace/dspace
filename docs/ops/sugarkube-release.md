# DSPACE Sugarkube release and deploy runbook

DSPACE is the mature Sugarkube baseline. Keep the release path boring: publish the existing
GHCR image and Helm chart from this repository, then deploy those immutable artifacts from a
Sugarkube checkout. This page is the steady-state release source of truth; the older dev,
staging, and production runbooks remain useful for environment details and troubleshooting.

## Release contract

| Artifact        | Current DSPACE location                         | Notes                                                                  |
| --------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Image           | `ghcr.io/democratizedspace/dspace`              | Published by `.github/workflows/ci-image.yml` on `main` and `v3`.      |
| Chart           | `oci://ghcr.io/democratizedspace/charts/dspace` | Published by `.github/workflows/ci-helm.yml` from `charts/dspace`.     |
| Chart version   | `charts/dspace/Chart.yaml`                      | Keep in sync with `docs/apps/dspace.version` for Sugarkube automation. |
| Staging host    | `https://staging.democratized.space`            | Uses Sugarkube staging values and QA-friendly staging config.          |
| Production host | `https://democratized.space`                    | Uses Sugarkube production values and QA cheats off.                    |

## Image tags to preserve

The image workflow intentionally publishes all of these tags. Do not remove or rename them when
polishing release docs or workflow summaries.

- Immutable branch/SHA tag: `main-<shortsha>` or `v3-<shortsha>`.
- Mutable branch convenience tag: `main-latest` or `v3-latest`.
- Version convenience tag: `v<package.version>` such as `v3.0.1`.

For staging and production sign-off, prefer the immutable branch/SHA tag. Mutable tags are useful
for discovery and quick checks, but they should not be the tag recorded as an approved release
candidate.

## Current release workflow

1. Open the **Build and publish GHCR image** (`ci-image.yml`) workflow run for the desired commit
   and branch (`main` or `v3`).
2. Confirm the image workflow succeeded, including the image push and image verification steps.
3. Copy the immutable image tag printed in the workflow summary, for example
   `ghcr.io/democratizedspace/dspace:main-REPLACE_SHORTSHA`. If the run predates the summary,
   copy the branch/SHA tag from GHCR.
4. Confirm the chart version in `charts/dspace/Chart.yaml` and/or the **Publish Helm chart**
   (`ci-helm.yml`) workflow run. The current chart is deployed from
   `oci://ghcr.io/democratizedspace/charts/dspace`.
5. From a Sugarkube checkout, deploy staging with the DSPACE compatibility recipe:

   ```bash
   cd ~/sugarkube
   just dspace-oci-deploy env=staging tag=main-REPLACE_SHORTSHA
   ```

   Use the appropriate branch prefix for the artifact you copied, for example:

   ```bash
   just dspace-oci-deploy env=staging tag=v3-REPLACE_SHORTSHA
   ```

6. Promote production only after staging sign-off. Use the existing DSPACE production promotion
   recipe with either the current release/chart-aligned tag:

   ```bash
   just dspace-oci-promote-prod tag=3.0.1
   ```

   Or promote the exact immutable candidate that passed staging:

   ```bash
   just dspace-oci-promote-prod tag=main-REPLACE_SHORTSHA
   ```

7. After Sugarkube P5 lands, the generic app recipes should become the preferred spelling while
   the app-specific DSPACE commands remain compatibility shims:

   ```bash
   just app-deploy app=dspace env=staging tag=main-REPLACE_SHORTSHA
   just app-promote-prod app=dspace tag=main-REPLACE_SHORTSHA
   ```

## Validate staging

After a staging deploy, verify rollout status from Sugarkube or with the environment-specific
staging runbook, then check the public runtime endpoints:

```bash
curl -fsS https://staging.democratized.space/config.json | jq .
curl -fsS https://staging.democratized.space/healthz | jq .
curl -fsS https://staging.democratized.space/livez | jq .
```

Record the immutable image tag, commit SHA, chart version, validation timestamp, and QA checklist
result before promoting production.

## Validate production

After promotion, verify production with the same runtime endpoints:

```bash
curl -fsS https://democratized.space/config.json | jq .
curl -fsS https://democratized.space/healthz | jq .
curl -fsS https://democratized.space/livez | jq .
```

If production validation fails, capture logs and roll back to the prior known-good immutable tag.

## Rollback

Rollback is an explicit redeploy of the previous immutable tag. Do not roll back by guessing a
mutable tag such as `main-latest`.

```bash
cd ~/sugarkube
just dspace-oci-deploy env=staging tag=main-PREVIOUS_SHORTSHA
just dspace-oci-promote-prod tag=main-PREVIOUS_SHORTSHA
```

After Sugarkube P5, the generic spelling should be equivalent:

```bash
just app-deploy app=dspace env=staging tag=main-PREVIOUS_SHORTSHA
just app-promote-prod app=dspace tag=main-PREVIOUS_SHORTSHA
```

## Cloudflare, DNS, and tunnels are separate

Helm deploys the DSPACE Kubernetes release. Cloudflare DNS records, load-balancer settings, and
tunnel lifecycle are separate infrastructure concerns. Keep route or DNS changes in the relevant
Cloudflare/Sugarkube operations flow, then return to this runbook for image/chart deploys.

## Local Docker builds

Local Docker builds are for development, smoke testing, and debugging only. They are not the
normal Sugarkube staging or production release path. Staging and production should consume the
multi-arch GHCR image from `ci-image.yml` and the OCI Helm chart from `ci-helm.yml`.

For local-only testing, use the Docker and Kubernetes development docs, but do not treat a local
image tag as a release artifact unless it has gone through the GHCR publishing workflow above.

## Related docs

- [Helm chart docs](../charts.md)
- [Kubernetes manifests](../../infra/k8s/README.md)
- [Sugarkube staging runbook](../k3s-sugarkube-staging.md)
- [Sugarkube production runbook](../k3s-sugarkube-prod.md)
- [Operations runbook index](./README.md)
