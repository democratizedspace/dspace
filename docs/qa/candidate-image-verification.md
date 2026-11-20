# Immutable candidate image verification

This replaces the historical, release-branch-only verifier for source `4790074`.
It verifies an existing public DSPACE image without publishing, retagging, changing
charts, contacting staging, or deploying. It does not replace release approval or
live staging QA.

## Owner-operated candidate verification

After this workflow is reviewed and merged, the owner can manually run
**Verify immutable candidate image** on `main` with:

- `source_sha`: the reviewed full lowercase 40-character source SHA already
  contained in that trusted `main` commit.
- `image_digest`: the exact `sha256:` index digest of the existing
  `ghcr.io/democratizedspace/dspace` image. Tags and alternative repositories are
  rejected. Do not substitute a different source or digest to make a failure pass.

No candidate is dispatched automatically by a PR or merge. This change itself
provides no evidence that any live candidate has passed verification.

The workflow runs independently on native `ubuntu-24.04` amd64 and
`ubuntu-24.04-arm` arm64 runners. There is no QEMU/emulation fallback. It derives
expected application and Node versions from the reviewed source as Git data;
source code is not checked out and executed on the host. Registry reads use only
anonymous pull access. An authentication failure stops verification rather than
requesting or configuring credentials.

## Checks and isolation

Each architecture verifies the exact index, platform manifest and image config,
then checks runtime Node/version/source identity, server and client bundle stamps,
native canvas, and bounded loopback HTTP health inside an isolated container.
Candidate processes receive no host secrets, home, repository, Docker socket or
host mounts. Networking is disabled; no ports are published. The runner uses a
non-root container user, dropped capabilities, no-new-privileges, a read-only root
filesystem, bounded temporary storage/resources and timeouts. Failed commands do
not print raw candidate output, registry bodies, tokens or redirect URLs.

This is not a cryptographic proof that arbitrary malicious code was built from a
source tree. OCI labels, bundle identity and runtime checks provide consistency
evidence for an owner-reviewed candidate. Container isolation is defense in depth,
not permission to dispatch unreviewed images. Dependency vulnerabilities or
application behavior outside the listed checks are not assessed by this verifier.

## Evidence and failures

Verification attempts upload sanitized `candidate-image-amd64.json` and
`candidate-image-arm64.json` receipts, then an aggregate
`candidate-image-summary.json`. Artifacts are retained for 30 days; preserve them
with the release evidence before expiry. Receipts bind source SHA, index and
platform digests, verifier workflow SHA, run ID/attempt and check results. A
missing, failed, mismatched, stale or duplicate receipt cannot produce successful
aggregate verification. Missing artifacts are failures, not warnings. Setup or guard failures can prevent
a per-platform receipt from being produced; they cannot yield aggregate success.

PR CI runs dependency-free offline positive and negative fixtures on both native
runner architectures. Fixture success validates verifier logic, not registry
availability, actual candidate runtime/canvas behavior or a deployed target.
An actual candidate run is a separate owner-authorized action.
