# dspace Helm chart versioning

This directory tracks the Helm chart version consumed by sugarkube for installing the dspace v3
application. The chart lives in `charts/dspace` and is published to the GitHub Container Registry as
`oci://ghcr.io/democratizedspace/charts/dspace`.

## Source of truth

- Chart definition: `charts/dspace/Chart.yaml` (version `3.0.0`, appVersion `v3.0.0`)
- External version file: `docs/apps/dspace.version` (read by sugarkube `helm-oci-*` helpers)

Keep both files in sync before running the publish workflow so that `helm pull` resolves the expected
OCI tag.

## Installing from GHCR

Use the OCI URL with the chart version from `docs/apps/dspace.version` (currently `3.0.0`):

```bash
helm install dspace oci://ghcr.io/democratizedspace/charts/dspace \
  --version 3.0.0 \
  --set ingress.enabled=true \
  --set ingress.host=dspace.example.com \
  --set image.tag=v3.0.0
```

To pull the chart without installing, run:

```bash
helm pull oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
```

## Publishing notes

The `.github/workflows/ci-helm.yml` workflow packages `charts/dspace` and pushes it to GHCR. It reads
the chart version from `Chart.yaml`, so bump the version in both `Chart.yaml` and
`docs/apps/dspace.version` before triggering the workflow.
