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
- **Application version:** the matching versions in the root/frontend package metadata and
  `Chart.yaml:appVersion`
- **Chart version:** the matching `Chart.yaml:version` and `docs/apps/dspace.version`; this may
  advance independently of the application version
- **Semantic image tag:** `v<application version>`, for example `v3.1.0`; published only for a
  release and human-readable, but not proof of the deployed image
- **Chart release tag:** exactly `chart-v<chart version>`, pointing to the reviewed immutable commit

Use immutable branch-SHA tags or image digests for staging, production approvals, and rollback
records. Mutable branch tags and release-only semantic tags are convenient for humans but must not
be the audit record for a production deploy.

## Artifact publishing summary

The mandatory full-release order is fail-closed:

1. Publish and verify the multi-platform immutable `<branch>-<shortsha>` image. Both required
   platform configs (`linux/amd64` and `linux/arm64`) must identify the approved full source SHA.
2. Push `chart-v<chart version>` from that same commit. The chart workflow preserves its two
   authoritative-absence checks and one push, then verifies the published OCI chart version,
   `appVersion`, source revision, and digest.
3. Publish the `v<application version>` GitHub release. Its workflow requires both immutable
   artifacts, creates the semantic image tag as one exact alias of the immutable image index,
   verifies digest equality, and emits the combined release manifest.

Publishing the GitHub release before either prerequisite exists fails without creating the semantic
coordinate. After supplying the missing immutable artifact, rerun the failed release workflow. If a
semantic tag already exists, the workflow always refuses to overwrite or move it; investigate and
cut a new approved release coordinate rather than retrying a mutation.

1. `.github/workflows/ci-image.yml` builds and publishes the multi-arch DSPACE image for `main` and
   `v3` pushes, and can also be run manually for those branches.
2. `.github/workflows/ci-helm.yml` publishes only when an exact `chart-v<chart version>` tag is
   pushed. Ordinary `main`/`v3` pushes and manual branch dispatches never publish charts. Before
   creating the tag, verify it will point to the reviewed immutable commit and that its
   `Chart.yaml:version` matches the tag exactly.
3. `charts/dspace/Chart.yaml` and `docs/apps/dspace.version` must stay in sync so Sugarkube helper
   recipes install the intended chart version. Separately, package metadata and
   `Chart.yaml:appVersion` stay aligned on the application version; neither group must equal the
   other.
4. Local Docker builds are for local development and smoke testing only. They are not the normal
   Sugarkube staging or production release path.

Chart publication is immutable and fail-closed: the workflow checks the GHCR coordinate before
packaging and again immediately before its single push, and refuses any outcome except an
authoritative absence. Existing coordinates cannot be replaced. Chart `3.0.1` is permanently
tombstoned even if it later appears absent; this does not prohibit a newer chart whose `appVersion`
is `3.0.1`. A successful run summary is the audit record for the release tag, full source SHA,
package SHA-256, and OCI manifest digest.

Successful full releases upload the deterministic artifact
`dspace-release-manifest/dspace-release-manifest.json`. Schema version 1 records
`applicationVersion`, the complete `sourceRevision`, immutable tag-only `imageTag`, image-index
`imageDigest`, independently versioned `chartVersion`, immutable `chartDigest`, and the semantic
evidence tag. It intentionally contains no environment, approver, runtime, promotion, or
credentials. The workflow summary includes the immutable image and chart references plus the image
index and both platform digests. The semantic `vX.Y.Z` alias is verified to resolve to the exact
same index digest, but the manifest and deployments continue to select the immutable branch-SHA
tag.

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
just dspace-oci-promote-prod tag=3.1.0
```

The bare `3.1.0` value is the existing Sugarkube compatibility/version promote form. The image
workflow publishes the release-only semantic application tag as `v3.1.0`; it is human-readable but
not immutable deployment proof. Branch-SHA tags such as `main-REPLACE_SHORTSHA` or
`v3-REPLACE_SHORTSHA` (or a digest) are the required audit path for exact image promotion and
rollback.

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

### Verify one approved build identity

Use the immutable, full source revision from the reviewed release record. The runtime identity,
shared-layout SSR marker, immutable image tag, and OCI revision must all agree before promotion:

```bash
EXPECTED_SHA='<40-character-approved-git-sha>'
BASE_URL='https://staging.democratized.space'
IMAGE="ghcr.io/democratizedspace/dspace:main-${EXPECTED_SHA:0:7}"

test "$(curl -fsS "$BASE_URL/build-info.json" | jq -r .revision)" = "$EXPECTED_SHA"
test "$(curl -fsS "$BASE_URL/" | sed -n 's/.*name="dspace-build-revision" content="\([0-9a-f]\{40\}\)".*/\1/p' | head -n1)" = "$EXPECTED_SHA"
test "${IMAGE##*-}" = "${EXPECTED_SHA:0:7}"
test "$(docker buildx imagetools inspect "$IMAGE" --format '{{json .Image}}' | jq -r '.config.Labels["org.opencontainers.image.revision"]')" = "$EXPECTED_SHA"
```

`GET /build-info.json` is uncached and returns the semantic application version, full and short
revision, artifact-fixed build timestamp, and (for image builds) the immutable branch-SHA image
coordinate. A `503` means identity cannot be proved; it does not redefine `/healthz` readiness or
`/livez` liveness. Do not substitute a semantic or `*-latest` tag for the immutable image above.

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
