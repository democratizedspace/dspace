# November v3.0.2 browser companion compatibility

The remote Chat smoke companion accepts two exact immutable v3.0.2 images.
The historical source, digest and proof fixture are unchanged. The November entry
uses source `558ce3c35163d97aea5594d6aba430c6a3dde1a3`, index
`sha256:4503e9aa941c842893bd02a05edfc7fb2f61afca916d06b0c160c5b798477ec5`,
and image version label `v3.0.2+558ce3c`.

## Provenance

- [Publication run 43164575478](https://github.com/democratizedspace/dspace/actions/runs/43164575478)
  pushed the image; its original receipt remains unchanged.
- [Verification-only run 43177167022](https://github.com/democratizedspace/dspace/actions/runs/43177167022)
  verified the published bytes and both architecture smokes.
- `scripts/fixtures/hotfix-302-november-oci-proof.json` preserves original
  base64-encoded OCI index, platform manifests and configuration bytes read from
  GHCR. Each byte sequence was SHA-256 checked during collection. The companion
  repeats that chain validation offline; it does not trust decoded labels alone.
- The expected platform manifests are
  `sha256:c12f8277397fda09b7b2534eb35b75318fa1bb96291de910ecad5c312b1aad2b`
  (amd64) and
  `sha256:b09338ac1b6e747b9f75f8901fc8dfed1c6bb4fafabb4e27a5d744e32b46ae83`
  (arm64).

Selection requires the complete version/source/index/provider/contract tuple.
Old and new proofs cannot substitute for one another. Runtime metadata and health
must separately match the selected authenticated proof. OpenAI provider and
browser journey requirements are unchanged.

## Coordination and limits

Sugarkube must add the matching image/chart/provider tuple and pin this reviewed
companion commit in its real-runner integration workflow. Those integration tests
must pass for both old tuples and the November candidate before staging handoff.
Use a fresh staging candidate/evidence packet and preserve earlier finalized
evidence. This change does not rebuild or republish the application, change a
chart, perform a live provider request, deploy, or approve production.

Focused checks:

```sh
npx vitest run scripts/tests/hotfix-302-contract.test.ts scripts/tests/run-remote-chat-smoke.test.ts scripts/tests/remote-chat-smoke-contract.test.ts
```

These are offline contract tests, not a substitute for new staging acceptance.
