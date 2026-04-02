# DSPACE prod runbook (live): k3s + sugarkube

> **Status:** Live and stable.
>
> Primary production environment:
> `https://democratized.space` on `sugarkube0`, `sugarkube1`, and `sugarkube2`
> with `env=prod`.

## Purpose and topology

- Environment: `env=prod`
- Nodes: `sugarkube0`, `sugarkube1`, `sugarkube2`
- Topology: 3-node HA
- Hostname: `democratized.space`
- QA Cheats: **OFF** (`DSPACE_ENV=prod`)

This runbook is for repeated steady-state production releases, not a one-time cutover.

For release policy and branch/tag workflow, see [docs/merge-plan.md](./merge-plan.md).

## About `prod.democratized.space`

`prod.democratized.space` is optional alias/reference guidance only. It is **not** a required,
permanent preview phase in the default prod process.

If used in the future for rehearsal, treat it as an optional temporary rollout tool.

## Artifact/tag policy

- Deploy prod from approved immutable tags only:
  - `main-<shortsha>`
  - `vX.Y.Z` (or approved `vX.Y.Z-rc.N` during rehearsals)
- Do not use mutable tags (`main-latest`, `*-latest`) for prod sign-off or deployment.

## Prerequisites

- HA prod cluster healthy and reachable (`env=prod`)
- Traefik and Cloudflare tunnel route for `democratized.space` already configured
- GHCR pull credentials for image + chart
- sugarkube repo present on operator machine (`~/sugarkube`)

## Repeated prod release workflow

### 1) Confirm cluster context

```bash
kubectl config current-context
```

```bash
kubectl get nodes -o wide
```

### 2) Confirm prod values overlay and environment

```bash
cd ~/sugarkube
```

```bash
cat docs/examples/dspace.values.prod.yaml
```

### 3) Deploy approved immutable tag

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_APPROVED_SHORTSHA
```

### 4) Verify rollout

```bash
kubectl -n dspace rollout status deploy/dspace
```

```bash
kubectl -n dspace get deploy,po,ingress
```

### 5) Verify prod endpoints

```bash
curl -fsS https://democratized.space/config.json
```

```bash
curl -fsS https://democratized.space/healthz
```

```bash
curl -fsS https://democratized.space/livez
```

### 6) Confirm runtime policy

```bash
curl -fsS https://democratized.space/config.json | jq '.environment'
```

Expected: prod runtime and QA Cheats disabled behavior.

## Rollback (explicit and repeatable)

Redeploy the previous known-good immutable tag:

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.prod.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```

```bash
kubectl -n dspace rollout status deploy/dspace
```

```bash
curl -fsS https://democratized.space/healthz
```

## Optional rehearsal flow (future use)

Only when explicitly requested for rollout rehearsal:

1. Deploy approved immutable candidate to optional alias host (for example `prod.democratized.space`).
2. Run rehearsal checks.
3. Deploy the same approved immutable tag to `democratized.space`.
4. Remove/redirect alias host as desired.

Default prod process remains direct deployment to `democratized.space`.
