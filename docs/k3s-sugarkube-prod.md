# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space` with a subdomain-first
> rollout at `https://prod.democratized.space`. QA Cheats must remain **disabled**.

## Preconditions

- Sugarkube cluster running with `env=prod` (HA strongly recommended)
- Traefik installed and healthy (`just traefik-install` / `just traefik-status`)
- Cloudflare account with:
    - access to the `democratized.space` zone,
    - a production tunnel token available to Sugarkube as `SUGARKUBE_TOKEN_PROD`, and
    - permissions to edit DNS + Redirect Rules.
- GHCR access for images/charts and `kubectl` + `just` on the control node

Reference docs:

- Cloudflare Tunnel routing/public hostnames:
  <https://developers.cloudflare.com/tunnel/routing/>
- Cloudflare DNS record management:
  <https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/>
- Cloudflare proxy status (orange cloud):
  <https://developers.cloudflare.com/dns/proxy-status/>
- Cloudflare Single Redirects (dashboard):
  <https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/>

## QA Cheats policy (prod)

Production runs with QA Cheats **OFF**. The production values set `environment: prod`, mapping to
`DSPACE_ENV=prod`, which disables cheats in the UI. Do not override this value.

## Immutable tags only

Production must use immutable tags so every rollout is reproducible and auditable:

- During `v3` validation, use `v3-<shortsha>` tags.
- After merging `v3` into `main`, use `main-<shortsha>` tags for apex deploys.
- Avoid mutable tags like `*-latest`. Mutable tags do not trigger a new rollout on image republish,
  and they make it harder to confirm which build is running during an incident.
- Pin `default_tag` in the Helm helper to one of the immutable tags above (for example,
  `default_tag=v3-a1b2c3d` or `default_tag=main-a1b2c3d`), not `v3-latest`.

## Production cutover sequence (subdomain first)

Use this exact sequence to keep the apex stable while validating v3 in production infrastructure:

1. **Phase A (validation host): deploy v3 to `prod.democratized.space` first** from branch `v3`
   using immutable tag `v3-<shortsha>`.
2. **Validate Phase A** on `prod.democratized.space` (health checks + smoke flow + logs).
3. **Merge `v3` into `main`** only after `prod.democratized.space` sign-off on that immutable tag.
4. **Phase B (apex host): deploy `democratized.space` from `main`** with immutable
   `main-<shortsha>`.
5. **Convert `prod.democratized.space` to redirect** → `https://democratized.space` after Phase B
   is healthy.

---

## Step-by-step runbook

### 1) Select and verify the immutable deploy tag

1. Find the commit to deploy in GitHub Actions image/chart workflows:
    - <https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml>
    - <https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml>
2. Pick the exact immutable tag:
    - Phase A: `v3-<shortsha>`
    - Phase B: `main-<shortsha>`
3. Record it in your change ticket/incident notes before deploying.

### 2) Configure Cloudflare for Phase A (`prod.democratized.space`)

Perform these in the Cloudflare dashboard for the `democratized.space` zone.

1. **Ensure tunnel public hostname exists for `prod.democratized.space`:**
    - In Zero Trust Tunnel UI, add/update a public hostname using the production tunnel.
    - Route hostname: `prod.democratized.space`
    - Service: Traefik inside cluster (typically `http://traefik.kube-system.svc.cluster.local:80`)
    - Cloudflare auto-creates/updates the DNS record when you add a tunnel route.
2. **Confirm DNS record is proxied (orange cloud):**
    - Type should resolve as tunnel CNAME target (`<UUID>.cfargotunnel.com`) or equivalent.
    - Proxy status must be **Proxied**, not DNS-only.
3. **Do not create redirect rule yet** for `prod.*` during Phase A; this host must serve live app
   traffic for validation.

### 3) Deploy via Sugarkube Helm helper (Phase A)

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=<v3-shortsha-tag>
```

If release already exists, use upgrade:

```bash
cd ~/sugarkube
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=<v3-shortsha-tag>
```

### 4) Validate Phase A before any merge/cutover

Run from an operator shell with cluster/network access:

```bash
kubectl -n dspace get deploy,po,ingress
curl -fsS https://prod.democratized.space/config.json
curl -fsS https://prod.democratized.space/healthz
curl -fsS https://prod.democratized.space/livez
```

Minimum pass criteria:

- Deployment and pods are Ready.
- Ingress is present.
- All three endpoints return HTTP 200.
- Manual smoke flow passes on `https://prod.democratized.space`.

### 5) Merge and deploy Phase B (`democratized.space`)

1. Merge `v3` → `main` after Phase A sign-off.
2. Select new immutable `main-<shortsha>` tag produced after merge.
3. Deploy apex using the same Helm helper and prod values, swapping only `default_tag`:

```bash
cd ~/sugarkube
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=<main-shortsha-tag>
```

4. Validate apex:

```bash
curl -fsS https://democratized.space/config.json
curl -fsS https://democratized.space/healthz
curl -fsS https://democratized.space/livez
```

### 6) Convert `prod.democratized.space` into a redirect (post-cutover)

Only do this after apex validation succeeds.

1. In Cloudflare Rules, create a **Single Redirect** rule for `prod.democratized.space`.
2. Match: host is `prod.democratized.space` (optionally wildcard path capture).
3. Target: `https://democratized.space` (or dynamic with path preservation if desired).
4. Status code: `301`.
5. Keep/disable query-string preservation based on your tracking requirements.
6. Deploy the rule and verify:

```bash
curl -I https://prod.democratized.space
```

Expected: HTTP `301` with `Location: https://democratized.space/...`.

---

## Safe rollback playbook

- Keep staging/dev values and tokens out of production. Use only `SUGARKUBE_TOKEN_PROD` and the
  production values file.
- For any rollback, redeploy a previous known-good immutable tag; do not use mutable tags.

### Phase A rollback (validation host only)

1. Keep apex (`democratized.space`) unchanged.
2. Redeploy previous known-good `v3-<shortsha>` to `prod.democratized.space`.
3. Re-run:

```bash
curl -fsS https://prod.democratized.space/config.json
curl -fsS https://prod.democratized.space/healthz
curl -fsS https://prod.democratized.space/livez
```

### Phase B rollback (apex)

1. Redeploy previous known-good `main-<shortsha>` to `democratized.space`.
2. Leave `prod.democratized.space` available as a live validation host until apex is stable.
3. Re-run:

```bash
curl -fsS https://democratized.space/config.json
curl -fsS https://democratized.space/healthz
curl -fsS https://democratized.space/livez
```

### Redirect safety rule

Only enable the `prod.democratized.space` → `democratized.space` redirect after apex passes
validation on the intended `main-<shortsha>` tag.
