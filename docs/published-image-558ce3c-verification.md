# Resume verification of the November v3.0.2 image

[Publication run 43164575478](https://github.com/democratizedspace/dspace/actions/runs/43164575478)
pushed the reviewed November image, then failed during post-publication registry
verification with `fetch failed`. Its original receipt artifact,
`maintenance-publication-receipt` (ID `13920537034`), is listed on the run above and
records `published: true`, `verified: false` and no completed platform proofs.
Preserve that receipt unchanged. **Do not rerun the publisher, rebuild the image,
or overwrite its tag to recover verification.**

GitHub reported this artifact unexpired on November 12, 2026, with retention
ending February 10, 2027. Direct artifact browser links may return 404; use the
run page to locate/download it while retained, and preserve an authorized copy
before expiry. The artifact ID is a provenance identifier, not a permanent link.

## Fixed artifact

The new verifier is independent of the [historical verifier](published-image-verification.md).
It accepts no inputs or coordinate overrides:

- Source: `558ce3c35163d97aea5594d6aba430c6a3dde1a3`.
- Tree: `e3896f76dbdfa6c2cc615a31a85075eb49afa02f`.
- Publication workflow commit: `a8013a7838edfffbc97787f45f9c3f3d3494f0c9`.
- Image: `ghcr.io/democratizedspace/dspace:hotfix-558ce3c35163d97aea5594d6aba430c6a3dde1a3`.
- Index: `sha256:4503e9aa941c842893bd02a05edfc7fb2f61afca916d06b0c160c5b798477ec5`.
- Linux amd64: `sha256:c12f8277397fda09b7b2534eb35b75318fa1bb96291de910ecad5c312b1aad2b`.
- Linux arm64: `sha256:b09338ac1b6e747b9f75f8901fc8dfed1c6bb4fafabb4e27a5d744e32b46ae83`.

## Owner-run recovery

After review and merge into `release/v3.0.x`, the owner `futuroptimist` may
manually dispatch `verify-published-image.yml` on that branch. This is
verification only: no build, image push, registry login, cluster access,
deployment, release tag, or change to the original receipt. The owner also
controls reruns. The script requires a GitHub-hosted runner; do not run the
verification entry point or Docker probes on a user's computer.

The workflow checks owner, event, branch and runner before setting up pinned
arm64 QEMU on the ephemeral runner. It checks out the exact application source,
validates its tree and versions, reads GHCR with anonymous pull scope, and hashes
the tag index, immutable index, platform manifests and image configurations.
It verifies both architecture labels and source/version labels.

It then pulls **each exact published platform digest** and checks Node 24.22.1,
build metadata, canvas import, source-bound frontend bundles and HTTP responses
for `/healthz`, `/config.json`, `/`, and `/docs/dCarbon`. Health must identify
`v3.0.2+558ce3c`. Containers have no external network; HTTP probes use their own
loopback. Earlier validation built local images, so it is not a substitute for
these checks of the published bytes.

The existing workflow filename is reused because it is already registered on
`main`; its execution uses the reviewed `release/v3.0.x` branch. The historical
`verify-published-image.mjs` script and fixed coordinates remain unchanged.
Its historical workflow can still be inspected in Git history; the active
maintenance-branch workflow now verifies only this November image.

## Evidence and next steps

The separate `published-image-558ce3c-verification-receipt.json` contains a link
to the original publication receipt, publication workflow SHA, current verifier
workflow SHA, run and attempt, index and per-platform results. It always records
`publishedByThisRun: false`. It sets `verified: true` only after both platform
smokes pass. Partial failure retains completed platform evidence with
`verified: false`. A guard failure may produce no receipt; absence is not success.
The artifact name includes run and attempt; the script refuses to overwrite an
existing local receipt.

Inspect a failed verification receipt before another verification-only attempt.
Keep all attempts. Never rerun publication as a verification retry. After a
successful receipt, bind its exact coordinates into the release verifier and
perform fresh staging acceptance. Production approval and deployment remain
separate owner actions. This workflow does not finalize staging or production
evidence, and does not replace live provider/browser checks.

## Offline checks

```sh
node --test scripts/test-verify-published-image-558ce3c.mjs
node --test scripts/test-verify-published-image.mjs
node scripts/check-workflows.mjs
```

These tests use mocked registry/Docker responses and synthetic bundle fixtures.
Passing them does not establish published-image runtime success.
