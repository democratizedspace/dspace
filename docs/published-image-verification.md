# Verify the published v3.0.2 image

The owner may manually dispatch `verify-published-image.yml` on `release/v3.0.x`
after reviewing and merging this change, on a weekday at or after 07:00
America/Los_Angeles. This workflow has no inputs and accepts only owner
`futuroptimist` (including reruns). It requires a GitHub-hosted runner. Do not run
the verification entry point or Docker probes on a user's machine.

The source is fixed at `47900748f61e1ef38c6289fc697f7a070f7fa3c9`, tree
`35391f8fb62827713889915cba3c906090e45c7f`. The fixed index and platform digests
are recorded in `scripts/verify-published-image.mjs`. The verifier reads GHCR
anonymously with pull scope, hashes registry bytes, checks the tag and immutable
index, and checks platform configurations and labels. Unknown-platform
attestation entries remain valid; exactly amd64 and arm64 Linux images are required.

Each immutable platform image must pass Node 24.22.1, full build metadata SHA,
canvas import, OCI labels, the original source's `verify-build-sha.mjs` against
`/app/dist`, and bounded HTTP checks for `/healthz`, `/config.json`, `/`, and
`/docs/dCarbon`. Health must report `v3.0.2+4790074`. Containers have no external
network and HTTP probes run on their own loopback interface. QEMU is configured
only on the ephemeral runner after the dispatch guard.

The new `published-image-verification-receipt.json` records partial successes
and sets `verified: true` only after both architectures pass. Its artifact name
includes the run and attempt. `publishedByThisRun` is always false. A failure
before verification starts may produce no receipt; absence is not success.
The historical publication receipt from run 41252015763 remains unchanged:
it reported publication success and verification failure. This workflow does
not rebuild, publish, deploy, access a cluster, or create a release tag.

Local checks (no Docker or registry traffic):

```sh
node --test scripts/test-verify-published-image.mjs
node scripts/check-workflows.mjs
```

The tests use mocked Docker/registry responses and synthetic bundle fixtures.
They do not establish that the published image runs successfully. Only a
successful owner-dispatched run establishes that runtime evidence. Do not
rerun the publication pipeline or overwrite its image coordinate to obtain it.
