# dspace Helm chart (sugarkube)

This file documents the Helm chart reference used by sugarkube automation for dspace v3. Keep the
version in [`docs/apps/dspace.version`](./dspace.version) aligned with the chart metadata in
[`charts/dspace/Chart.yaml`](../../charts/dspace/Chart.yaml). External helpers (e.g.
`sugarkube`'s `helm-oci-install`) read the version file directly and expect a semantic version
without a leading `v`.

- OCI chart URL: `oci://ghcr.io/democratizedspace/charts/dspace`
- Current chart version: `3.0.0` (see `docs/apps/dspace.version`)
- App container version: `v3.0.0` (set via `appVersion` in `Chart.yaml`)

## Installing with sugarkube helpers

From the `sugarkube` repository root, the recommended install uses the shared version file to keep
Helm pulls in sync with the published chart:

```bash
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.dev.yaml,docs/examples/dspace.values.staging.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=v3-latest
```

## Installing with raw Helm

```bash
helm upgrade --install dspace oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --version "$(cat docs/apps/dspace.version)" \
  --values docs/examples/dspace.values.dev.yaml \
  --values docs/examples/dspace.values.staging.yaml
```

These commands assume you have already authenticated to GHCR (`helm registry login ghcr.io`).
