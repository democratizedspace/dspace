# DSPACE Sugarkube release runbook

DSPACE is the mature Sugarkube baseline. Its staging and production path already works, so this
runbook documents the known-good flow instead of replacing it. Use this page as the steady-state
release source of truth for Sugarkube operators; keep lower-level Kubernetes, chart, and Cloudflare
setup in their existing runbooks.

## Release contract

- **Application image:** `ghcr.io/democratizedspace/dspace`
- **Helm chart:** `oci://ghcr.io/democratizedspace/charts/dspace`
- **Chart version file for Sugarkube helpers:** `docs/apps/dspace.version`
- **Supported release branches:** `main` and `v3`
- **Immutable image tags:** `<branch>-<shortsha>`, for example `main-REPLACE_SHORTSHA` or
  `v3-REPLACE_SHORTSHA`
- **Mutable branch convenience tags:** `<branch>-latest`, for example `main-latest` or `v3-latest`
- **Version image tag:** `v<package.version>`, for example `v3.0.1`

Use immutable branch-SHA tags for staging, production approvals, and rollback records whenever
possible. Mutable branch tags are convenient for inspection but should not be the audit record for a
production deploy.

## Artifact publishing summary

1. `.github/workflows/ci-image.yml` builds and publishes the multi-arch DSPACE image for `main` and
   `v3` pushes, and can also be run manually for those branches.
2. `.github/workflows/ci-helm.yml` packages `charts/dspace` and publishes it to the GHCR OCI chart
   registry for `main` and `v3` pushes, and can also be run manually for those branches.
3. `charts/dspace/Chart.yaml` and `docs/apps/dspace.version` must stay in sync so Sugarkube helper
   recipes install the intended chart version.
4. Local Docker builds are for local development and smoke testing only. They are not the normal
   Sugarkube staging or production release path.

## Deploy staging

1. Open the `ci-image.yml` workflow run for the desired commit and branch (`main` or `v3`).
2. Confirm the image workflow succeeded.
3. Copy the immutable tag-only value from the workflow summary, such as
   `main-REPLACE_SHORTSHA` or `v3-REPLACE_SHORTSHA`. If GHCR or another UI shows a full image
   reference like `ghcr.io/democratizedspace/dspace:main-REPLACE_SHORTSHA`, copy only the portion
   after the colon into Sugarkube `tag=...` commands.
4. Confirm the Helm chart version in `charts/dspace/Chart.yaml`, `docs/apps/dspace.version`, and/or
   the `ci-helm.yml` publish workflow run.
5. From the Sugarkube checkout, deploy the immutable image tag to staging:

   ```bash
   cd ~/sugarkube
   just dspace-oci-deploy env=staging tag=main-REPLACE_SHORTSHA
   ```

   Use the matching branch prefix when deploying from another supported branch:

   ```bash
   just dspace-oci-deploy env=staging tag=v3-REPLACE_SHORTSHA
   ```

6. Validate staging:

   ```bash
   curl -fsS https://staging.democratized.space/config.json | jq .
   curl -fsS https://staging.democratized.space/healthz | jq .
   curl -fsS https://staging.democratized.space/livez | jq .
   ```

## Promote production

Promote only after staging has been validated and the image/chart pair is approved.

From the Sugarkube checkout, promote the approved version or immutable branch-SHA tag:

```bash
cd ~/sugarkube
just dspace-oci-promote-prod tag=v3.0.1
```

or:

```bash
cd ~/sugarkube
just dspace-oci-promote-prod tag=main-REPLACE_SHORTSHA
```

Validate production after promotion:

```bash
curl -fsS https://democratized.space/config.json | jq .
curl -fsS https://democratized.space/healthz | jq .
curl -fsS https://democratized.space/livez | jq .
```

Record the approved immutable tag, chart version, and workflow run links in the release notes or QA
checklist for the release.

## Rollback

Rollback by redeploying the prior known-good immutable image tag from Sugarkube. Do not rebuild a
local Docker image for staging or production rollback.

```bash
cd ~/sugarkube
just dspace-oci-deploy env=staging tag=main-PREVIOUS_SHORTSHA
just dspace-oci-promote-prod tag=main-PREVIOUS_SHORTSHA
```

If the rollback uses a `v3` artifact, keep the branch prefix aligned with the artifact that was
actually published:

```bash
just dspace-oci-deploy env=staging tag=v3-PREVIOUS_SHORTSHA
just dspace-oci-promote-prod tag=v3-PREVIOUS_SHORTSHA
```

Validate the target environment with the same `/config.json`, `/healthz`, and `/livez` curl checks
listed above.

## Cloudflare and DNS separation

Helm deployment and application promotion do not create or manage Cloudflare DNS, tunnels, or route
policy. Keep Cloudflare route and DNS setup in the Cloudflare/Sugarkube operations runbooks, then use
this release runbook once routing already points at the intended cluster ingress.

## Future generic Sugarkube commands

After Sugarkube P5 lands, the DSPACE-specific recipes should remain compatibility shims while the
app-generic commands become the shared mental model:

```bash
just app-deploy app=dspace env=staging tag=main-REPLACE_SHORTSHA
just app-promote-prod app=dspace tag=main-REPLACE_SHORTSHA
```

Until those generic recipes are available in Sugarkube, keep using the mature DSPACE-specific
commands documented above.
