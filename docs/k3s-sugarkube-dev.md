# DSPACE dev runbook (planned) for k3s + sugarkube

> **Status:** Dev is **not live yet**. This document defines the intended steady-state runbook once dev is stood up.

## Purpose

Use this runbook for the future `env=dev` deployment on `sugarkube6`.

- Topology: single-node, non-HA
- Availability target: best-effort (lower durability by design)
- Exposure: non-user-facing / low-stakes
- QA Cheats: **ON** (`DSPACE_ENV=dev`)

For release policy and promotion rules, see [docs/merge-plan.md](./merge-plan.md).

## Planned topology

- Node: `sugarkube6` only
- Environment label: `env=dev`
- Hostname: optional/private only (no public production-style endpoint required)

This environment intentionally trades resilience for speed and simplicity.

## Tag strategy in dev

Use convenience tags for fast iteration, then immutable tags for reproducible checks.

- Fast iteration: `main-latest`
- Reproducible validation/bug repro: `main-<shortsha>`

Do not use dev sign-off as a substitute for staging sign-off.

## Planned deploy flow (once env exists)

### 1) Confirm kubectl context

```bash
kubectl config current-context
```

### 2) Deploy with convenience tag for quick iteration

```bash
cd ~/sugarkube
```

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-latest
```

### 3) Re-deploy with immutable tag before sharing results

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version tag=main-REPLACE_SHORTSHA
```

### 4) Verify service health

```bash
kubectl -n dspace get pods
```

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

## Expected behavior differences vs staging/prod

- Single-node means no control-plane or workload HA.
- Maintenance/reboots can fully interrupt service.
- Data durability and uptime expectations are intentionally lower than staging/prod.
- QA Cheats remain enabled to support rapid test workflows.
