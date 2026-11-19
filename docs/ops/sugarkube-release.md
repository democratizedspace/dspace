# DSPACE Sugarkube release runbook

Use this page as the release source of truth for Sugarkube operators, together with the
[Sugarkube DSPACE runbook](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md).
Commands below describe separately authorized operations, not evidence that they ran. Current
source metadata is application `3.1.0` and provisional chart `3.1.3`; neither identifies a deployed
release. Candidate selection, artifact publication, staging sign-off and production approval remain
separate gates. Keep lower-level Kubernetes, chart and Cloudflare setup in their existing runbooks.

## Operator entry points and release gates

| Environment | Default operator host | Public application                   | Grafana                                                                                                               |
| ----------- | --------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Staging     | `sugarkube3`          | `https://staging.democratized.space` | [Staging observability](http://sugarkube3:30300/d/sugarkube-staging-observability/sugarkube-staging-observability)    |
| Production  | `sugarkube0`          | `https://democratized.space`         | [Production observability](http://sugarkube0:30300/d/sugarkube-prod-observability/sugarkube-production-observability) |

Run the Bash examples from a reviewed Sugarkube checkout on the selected operator host. Supply
explicit, distinct staging and production kubeconfigs; the hostname is a convenience, not proof
of cluster identity. Production promotion also needs read access to the staging cluster for its
fresh staging gate. Stop if that access is unavailable; do not skip the gate.

These dashboard links do not establish reachability, panel completeness or a successful soak.
Record evidence against the exact approved artifacts using the [v3.1 QA gates](../qa/v3.1.md),
[observability operations](https://github.com/futuroptimist/sugarkube/blob/main/docs/observability-operations.md),
[DSPACE release integrity](https://github.com/futuroptimist/sugarkube/blob/main/docs/observability-dspace-release-integrity.md)
and [encrypted completion observability](https://github.com/futuroptimist/sugarkube/blob/main/docs/encrypted-completion-observability.md).
Local or intercepted browser checks cannot close live provider, monitoring, soak or production gates.

## Chat provider promotion coordinate

Set the reviewed Helm value `chat.defaultProvider` to exactly `token-place` or `openai`. The chart renders this once as `DSPACE_DEFAULT_CHAT_PROVIDER`, and `/config.json` reports it as `chat.defaultProvider` for release-aware smoke agreement. This deployment default affects only missing or invalid saved browser state: it never overwrites a valid provider explicitly saved by a user. Selecting OpenAI does not bypass its local API-key gate, and no provider credential belongs in chart values.

## Runtime version configuration

The optional Helm value `runtimeVersion` sets `DSPACE_VERSION` independently of the image
coordinate. Leave it empty (the default) to preserve the existing fallback to `image.tag`, then
`Chart.yaml:appVersion`. For a digest-qualified image whose health version differs from its tag,
set the reviewed runtime version explicitly with `--set-string runtimeVersion=...`; do not add
a second `DSPACE_VERSION` entry through `env` (the chart rejects it). This is application
configuration, not measured source or artifact identity: image digest, revision, version proof,
and provider verification remain separate release gates. This option neither publishes a chart nor
authorizes deployment.

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
coordinate. After supplying a missing immutable prerequisite, use the semantic recovery procedure
below rather than rerunning a historical workflow definition. If a semantic tag already exists,
the workflow always refuses to overwrite or move it; investigate and cut a new approved release
coordinate rather than retrying a mutation.

### Recover a failed semantic publication

This recovery is only for an existing, published (non-draft) GitHub application release whose
semantic workflow failed before publishing its GHCR semantic alias. First prove that the semantic
tag is authoritatively absent with the fail-closed preflight:

```bash
GHCR_GUARD_USERNAME="$(gh api user --jq .login)" \
GHCR_GUARD_PASSWORD="$(gh auth token)" \
node scripts/ghcr-manifest.mjs check-absent \
  --owner democratizedspace \
  --repo dspace \
  --tag v3.1.1
```

Then dispatch the fixed workflow definition from `main` (do not rerun the historical failed
workflow run):

```bash
gh workflow run ci-image.yml \
  --repo democratizedspace/dspace \
  --ref main \
  -f release_tag=v3.1.1
```

The recovery validates the published release and immutable application tag, source-branch reachability,
immutable image and chart provenance, and both semantic-tag absence guards before creating the one
exact alias and deterministic release manifest. It does not move or recreate the application tag or
GitHub release. An identical dispatch after success is expected to fail at the semantic-tag guard
before mutation; this is intentional evidence for #4727 and #4730.

1. `.github/workflows/ci-image.yml` builds and publishes the multi-arch DSPACE image for `main` and
   `v3` pushes, and can also be run manually for those branches.
   `.github/workflows/build.yml` is validation-only on every trigger; it never publishes images
   or registry cache. A git tag push alone does not publish a semantic image alias.
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

Historically, chart `3.1.2` was prepared for DSPACE application `3.1.1`. Chart
`3.1.1` remains a chart-only, provenance-bearing release for DSPACE application `3.1.0`, and the
legacy `3.1.0` chart lacks the modern immutable source-revision provenance, so neither coordinate
may be overwritten or selected where newer release evidence is required. These historical
coordinates are not the November candidate; preparing a coordinate does not publish it.

### Operator handoff for the DSPACE 3.1.1 patch release

This section records the earlier 3.1.1 handoff and its validation requirements, not instructions
to recreate that release. The release owner reported deleting its GitHub release and tag on
October 6 while retaining the container image. See the current November handoff below.

That handoff defined `SHORT_SHA` as exactly the first seven lowercase hexadecimal characters of
the reviewed merge commit SHA and required evidence in the normal fail-closed order. Its
expected coordinates were:

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

### November v3.1.0 candidate handoff (publication blocked)

Prepared application metadata is now `3.1.0`; independent chart `3.1.3` remains provisional.
The retained older `v3.1.0` image occupies the semantic coordinate. The source normalization does
not turn that image into the candidate or authorize any registry mutation. Keep the existing
absence/provenance guards: semantic publication remains blocked pending a separate release-owner
decision. See [source and artifact reconciliation](../releases.md#application-versions-and-chart-versions).

For later authorized release work, record the reviewed full source SHA, its newly published
immutable `main-SHORT_SHA` (or supported `v3-SHORT_SHA`) image index and platform digests, and a
verified chart from that same source. Confirm chart `3.1.3` is available before publication; if
occupied, obtain approval for an unused chart coordinate rather than replacing it. Do not use the
default semantic image tag or the retained `main-8b3f6d5` build as evidence for the new candidate.
Staging deployment identity, browser QA, monitoring, soak and rollback evidence remain required
before separately authorized production promotion. The November changelog remains `status: draft`.

Successful full releases upload the deterministic artifact
`dspace-release-manifest/dspace-release-manifest.json`. Schema version 1 records
`applicationVersion`, the complete `sourceRevision`, immutable tag-only `imageTag`, image-index
`imageDigest`, independently versioned `chartVersion`, immutable `chartDigest`, and the semantic
evidence tag. It intentionally contains no environment, approver, runtime, promotion, or
credentials. The workflow summary includes the immutable image and chart references plus the image
index and both platform digests. The semantic `vX.Y.Z` alias is verified to resolve to the exact
same index digest, but the manifest and deployments continue to select the immutable branch-SHA
tag.

## Prepare the approved deployment inputs

The examples below require a genuine upstream release manifest and real operator approval.
For the November candidate, semantic publication is blocked as described above; do not fabricate
an upstream manifest, reuse an older manifest, or bypass guards to make these examples runnable.

From the reviewed Sugarkube checkout, resolve each environment with `just app-config app=dspace
env=staging` (and `env=prod`). Review the complete ordered values chain and chart pin. The
repository's historical pins are not a v3.1.0 candidate selection. After a separately authorized
chart publication succeeds, copy its exact version from the reviewed successful publication
evidence, replacing this placeholder rather than reusing a historical shell variable or an old pin:

```bash
CHART_VERSION='REPLACE_WITH_REVIEWED_PUBLISHED_CHART_VERSION'
just app-chart-bump app=dspace version="$CHART_VERSION" env=staging
```

This checks the published chart with Helm and updates the selected local version file. It neither
publishes nor deploys; review and commit that pin separately. Production pin changes need their
own approval after staging sign-off.

The November contract requires `chat.defaultProvider=token-place`, model `qwen3-8b-instruct`,
`https://staging.token.place` in staging and `https://token.place` in production. The Sugarkube
production example still contains the historical Llama model: reconcile the reviewed values in a
separate configuration change before promotion. Do not change the expected smoke result to match
that stale value. Preserve valid browser-saved provider choices; fresh-user default QA is separate.

Configure the container adapter as described under [release-aware smoke](#release-aware-chat-smoke)
before invoking a guarded recipe. Set operator-provided paths and approval metadata (never invent
an approver or timestamp):

```bash
UPSTREAM_MANIFEST=/reviewed/dspace-release-manifest/dspace-release-manifest.json
STAGING_KUBECONFIG=/operator/path/to/staging-kubeconfig
PROD_KUBECONFIG=/operator/path/to/prod-kubeconfig
DSPACE_SMOKE_RUNNER=/reviewed/dspace/scripts/run-container-chat-smoke.mjs
STAGING_APPROVED_AT='<UTC timestamp from staging approval>'
STAGING_APPROVED_BY='<staging operator or review record>'
CANDIDATE_IMAGE_TAG=$(jq -er '.imageTag' "$UPSTREAM_MANIFEST")
CANDIDATE_SOURCE_SHA=$(jq -er '.sourceRevision' "$UPSTREAM_MANIFEST")
mkdir -p deployment-candidates/dspace
python3 scripts/dspace_release_manifest.py candidate \
  --upstream "$UPSTREAM_MANIFEST" \
  --output deployment-candidates/dspace/staging.json \
  --environment staging --provider token-place \
  --approved-at "$STAGING_APPROVED_AT" --approved-by "$STAGING_APPROVED_BY"
python3 scripts/dspace_release_manifest.py validate \
  --manifest deployment-candidates/dspace/staging.json
```

Verify the approved full source SHA, branch-SHA image tag, image index/platform digests, chart
version and chart digest against successful workflow evidence. Application and chart versions are
independent; the OCI chart manifest digest also differs from the downloaded archive hash. Keep
existing artifact coordinates immutable. Pin the adapter and prebuilt smoke image to the same reviewed runner source; a path alone does
not prove runner identity. Keep that runner revision separate from the approved application SHA.
The adapter needs an existing compatible host Node runtime and Linux Docker daemon; do not
install host dependencies or browsers as part of a release verification attempt.

## Deploy staging

After staging deployment authorization, on `sugarkube3`:

```bash
just app-deploy app=dspace env=staging tag="$CANDIDATE_IMAGE_TAG" \
  manifest=deployment-candidates/dspace/staging.json \
  smoke_runner="$DSPACE_SMOKE_RUNNER" kubeconfig="$STAGING_KUBECONFIG"
STAGING_EVIDENCE=$(python3 scripts/dspace_release_manifest.py evidence-path \
  --manifest deployment-candidates/dspace/staging.json)
python3 scripts/dspace_release_manifest.py validate --final --manifest "$STAGING_EVIDENCE"
```

The guarded recipe validates provenance and the digest-qualified render before reserving evidence
and changing Helm. It installs the approved immutable chart digest and image tag/digest with the
complete values chain, never `--reuse-values`. It finalizes evidence only after runtime, frontend,
pod, provider and public-journey checks. Preserve the exact finalized record for review.

Check `/config.json` before opening `/chat`, then execute the remaining QA and observability gates:

```bash
curl -fsS https://staging.democratized.space/config.json | jq -e '
  .chat.defaultProvider == "token-place" and
  .tokenPlace.url == "https://staging.token.place" and
  .tokenPlace.model == "qwen3-8b-instruct"'
curl -fsS https://staging.democratized.space/healthz
curl -fsS https://staging.democratized.space/livez
```

For the default direct API v1 path, Browser Network must show `/api/v1/relay/servers/next`,
`/api/v1/relay/requests`, then `/api/v1/relay/responses/retrieve` at the staging origin.
Requests carry ciphertext and safe routing metadata, no plaintext prompts, `Authorization`,
token.place credentials or browser credentials. Follow the exact optional proxy gates and
secret-safety acceptance criteria in [v3.1 QA](../qa/v3.1.md); do not substitute plaintext
`/api/v1/chat/completions` calls or an intercepted smoke for live relay E2EE evidence.

## Promote production

Only after finalized staging evidence, live QA, observability and soak sign-off, obtain separate
production approval for the same immutable image/chart pair and source SHA. On `sugarkube0`, make
the reviewed upstream manifest and finalized staging record available at the selected paths;
verify explicit kubeconfigs for both clusters. Create a distinct production candidate:

```bash
PROD_APPROVED_AT='<UTC timestamp from production approval>'
PROD_APPROVED_BY='<production operator or review record>'
python3 scripts/dspace_release_manifest.py candidate \
  --upstream "$UPSTREAM_MANIFEST" \
  --output deployment-candidates/dspace/prod.json \
  --environment prod --provider token-place \
  --approved-at "$PROD_APPROVED_AT" --approved-by "$PROD_APPROVED_BY"
just app-promote-prod app=dspace tag="${CANDIDATE_IMAGE_TAG:?Set the approved immutable candidate image tag}" \
  manifest=deployment-candidates/dspace/prod.json staging_evidence="$STAGING_EVIDENCE" \
  smoke_runner="$DSPACE_SMOKE_RUNNER" kubeconfig="$PROD_KUBECONFIG" \
  staging_kubeconfig="$STAGING_KUBECONFIG" confirm="dspace:prod:${CANDIDATE_SOURCE_SHA}"
PROD_EVIDENCE=$(python3 scripts/dspace_release_manifest.py evidence-path \
  --manifest deployment-candidates/dspace/prod.json)
python3 scripts/dspace_release_manifest.py validate --final --manifest "$PROD_EVIDENCE"
```

Validate production routing and repeat the production QA gates, including the same encrypted
relay sequence at `https://token.place`, before recording production sign-off:

```bash
curl -fsS https://democratized.space/config.json | jq -e '
  .chat.defaultProvider == "token-place" and
  .tokenPlace.url == "https://token.place" and
  .tokenPlace.model == "qwen3-8b-instruct"'
curl -fsS https://democratized.space/healthz
curl -fsS https://democratized.space/livez
```

### Release-aware `/chat` smoke

Use the [containerized remote chat smoke runbook](https://github.com/democratizedspace/dspace/blob/main/docs/qa/container-chat-smoke.md)
merged in [#4882](https://github.com/democratizedspace/dspace/pull/4882) and aligned with
Node **24.22.3** in [#4889](https://github.com/democratizedspace/dspace/pull/4889).
It requires an existing host Node 24.22.3 or newer Node 24 patch and a Linux Docker daemon;
use native Linux amd64 or arm64, not ARM32 or implicit emulation. If prerequisites are absent,
stop and arrange a separately approved runner environment. Do not install npm packages or
Chromium on the operator host. Image-build dependencies and browser binaries stay in the image.

Prepare the image from a clean checkout of a reviewed runner commit containing both changes,
following that runbook. Keep the adapter checkout and image revision label identical. The adapter
resolves an already built local image to its immutable image ID and never pulls automatically.
Record that ID and full runner SHA independently of the target application SHA/digests. The
Playwright 1.54.2 base remains digest-pinned; Node 24.22.3 is enforced in the image build/self-check.
This proves neither the deployed application's Node runtime nor a successful live provider call.

In the environment that invokes Sugarkube, configure:

```bash
export DSPACE_SMOKE_IMAGE='dspace-chat-smoke:<reviewed-full-runner-SHA>'
export DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT=chat-default-provider-v1
export DSPACE_SMOKE_TIMEOUT_MS=240000
export DSPACE_SMOKE_RUNNER=/reviewed/dspace/scripts/run-container-chat-smoke.mjs
RUNNER_REVISION='<reviewed-full-runner-SHA>'
```

The explicit provider-config environment setting is required because Sugarkube's modern verifier
argv omits that flag; do not infer it from a live response. The 240-second adapter budget plus
10-second final cleanup allowance fits the verifier's 300-second outer timeout. Preserve these
bounds and fail-closed cleanup/completion checks. For a different historical contract, select its
explicit flag rather than inheriting the modern setting.

Run the documented offline image self-check on the intended native runner before separately
authorized target verification. CI test discovery, an in-memory Chromium page and the missing-browser
negative control are tooling evidence only; they do not execute staging journeys or close release QA.

For the current candidate, derive target expectations from the approved immutable artifact,
never from the runtime under test. Use application `3.1.0`, `build-info-v1`,
`chat-default-provider-v1`, `token-place` and Qwen with the appropriate environment origin.
These standalone intercepted checks supplement, not replace, guarded finalization and live QA:

```bash
# Staging
DSPACE_SMOKE_BASE_URL=https://staging.democratized.space \
DSPACE_EXPECTED_VERSION=3.1.0 \
DSPACE_EXPECTED_REVISION="${CANDIDATE_SOURCE_SHA:?Set the approved full source SHA}" \
DSPACE_EXPECTED_IDENTITY_CONTRACT=build-info-v1 \
DSPACE_EXPECTED_PROVIDER=token-place \
DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT=chat-default-provider-v1 \
DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN=https://staging.token.place \
DSPACE_EXPECTED_TOKEN_PLACE_MODEL=qwen3-8b-instruct \
node "$DSPACE_SMOKE_RUNNER"

# Production (run only after the staging result and promotion are approved)
DSPACE_SMOKE_BASE_URL=https://democratized.space \
DSPACE_EXPECTED_VERSION=3.1.0 \
DSPACE_EXPECTED_REVISION="${CANDIDATE_SOURCE_SHA:?Set the approved full source SHA}" \
DSPACE_EXPECTED_IDENTITY_CONTRACT=build-info-v1 \
DSPACE_EXPECTED_PROVIDER=token-place \
DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT=chat-default-provider-v1 \
DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN=https://token.place \
DSPACE_EXPECTED_TOKEN_PLACE_MODEL=qwen3-8b-instruct \
node "$DSPACE_SMOKE_RUNNER"
```

For a standalone machine-readable completion record, pass the reviewed **runner** revision,
not `CANDIDATE_SOURCE_SHA`, and a fresh result path in an existing writable directory. Do not
share a result path between concurrent runs. Scheduled probe integration must follow its own
[release-integrity contract](https://github.com/futuroptimist/sugarkube/blob/main/docs/observability-dspace-release-integrity.md);
this standalone example does not configure or validate that integration.

```bash
node "$DSPACE_SMOKE_RUNNER" \
  --base-url https://staging.democratized.space \
  --expected-version 3.1.0 \
  --expected-revision "${CANDIDATE_SOURCE_SHA:?Set the approved full source SHA}" \
  --identity-contract build-info-v1 \
  --expected-provider token-place \
  --provider-config-contract chat-default-provider-v1 \
  --expected-token-place-origin https://staging.token.place \
  --expected-token-place-model qwen3-8b-instruct \
  --runner-revision "${RUNNER_REVISION:?Set the reviewed full runner SHA}" \
  --result-file /run/dspace-chat/fresh-result.json
```

The adapter clears an existing result path before runtime preflight and only publishes fresh,
matching completion proof. Exit zero without that proof is failure. A completed failing journey
may produce `passed: false`; errors, cancellation or missing proof must never be treated as a pass.
The container mounts no host checkout, home, credentials, kubeconfig or Docker socket. Its
intercepted provider transport sends no live inference request. Preserve the target identity,
runner image ID/revision, result and exit status together, without credentials or payloads.
Sugarkube's bounded `runtimeVerification` in a finalized record is distinct from this standalone
JSON; neither substitutes for live relay E2EE, metrics, monitoring, soak or production sign-off.

### Historical compatibility checks

These explicit checks apply only to the named retained artifacts, not to the November candidate
or its promotion sign-off. The original host-runner invocations below are historical references
for already provisioned checkouts, not instructions to install dependencies. When using the
container adapter, preserve the exact target contracts and independent reviewed runner provenance.

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
DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT=legacy-no-default-provider-v1 \
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
DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT=legacy-no-default-provider-v1 \
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

Use Sugarkube's `dspace-manifest-rollback` with a genuine, previously finalized record for the
selected environment, a fresh evidence destination, an explicit kubeconfig and the reviewed smoke
runner. A candidate or staging record is not a production rollback target. Confirm that the target
satisfies the current verifier contract before approving recovery.

```bash
# Example: separately approved production rollback on sugarkube0
ROLLBACK_MANIFEST=/reviewed/previous-finalized-production-release.json
ROLLBACK_EVIDENCE=/private/evidence/new-production-rollback.json
TARGET_SHA=$(jq -er '.sourceRevision' "$ROLLBACK_MANIFEST")
just dspace-manifest-rollback env=prod manifest="$ROLLBACK_MANIFEST" \
  evidence="$ROLLBACK_EVIDENCE" kubeconfig="$PROD_KUBECONFIG" \
  smoke_runner="$DSPACE_SMOKE_RUNNER" confirm="dspace:prod:${TARGET_SHA}"
```

For staging, select `env=staging`, its finalized record and staging kubeconfig. The target record
supplies immutable chart and image coordinates; do not rebuild, retag, substitute a semantic tag,
or use `helm rollback <revision>`. Rollback uses the environment's current reviewed values chain,
not historical configuration replay. Review those values before approval.

See the [Sugarkube rollback contract](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md#rollback)
for preflight, evidence reservations and failure recovery. A failure after reservation may leave
changed cluster state and failed evidence; preserve both and reconcile before another mutation.
Never delete a reservation just because it is old or automatically retry a failed rollback.

## Cloudflare and DNS separation

Helm deployment and application promotion do not create or manage Cloudflare DNS, tunnels, or route
policy. Keep Cloudflare route and DNS setup in the Cloudflare/Sugarkube operations runbooks, then use
this release runbook once routing already points at the intended cluster ingress.

## Generic commands and compatibility

The generic `app-deploy` and `app-promote-prod` recipes are implemented in Sugarkube and are the
preferred operator path. `dspace-oci-deploy` and `dspace-oci-promote-prod` are compatibility shims
with the same manifest, evidence, runner, kubeconfig and production-confirmation requirements.
Tag-only examples are insufficient for the current guarded DSPACE release flow.
