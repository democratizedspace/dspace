# DSPACE dev runbook on sugarkube (planned state, evergreen)

> **Status:** As of April 2, 2026, this environment is **not live yet**.
> This document defines the intended repeatable runbook once dev is stood up.

## Intended topology and purpose

- Environment: `env=dev`
- Planned node: `sugarkube6` only
- Availability model: single-node, non-HA by design
- Exposure model: non-user-facing (internal/dev-only access)
- Hostname: optional; port-forward is acceptable as default

This lower-durability topology is intentional so dev remains cheap, fast, and disposable.

## QA Cheats policy

Dev keeps QA Cheats **ON** by using `environment: dev` (maps to `DSPACE_ENV=dev`).

## Artifact/tag policy

- Convenience iteration: `main-latest`
- Reproducible testing and bug triage: `main-<shortsha>`
- Avoid semver tags in dev unless reproducing a prod/staging issue.

## Prerequisites

- sugarkube repo checked out on the operator host
- `kubectl` configured for the dev cluster context
- `just` available on the operator host
- GHCR pull access for image/chart artifacts

## First deployment after dev environment is created

```bash
cd ~/sugarkube
```

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-latest
```

## Repeatable upgrade (recommended for normal dev use)

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-latest
```

## Reproducible deploy of a specific immutable build

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

## Verification (non-public default)

```bash
kubectl -n dspace port-forward svc/dspace 3000:8080
```

```bash
curl -fsS http://localhost:3000/config.json
```

```bash
curl -fsS http://localhost:3000/healthz
```

```bash
curl -fsS http://localhost:3000/livez
```

## Rollback

Redeploy a previously known-good immutable `main-<shortsha>` tag:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```

## Related docs

- Release management: [merge-plan.md](./merge-plan.md)
- Staging promotion runbook: [k3s-sugarkube-staging.md](./k3s-sugarkube-staging.md)
- Production runbook: [k3s-sugarkube-prod.md](./k3s-sugarkube-prod.md)
