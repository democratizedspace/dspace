# DSPACE v3.1.0 staging coordinate receipt

This operator-run **offline** preparation correlates reviewed Git source and
independently approved OCI digests. It does not publish, deploy, create tags,
check alias availability, or grant any deployment authority. It leaves the
occupied `v3.1.0` OCI alias untouched and does not emit a semantic release
manifest. App version remains `3.1.0` regardless of chart version.

## Inputs and output

1. In a trusted up-to-date DSPACE checkout of reviewed `main`, select a
   reviewed full source commit reachable from that checkout. Capture the
   immutable branch image index digest from the matching successful DSPACE
   publish-build evidence or the authenticated canonical GHCR package. Capture
   the **OCI manifest digest** (not the packaged archive digest) from Helm
   publication evidence or the authenticated canonical chart package. The
   chart must come from the **same source commit** and its version must match
   that commit's `Chart.yaml` and `docs/apps/dspace.version`.
2. Have the owner approve the **exact full source commit, app/chart versions,
   and both OCI digests for staging** independently of the downloaded metadata.
   Record the approval with a non-secret identifier in a private JSON file.
   Use exactly these fields: `schema` = `dspace-staging-coordinate-approval-v1`,
   `environment` = `staging`, `approvalRef`, `sourceRevision`,
   `applicationVersion`, `imageDigest`, `chartVersion` and `chartDigest`.
   The CLI checks the stated fields; it cannot authenticate the approval
   reference or its author. Do not use a self-issued approval.
3. From the canonical repositories `ghcr.io/democratizedspace/dspace` and
   `ghcr.io/democratizedspace/charts/dspace`, acquire only the raw OCI metadata
   through existing authenticated pull access. Keep the image index, the exact
   Linux AMD64 and ARM64 child manifests and their image configs, and the Helm
   chart manifest and its chart config. Store each **unmodified byte sequence**
   in a private directory as a regular file named by its 64-character SHA-256
   hex digest, without the `sha256:` prefix or an extension. Do not pretty-print
   JSON; byte identity matters. Do not save credentials, auth headers, signed
   URLs or raw private workflow logs in this directory or the receipt.
4. With no registry credentials needed by the script, run from the trusted
   checkout:

   ```sh
   node scripts/prepare-staging-coordinates.mjs APPROVAL_JSON OCI_METADATA_DIRECTORY
   ```

   Preserve successful stdout as `dspace-staging-coordinates.json` with the
   approval and acquisition records. Review the tool's exit status before
   accepting the receipt; invalid inputs do not produce a receipt. Never
   rename it to `dspace-release-manifest.json`.

The tool binds raw metadata bytes to the approved digests and validates the
expected image configuration and Helm config metadata. Helm’s OCI manifest
version annotation is the chart version; the DSPACE config version annotation
is the application version. It does **not** verify
the image filesystem layers, chart archive bytes/rendering, native container
execution, registry membership, producer signatures, or approval provenance.
The chart content digest in the receipt records the manifest descriptor only.
The owner-run native verifier's actual successful run, immutable read-back, and
environment-specific runtime checks are separate evidence.

Do not reuse an occupied chart version for a different source. Do not infer
that an unauthenticated or unauthorized lookup proves absence. If no
same-source chart is verified, stop. Any chart version bump, publication, or
tag creation is separate from this receipt and requires the normal approval
and release process. No new chart version is reserved by this preparation.

## Sugarkube handoff contract (not implemented here)

Current Sugarkube `scripts/dspace_release_manifest.py` accepts only its release
manifest schemas and requires a real `semanticTag`. Neither an upstream
release manifest nor a deployable Sugarkube candidate is generated here.
Do not translate this receipt to schema 1/2, fill in a fictitious alias,
disable equality checks, or pass it to the existing candidate command.

A separately reviewed staging adapter must:

- Accept **only** the closed `dspace-staging-coordinates-v1` schema for this
  path. Require both the receipt and independently authenticated owner staging
  approval bound to the exact source, image index, and chart digest, and require
  successful native verifier evidence for both platforms on that same image.
- Before mutation, require the canonical staging kubeconfig/context and
  environment, re-resolve the approved immutable coordinates in authenticated
  read-only registry access, and enforce chart/source and both platform
  identities. Pin by digest, never substitute a moving tag. Fail if the adapter
  cannot install the approved chart digest or pin the intended image.
- Emit distinctly typed staging-only evidence. Never generate a normal
  `final` release record usable by the production staging gate. Existing
  semantic verification and independent production authorization stay intact.
- Test production/wrong context, wrong/missing approval, forged or missing
  native verification, chart/image drift, source mismatch, tag-only fallback,
  and rejection of the staging-only evidence by the existing production gate.

This receipt alone is not operational staging validation or a release QA pass.

Run the network-free regression tests with:

```sh
node --test scripts/prepare-staging-coordinates.test.mjs scripts/verify-candidate-image.test.mjs
```
