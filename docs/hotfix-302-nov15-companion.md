# November 15 v3.0.2 final-candidate companion

Adds one exact immutable image profile without changing either prior profile,
provider contract, runtime identity checks or browser journey.

- Source: `bfb910201e23119cb26902d8ca6787070150b695`
- Index: `sha256:e9331b4319a9d475b910be6265613202a93d133fe33a8c6685dd962746a8e485`
- Version label: `v3.0.2+bfb9102`
- amd64: `sha256:2cdc3c0b5bef54a55ddc3639d1d2925a5c0716338b3dcef8e78c94dc97281e07`
- arm64: `sha256:32fc5c8ccc31ac57d9f915527a22ed82143f44ae2752a25b441c87372d7228ce`

## Evidence and limits

[Publication run 43777310401](https://github.com/democratizedspace/dspace/actions/runs/43777310401)
pushed this image. Its original `maintenance-publication-receipt` artifact
(ID `14187154523`) records `published: true`, `verified: false`, and empty smoke
results: the subsequent registry token request failed. Preserve that failure
receipt; do not rerun the publisher or overwrite the coordinate.

The fixture `scripts/fixtures/hotfix-302-nov15-oci-proof.json` contains original
base64-encoded index, Linux platform manifest and configuration bytes collected
from GHCR on November 16 UTC (November 15 Pacific). Every hash link was checked
against the immutable index and platform descriptors. The tag also resolved to
that index. The companion revalidates those bytes offline and checks source,
version and repository labels for both architectures. Metadata verification does
not establish container health, completed publisher smoke checks or deployment.

Next, Sugarkube must add this exact tuple and pin the reviewed companion commit.
Use the existing bounded staging runtime/health verification on the new image,
reusing prior broader functional acceptance. Keep prior finalized rollback
receipts. No new verification workflow, rebuild, chart change, deployment or
production approval is included here.
