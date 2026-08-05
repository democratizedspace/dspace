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
- **Semantic image tag:** `v<application version>`, for example `v3.1.1`; published only for a
  release and human-readable, but not proof of the deployed image
- **Chart release tag:** exactly `chart-v<chart version>`, pointing to the reviewed immutable commit

Use immutable branch-SHA tags or image digests for staging, production approvals, and rollback
records. Mutable branch tags and release-only semantic tags are convenient for humans but must not
be the audit record for a production deploy.

If an ordinary branch-image workflow publishes its immutable SHA coordinate but fails in a later
validation or evidence step, treat that coordinate as failed-run evidence only. Do not rerun the
failed workflow, overwrite the SHA tag, move it, delete it, or select it for release promotion.
Instead, fix the workflow or source problem through a new reviewed commit; only that new commit's
`<branch>-<shortsha>` image may become the release candidate after its complete image workflow
succeeds.

## Runtime source verification contract

Before approving an already deployed runtime, set its expected full revision, public URL, and
published immutable image coordinate. The revision must be exactly 40 hexadecimal characters, and
the image tag must end in the matching seven-character short revision.

```bash
export EXPECTED_SHA=REPLACE_WITH_40_HEX_REVISION
export BASE_URL=https://staging.democratized.space
export EXPECTED_IMAGE=ghcr.io/democratizedspace/dspace:main-${EXPECTED_SHA:0:7}

[[ "$EXPECTED_SHA" =~ ^[0-9a-fA-F]{40}$ ]] || { echo "invalid EXPECTED_SHA" >&2; exit 1; }
BUILD_INFO="$(curl -fsS "$BASE_URL/build-info.json")"
test "$(jq -r '.revision' <<<"$BUILD_INFO")" = "${EXPECTED_SHA,,}"
test "$(jq -r '.image' <<<"$BUILD_INFO")" = "$EXPECTED_IMAGE"

HTML_REVISION="$(curl -fsS "$BASE_URL/" |
  sed -n 's/.*<meta name="dspace-build-revision" content="\([0-9a-fA-F]\{40\}\)".*/\1/p' |
  head -n 1)"
test "${HTML_REVISION,,}" = "${EXPECTED_SHA,,}"

docker pull "$EXPECTED_IMAGE"
OCI_REVISION="$(docker image inspect "$EXPECTED_IMAGE" \
  --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')"
test "${OCI_REVISION,,}" = "${EXPECTED_SHA,,}"
```

These checks compare the approved full SHA with `/build-info.json`, its published immutable image
coordinate, the `dspace-build-revision` HTML marker, and the pulled image's
`org.opencontainers.image.revision` label. They are a source-verification contract only; they do
not implement a remote `/chat` smoke test or a promotion gate.

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
coordinate. Do not use a manual workflow dispatch to recover semantic publication: the published
GitHub release event is the single canonical event permitted to create a semantic alias. Investigate
the failed run and cut a new approved release coordinate after supplying any missing immutable
prerequisite. If a semantic tag already exists, the workflow always refuses to overwrite or move it.

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

Chart `3.1.2` is the next immutable chart coordinate for DSPACE application `3.1.1`. Chart
`3.1.1` remains a chart-only, provenance-bearing release for DSPACE application `3.1.0`, and the
legacy `3.1.0` chart lacks the modern immutable source-revision provenance, so neither coordinate
may be overwritten or selected where newer release evidence is required. After the application
`3.1.1` preparation PR merges, a human operator will create `chart-v3.1.2` at the exact reviewed
merge commit; preparing the coordinate does not create the tag or publish the chart.

### Operator handoff for the DSPACE 3.1.1 patch release

After this preparation merges to `main`, define `SHORT_SHA` as exactly the first seven lowercase
hexadecimal characters of the reviewed merge commit SHA, then collect evidence in the normal
fail-closed order. The expected coordinates are:

- Branch image tag: `main-SHORT_SHA` for the reviewed merge commit, published as
  `ghcr.io/democratizedspace/dspace:main-SHORT_SHA`.
- Chart tag: `chart-v3.1.2`, pointing at the same reviewed merge commit.
- Application release tag: `v3.1.1`, published only by the GitHub release event after the image and
  chart prerequisites exist.

Required post-merge evidence for Refs #4727 and Refs #4730:

1. The first semantic publication for `v3.1.1` succeeds exactly once and aliases the immutable
   `main-SHORT_SHA` image index digest without rebuilding.
2. Rerunning the semantic job for the same release fails at the GHCR existence guard before any
   publication or tag mutation.
