<!-- cspell:ignore opencontainers -->

# Exact v3.0.2 hotfix smoke contract

This tooling contract is not chart verification or rollout approval. It supports only
source `47900748f61e1ef38c6289fc697f7a070f7fa3c9` and image index
`sha256:5d16cde03df4cfe9a52341c26bb6167234d315f896d422af38383b760bebcfe0`.
The published image is not rebuilt or relabeled.

The runner selects `hotfix-build-meta-oci-v1` together with
`hotfix-openai-config-v1`, expected application version `3.0.2`, the complete source
revision, expected provider `openai`, and `--expected-image-digest` equal to the index
above. Missing or changed coordinates fail before browser launch. Other release
contracts keep their existing behavior; there is no automatic fallback.

## Version and source evidence

`scripts/fixtures/hotfix-302-oci-proof.json` contains base64 encodings of the original
public registry index, the linux/amd64 and linux/arm64 manifests, and their configs.
On 2026-11-02 these bytes were fetched anonymously from GHCR and checked against the
index digest and each child descriptor. The runner repeats those SHA256 checks offline
and requires both platform configs to have the exact source/revision labels and
`org.opencontainers.image.version=v3.0.2+4790074`. Application version `3.0.2` is
extracted from those authenticated labels, not copied from caller expectations or a
runtime environment variable. This authenticates content against the approved digest;
it does not add a publisher signature or approve a release.

The remote build metadata must independently match the full source revision. The
health response must be ready and report `v3.0.2+4790074` as an additional configuration
agreement check. Health is **not** the artifact-version proof. An overridden health
version, including plain `3.0.2` or an image tag with a digest, fails that check.
Sugarkube must also enforce the existing deployment and every-pod image digest checks:
a remote HTTP response alone does not prove which container image a cluster runs.

## Provider evidence

This image's config endpoint has only offline-worker, telemetry, and feature-flag
fields; it does not advertise a default chat provider. The exact-hotfix config validator
checks that old schema rather than pretending it contains a modern provider field.
Provider proof still requires the isolated browser journey: one hydrated OpenAI panel,
the token.place-disabled notice, no token.place panel, and one intercepted OpenAI
submission carrying the test credential and displaying the expected reply. These checks
are unchanged from the existing legacy OpenAI journey. No provider traffic is sent.

Only a successful browser run emits `DSPACE_ARTIFACT_VERSION_PROOF` with the verified
application version, source, index digest, version label, and proof method. Sugarkube
requires this proof before returning runtime verification for this tuple. A failed run
never emits a successful artifact-version result.

## Validation scope and remaining gates

The real runner was exercised against the already-published image in a local isolated
container: artifact identity and the OpenAI submission journey passed. Reading the image's
`/app/package.json` also returned `3.0.2`. A second local container with only
`DSPACE_VERSION=3.0.2` overridden failed identity and emitted no successful proof.
Unit tests reject coordinate drift, damaged OCI bytes, wrong runtime metadata, health
configuration drift, and wrong provider config. Cross-repository tests in Sugarkube
execute this runner's actual argument and contract validators offline; they are not a
replacement for the real-image browser test.

Chart 3.0.3 remains historical publication evidence. Its registry token request returned
HTTP 401, so published chart bytes have not been freshly verified. Its recorded source
render sets DSPACE_VERSION to the image tag (and digest when pinned), which this contract
correctly rejects. No chart changes, deployed-service probes, cluster access, promotion,
merge, or deployment are authorized by this contract.
