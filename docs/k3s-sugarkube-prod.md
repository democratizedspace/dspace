# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space` with a subdomain-first
> rollout at `https://prod.democratized.space`. QA Cheats must remain **disabled**.

This is an operator runbook for a **subdomain-first production rollout**:

1. deploy and validate on `prod.democratized.space`,
2. cut over apex `democratized.space`,
3. then convert `prod.democratized.space` to a redirect.

## Source references (open these first)

- dspace prod values reference in sugarkube:
  [`docs/examples/dspace.values.prod.yaml`](https://github.com/futuroptimist/sugarkube/blob/main/docs/examples/dspace.values.prod.yaml)
- sugarkube dspace app guide:
  [`docs/apps/dspace.md`](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
- sugarkube Cloudflare tunnel guide:
  [`docs/cloudflare_tunnel.md`](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
- sugarkube Traefik operations guide:
  [`docs/raspi_cluster_operations.md`](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
- Cloudflare dashboard pages used in this runbook:
  - [Zero Trust → Networks → Tunnels](https://one.dash.cloudflare.com/)
  - [DNS Records](https://dash.cloudflare.com/)
- Cloudflare docs:
  - [Cloudflare Tunnel (overview)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
  - [Public hostname / published application route](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/routing-to-tunnel/dns/)

## Preconditions (must all be true before Step 1)

- Sugarkube production cluster exists and is reachable (`env=prod`; HA strongly recommended).
- Traefik is installed and healthy (`just traefik-install`, `just traefik-status`).
- Cloudflare tunnel connector is installed in-cluster with `SUGARKUBE_TOKEN_PROD`.
- You can edit the `democratized.space` zone in Cloudflare.
- GHCR pull access is working from the cluster.
- You can run `kubectl` and `just` on the sugarkube control node.

## QA Cheats policy (prod)

Production must run with QA Cheats **OFF**. The production values set `environment: prod`,
which maps to `DSPACE_ENV=prod` in the app and disables cheats in the UI. Do not override it.

## Immutable tags only

Production must use immutable tags so every rollout is reproducible and auditable:

- During `v3` validation, use `v3-<shortsha>` tags.
- After merging `v3` into `main`, use `main-<shortsha>` tags for apex deploys.
- Do not use mutable tags like `*-latest`.
- Set `default_tag` in the Helm helper to one of the immutable tags above.

## Step 1: Configure Cloudflare for the validation host (`prod.democratized.space`)

> Do this before any Helm install. Helm creates Kubernetes resources only; it does not create
> Cloudflare routes or DNS records.

In Cloudflare, add a **published application route** for `prod.democratized.space`:

1. Open **Zero Trust → Networks → Tunnels** and select your production tunnel.
2. Go to **Published application routes** (sometimes labeled **Public Hostname**) and click
   **Add a published application route**.
3. Set host:
   - **Subdomain:** `prod`
   - **Domain:** `democratized.space`
   - **Path:** blank
4. Set backend service:
   - **Type:** `HTTP`
   - **URL:** `traefik.kube-system.svc.cluster.local`
5. Save.

Then verify DNS in **DNS → Records** for the `democratized.space` zone:

- `prod` exists as a proxied `CNAME` to `<tunnel-uuid>.cfargotunnel.com`.
- Proxy status is **Proxied** (orange cloud).

## Step 2: Select the immutable artifact tag

Find the exact tag produced by CI workflows:

- [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
- [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

Use:

- `v3-<shortsha>` for Phase A (`prod.democratized.space` validation), then
- `main-<shortsha>` for Phase B (`democratized.space` apex cutover after merge).

## Step 3: Deploy Phase A to `prod.democratized.space`

Run from a sugarkube control node:

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=<v3-shortsha-tag>
```

If the release already exists, use `just helm-oci-upgrade` with the same arguments.

## Step 4: Validate Phase A before any merge/cutover

Run all checks against `prod.democratized.space`:

```bash
kubectl -n dspace get deploy,po,ingress
curl -fsS https://prod.democratized.space/config.json
curl -fsS https://prod.democratized.space/healthz
curl -fsS https://prod.democratized.space/livez
```

Minimum sign-off checklist:

- Deployment is `Available=True` and pods are ready.
- `/config.json`, `/healthz`, and `/livez` all return `200`.
- Manual smoke flow succeeds (home page load + at least one quest path load).
- No critical errors in app pod logs during smoke:

```bash
kubectl -n dspace logs deploy/dspace --tail=200
```

## Step 5: Promote to apex (`democratized.space`)

After Phase A sign-off:

1. Merge `v3` into `main`.
2. Select the corresponding `main-<shortsha>` immutable tag.
3. Ensure Cloudflare route for apex host exists and targets
   `traefik.kube-system.svc.cluster.local`.
4. Deploy from `main` artifact:

```bash
cd ~/sugarkube
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=<main-shortsha-tag>
```

5. Validate apex:

```bash
curl -fsS https://democratized.space/config.json
curl -fsS https://democratized.space/healthz
curl -fsS https://democratized.space/livez
```

## Step 6: Convert `prod.democratized.space` to redirect (only after apex is healthy)

In Cloudflare, after apex validation passes:

1. Go to **Rules → Redirect Rules** in the `democratized.space` zone.
2. Add a rule matching host `prod.democratized.space`.
3. Configure static redirect target: `https://democratized.space/$1` (preserve path/query).
4. Use HTTP status **308** (preferred) or **301**.
5. Verify:

```bash
curl -I https://prod.democratized.space/
```

Expected: `Location: https://democratized.space/...`.

## Rollback procedure

### Phase A rollback (`prod.democratized.space`)

- Keep apex unchanged.
- Redeploy previous known-good `v3-<shortsha>` tag to prod subdomain host.
- Re-check `/config.json`, `/healthz`, `/livez` on `prod.democratized.space`.

### Phase B rollback (`democratized.space` apex)

- Redeploy previous known-good `main-<shortsha>` on apex.
- Keep `prod.democratized.space` available as validation host until stable.
- Re-check `/config.json`, `/healthz`, `/livez` on apex.

## Operational safety rules

- Never mix staging/dev values or tokens into prod.
- Use only `SUGARKUBE_TOKEN_PROD` and `docs/examples/dspace.values.prod.yaml`.
- Record the exact immutable tag deployed, deployment timestamp (UTC), and operator name in your
  deployment log.
- Do not enable the `prod.democratized.space` redirect until apex validation is complete.