3. The semantic `v3.1.1` digest remains unchanged after the rejected rerun.
4. `dspace-release-manifest.json` agrees with the full source SHA, immutable image tag and digest,
   both platform digests, chart `3.1.2` digest/provenance, and semantic tag evidence.

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
just dspace-oci-promote-prod tag=3.1.1
```

The bare `3.1.1` value is the existing Sugarkube compatibility/version promote form. The image
workflow publishes the release-only semantic application tag as `v3.1.1`; it is human-readable but
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

### Release-aware `/chat` smoke

From a DSPACE checkout with dependencies and the Playwright Chromium browser installed, verify the
remotely served frontend against release expectations taken from the approved artifact (never from
the runtime under test). Replace the revision with the approved full 40-character source SHA:

```bash
# Staging
DSPACE_SMOKE_BASE_URL=https://staging.democratized.space \
DSPACE_EXPECTED_VERSION=3.1.1 \
DSPACE_EXPECTED_REVISION=REPLACE_WITH_APPROVED_40_CHARACTER_SHA \
DSPACE_EXPECTED_PROVIDER=token-place \
DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN=https://staging.token.place \
DSPACE_EXPECTED_TOKEN_PLACE_MODEL=qwen3-8b-instruct \
npm run qa:remote-chat-smoke

# Production (run only after the staging result and promotion are approved)
DSPACE_SMOKE_BASE_URL=https://democratized.space \
DSPACE_EXPECTED_VERSION=3.1.1 \
DSPACE_EXPECTED_REVISION=REPLACE_WITH_APPROVED_40_CHARACTER_SHA \
DSPACE_EXPECTED_PROVIDER=token-place \
DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN=https://token.place \
DSPACE_EXPECTED_TOKEN_PLACE_MODEL=qwen3-8b-instruct \
npm run qa:remote-chat-smoke
```

When omitted, `DSPACE_EXPECTED_IDENTITY_CONTRACT` defaults to the modern `build-info-v1`
contract. That contract requires same-origin `/build-info.json` identity (including the exact
version, full revision, and derived short revision) and the exact HTML build-revision marker.

Some immutable artifacts predate those surfaces but are still supported by exact compatibility
profiles. `legacy-build-meta-v1` verifies the same-origin `/build-meta.json` response. Build
identity and chat UI are independent contracts: the 3.0.1/OpenAI compatibility profile uses the
legacy inline OpenAI chat UI, while the 3.1.0/token.place compatibility profile uses the modern
settings-based token.place chat UI. These profiles are exact allowlist entries, not a general
legacy fallback; the harness never selects legacy identity automatically after a missing or
malformed modern identity response.

The immutable 3.0.1 recovery artifact may be checked only with this explicit legacy invocation:

```bash
DSPACE_SMOKE_BASE_URL=https://democratized.space \
DSPACE_EXPECTED_VERSION=3.0.1 \
DSPACE_EXPECTED_REVISION=1a31a569aff2dbeb238e8c2688b9e85140d2077d \
DSPACE_EXPECTED_IDENTITY_CONTRACT=legacy-build-meta-v1 \
DSPACE_EXPECTED_PROVIDER=openai \
npm run qa:remote-chat-smoke
```

The immutable 3.1.0 staging artifact at Helm revision 27 may be checked only with this explicit
legacy-identity token.place invocation:

```bash
DSPACE_SMOKE_BASE_URL=https://staging.democratized.space \
DSPACE_EXPECTED_VERSION=3.1.0 \
DSPACE_EXPECTED_REVISION=018687f5a7f4de45508c6e36eb28afb3e44da24d \
DSPACE_EXPECTED_IDENTITY_CONTRACT=legacy-build-meta-v1 \
DSPACE_EXPECTED_PROVIDER=token-place \
DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN=https://staging.token.place \
DSPACE_EXPECTED_TOKEN_PLACE_MODEL=llama-3.1-8b-instruct \
npm run qa:remote-chat-smoke
```

The command is non-destructive: it uses a new isolated browser context, clears browser-held state,
blocks service workers and unexpected provider traffic, and fulfills token.place transport inside
Playwright. It sends no live chat request or user secret and does not mutate server or shared
production state. It returns nonzero on build identity, hydration, provider routing/origin/model,
submission, classified availability, or secret-safety drift. Modern OpenAI verification proves
that OpenAI is discoverable through settings and missing-key gated. The exact legacy 3.0.1 contract
instead proves that OpenAI is the default, configures only a hard-coded fake sentinel through the
inline `/chat` key form, and requires one mocked successful OpenAI response; it does not imply that
the immutable application has modern settings or missing-key behavior. Both modes deny unmatched
or live provider traffic and require no real credential. This is the DSPACE-side harness only, not
Sugarkube's promotion gate.

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
