# DSPACE dev runbook (planned): k3s + sugarkube

> **Status:** Planned environment (not yet live).
>
> This runbook describes the intended steady-state dev deployment once `env=dev` is stood up on
> `sugarkube6`.

## Purpose and topology

Dev is intentionally lower-durability and lower-availability than staging/prod:

- Planned node: `sugarkube6` only
- Planned environment: `env=dev`
- Topology: single-node, non-HA
- Exposure: non-user-facing / low-stakes testing
- QA Cheats: **ON** (`DSPACE_ENV=dev`)

Use this environment for rapid validation, repros, and pre-staging checks.

For release/promotion policy across environments, see
[docs/merge-plan.md](./merge-plan.md).

## Tag usage in dev

Use both tag types intentionally:

- `main-latest`: fast iteration convenience
- `main-<shortsha>`: reproducible testing and rollback drills

Do not treat mutable tags as sign-off artifacts for staging/prod promotion.

## Prerequisites (once dev is stood up)

- `sugarkube` checkout on the operator machine
- `kubectl`, `helm`, and `just` installed
- GHCR pull credentials for:
  - `ghcr.io/democratizedspace/dspace`
  - `oci://ghcr.io/democratizedspace/charts/dspace`
- Dev values overlay available in sugarkube:
  - `docs/examples/dspace.values.dev.yaml`

## Deploy flow (planned)

### 1) Ensure correct cluster context

```bash
kubectl config current-context
```

### 2) Confirm dev values keep QA Cheats enabled

```bash
cd ~/sugarkube
```

```bash
cat docs/examples/dspace.values.dev.yaml
```

### 3) Install/upgrade with convenience tag (`main-latest`)

```bash
cd ~/sugarkube
```

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-latest
```

### 4) Optional reproducible deploy with immutable tag (`main-<shortsha>`)

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

### 5) Verify deployment health

```bash
kubectl -n dspace rollout status deploy/dspace
```

```bash
kubectl -n dspace get pods
```

## Access checks (non-public dev)

### 1) Port-forward service locally

```bash
kubectl -n dspace port-forward svc/dspace 3000:8080
```

### 2) Verify config and health endpoints

```bash
curl -fsS http://localhost:3000/config.json
```

```bash
curl -fsS http://localhost:3000/healthz
```

```bash
curl -fsS http://localhost:3000/livez
```

## Rollback (planned)

Deploy the previous known-good immutable `main-<shortsha>` tag:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```
