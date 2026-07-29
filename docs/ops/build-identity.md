# Runtime build identity verification

DSPACE production images expose one artifact-fixed identity at `GET /build-info.json`. The legacy
`/build-meta.json` endpoint is backed by the same metadata. Responses are uncached; an invalid or
missing production identity returns HTTP 503. Health probes include the identity additively but
retain their availability semantics.

Given the approved full commit and immutable image coordinate, Sugarkube automation can use:

```bash
expected_sha='<40-character-approved-sha>'
base_url='https://democratized.space'
image='ghcr.io/democratizedspace/dspace:main-abcdef0'

runtime_sha="$(curl -fsS "$base_url/build-info.json" | jq -r .revision)"
html_sha="$(curl -fsS "$base_url/" | sed -n 's/.*name="dspace-build-revision" content="\([0-9a-f]\{40\}\)".*/\1/p' | head -1)"
oci_sha="$(docker image inspect "$image" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')"
test "$runtime_sha" = "$expected_sha"
test "$html_sha" = "$expected_sha"
test "$oci_sha" = "$expected_sha"
```

Also require `.shortRevision == ($expected_sha | first seven characters)`, and, when present,
`.image` to equal the approved immutable branch-SHA coordinate. Never accept `latest` or a semantic
tag as promotion evidence. This contract verifies an already selected deployment; it does not
implement a remote chat smoke test or a promotion gate.
