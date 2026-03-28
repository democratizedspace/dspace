# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space` with a subdomain-first
> rollout at `https://prod.democratized.space`. QA Cheats must remain **disabled**.

This is an operator runbook for deploying dspace to production with a safe two-phase rollout:

1. Validate on `prod.democratized.space` (still `env=prod`), then
2. Promote to apex `democratized.space`, and
3. Convert `prod` to a redirect only after apex is healthy.

## Source of truth and references

- dspace chart in this repo: [`charts/dspace`](../charts/dspace)
- CI workflows that publish immutable deploy artifacts:
  - Image: [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
  - Chart: [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
- sugarkube dspace app docs:
  [docs/apps/dspace.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
- sugarkube Traefik operations:
  [raspi_cluster_operations.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_operations.md)
- sugarkube Cloudflare tunnel setup:
  [cloudflare_tunnel.md](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
- Cloudflare official docs used in this runbook:
  - Tunnel hostname + DNS routing:
    [Route traffic to a Tunnel with DNS](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/)
  - Tunnel DNS routing:
    [Route traffic to a Tunnel with DNS](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/routing-to-tunnel/dns/)
  - DNS records UI reference:
    [Create DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
  - Redirect rules (for final prod→apex redirect):
    [Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/)

## Preconditions (must be true before Step 1)

- Sugarkube cluster is running with `env=prod`.
- Traefik is installed and healthy (`just traefik-install`, `just traefik-status`).
- Cloudflare tunnel is installed for prod (`just cf-tunnel-install env=prod ...`) and connected.
- You have GHCR pull access for:
  - `ghcr.io/democratizedspace/dspace`
  - `oci://ghcr.io/democratizedspace/charts/dspace`
- You have `kubectl` and `just` on the control host where `~/sugarkube` is checked out.
- The sugarkube production values files exist and are current in your `sugarkube` checkout:
  - `~/sugarkube/docs/examples/dspace.values.prod-subdomain.yaml` for Phase A preview host
    `prod.democratized.space` (see
    [`docs/examples/dspace.values.prod-subdomain.yaml` in the sugarkube repo](https://github.com/futuroptimist/sugarkube/blob/main/docs/examples/dspace.values.prod-subdomain.yaml)).
  - `~/sugarkube/docs/examples/dspace.values.prod.yaml` for Phase B apex host
    `democratized.space` (see
    [`docs/examples/dspace.values.prod.yaml` in the sugarkube repo](https://github.com/futuroptimist/sugarkube/blob/main/docs/examples/dspace.values.prod.yaml)).

## QA Cheats policy (prod)

Production must run with QA Cheats **OFF**. Keep `environment: prod` in the production values,
which maps to `DSPACE_ENV=prod`.

## Immutable tags only

Use immutable tags for reproducible rollouts and explicit rollback:

- Validation phase: `v3-<shortsha>`
- Post-merge apex phase: `main-<shortsha>`

Do **not** deploy mutable tags like `v3-latest` or `main-latest` in production.

## Production cutover sequence

1. **Phase A:** deploy `v3-<shortsha>` to `prod.democratized.space` (env still `prod`).
2. Validate all checks on `prod.democratized.space`.
3. Merge `v3` into `main` after sign-off.
4. **Phase B:** deploy `main-<shortsha>` to apex `democratized.space`.
5. After apex is healthy, convert `prod.democratized.space` to a redirect to apex.

---

## Step 1: Pick a release tag and verify artifacts exist

1. Trigger/confirm workflows for the target branch:
   - [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
2. Select immutable image tag:
   - Phase A: `v3-<shortsha>`
   - Phase B: `main-<shortsha>`
3. Confirm chart version in sugarkube:

```bash
cd ~/sugarkube
cat docs/apps/dspace.version
```

---

## Step 2: Configure Cloudflare for Phase A (`prod.democratized.space`)

> Helm deploys Kubernetes objects only. It does **not** create Cloudflare routes or DNS records.
> Configure Cloudflare first so external traffic can reach Traefik.

### 2A) Create/verify Tunnel public hostname route

In Cloudflare dashboard:

1. Open the `democratized.space` zone.
2. Go to **Zero Trust** → **Networks** → **Tunnels**.
3. Open the production tunnel used by sugarkube.
4. In **Public Hostname** (or **Published application routes**, depending on UI), add:
   - **Subdomain:** `prod`
   - **Domain:** `democratized.space`
   - **Path:** *(blank)*
   - **Service Type:** `HTTP`
   - **URL:** `traefik.kube-system.svc.cluster.local`
5. Save.

Cloudflare reference:
[Route traffic to a Tunnel with DNS](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/).

### 2B) Verify DNS record was created (or create it manually)

In Cloudflare dashboard → **DNS** → **Records**, confirm:

- **Type:** `CNAME`
- **Name:** `prod`
- **Target:** `<tunnel-UUID>.cfargotunnel.com`
- **Proxy status:** **Proxied** (orange cloud)

Cloudflare references:
[Route traffic to a Tunnel with DNS](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/routing-to-tunnel/dns/),
[Create DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/).

### 2C) Optional CLI verification from your operator machine

```bash
# NOTE: Because this record is Proxied (orange cloud), nslookup should resolve
# to Cloudflare anycast IPs, not the underlying cfargotunnel.com CNAME target.
# Verify the CNAME target in Cloudflare DNS UI (Step 2B above).
nslookup prod.democratized.space
```

---

## Step 3: Ensure sugarkube production values are correct for Phase A

On the sugarkube control host:

```bash
cd ~/sugarkube
cat docs/examples/dspace.values.prod-subdomain.yaml
```

Pre-flight grep (run before Phase A deploy):

```bash
cd ~/sugarkube
rg -n 'prod\.democratized\.space|democratized\.space|ingress\.enabled|ingress\.className|ingress\.host|environment:' docs/examples/dspace.values.prod-subdomain.yaml docs/apps/dspace.version
```

Verify all of the following before install:

- `environment: prod`
- `ingress.enabled: true`
- `ingress.className: traefik`
- `ingress.host: prod.democratized.space` (**required for Phase A**)
- Use `docs/examples/dspace.values.prod-subdomain.yaml` for Phase A. Do **not** use apex values in
  this step.

---

## Step 4: Deploy Phase A to `prod.democratized.space`

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod-subdomain.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=v3-REPLACE_SHORTSHA
```

Then verify rollout:

```bash
kubectl -n dspace get deploy,po,ingress
kubectl -n dspace rollout status deploy/dspace
curl -fsS https://prod.democratized.space/config.json
curl -fsS https://prod.democratized.space/healthz
curl -fsS https://prod.democratized.space/livez
```

Proceed only if all checks pass.

---

## Step 5: Promote to apex (`democratized.space`) for Phase B

1. Merge `v3` to `main` after Phase A sign-off.
2. **Required file switch before apex promotion:** use
   `docs/examples/dspace.values.prod.yaml` for Phase B.
   - Do **not** reuse `docs/examples/dspace.values.prod-subdomain.yaml` for apex promotion.
   - Reusing the preview values file during apex promotion is incorrect and will route ingress to
     `prod.democratized.space` instead of `democratized.space`.
3. Pre-flight grep (run before Phase B Helm upgrade):

   ```bash
   cd ~/sugarkube
   rg -n 'prod\.democratized\.space|democratized\.space|ingress\.host|environment:' docs/examples/dspace.values.prod.yaml docs/apps/dspace.version
   ```
4. Verify all of the following in `docs/examples/dspace.values.prod.yaml`:
   - `environment: prod`
   - `ingress.host: democratized.space`

5. Configure/verify Cloudflare for apex `democratized.space` (must be complete before Helm
   upgrade and before deploying `main-<shortsha>`):
   1. In Cloudflare dashboard → **Zero Trust** → **Networks** → **Tunnels** → your production
      tunnel, confirm or add a public hostname route for apex:
      - **Subdomain:** *(blank for apex)*
      - **Domain:** `democratized.space`
      - **Path:** *(blank)*
      - **Service Type:** `HTTP`
      - **URL:** `traefik.kube-system.svc.cluster.local`
   2. In Cloudflare dashboard → **DNS** → **Records**, confirm or add the apex tunnel DNS record:
      - **Type:** `CNAME`
      - **Name:** `@` (Cloudflare UI may also render this as `democratized.space`)
      - **Target:** `<tunnel-UUID>.cfargotunnel.com`
      - **Proxy status:** **Proxied** (orange cloud)
   3. Optional CLI spot-check:

      ```bash
      # Should resolve successfully (typically returning Cloudflare proxy IPs)
      nslookup democratized.space
      ```
6. Deploy immutable `main-<shortsha>` only after Step 5 route + DNS checks are complete:

```bash
cd ~/sugarkube
just helm-oci-upgrade \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=main-REPLACE_SHORTSHA
```

7. Validate apex before changing any `prod.democratized.space` redirect behavior:

```bash
kubectl -n dspace rollout status deploy/dspace
curl -fsS https://democratized.space/config.json
curl -fsS https://democratized.space/healthz
curl -fsS https://democratized.space/livez
```

---

## Step 6: Convert `prod.democratized.space` to redirect (only after apex is healthy)

After Phase B passes:

1. In Cloudflare, create a **Single Redirect** rule:
   - **If incoming URL:** `https://prod.democratized.space/*`
   - **Then forward to:** `https://democratized.space/${1}`
   - **Status code:** `301` (or `302` if you need temporary)
2. Keep tunnel and DNS in place until redirect behavior is verified.

Cloudflare reference:
[Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/).

---

## Rollback runbook

### Phase A rollback (`prod.democratized.space` validation failed)

- Keep apex `democratized.space` untouched.
- Redeploy previous known-good `v3-<shortsha>` to prod subdomain.
- Re-run `/config.json`, `/healthz`, `/livez` checks on `prod.democratized.space`.

### Phase B rollback (apex failed after promotion)

- Redeploy previous known-good `main-<shortsha>` to apex.
- Keep `prod.democratized.space` as live validation host until apex is stable.
- Only enable/retain redirect once apex is healthy.

## Operator checklist (copy/paste)

- [ ] Immutable tag selected (`v3-<shortsha>` Phase A, `main-<shortsha>` Phase B)
- [ ] Cloudflare tunnel public hostname routes configured for active host
- [ ] DNS CNAME present and proxied for active host
- [ ] Phase A file: `docs/examples/dspace.values.prod-subdomain.yaml` with host `prod.democratized.space`
- [ ] Phase B file: `docs/examples/dspace.values.prod.yaml` with host `democratized.space`
- [ ] Before Phase B, confirm preview file is **not** being reused for apex promotion
- [ ] `environment: prod` confirmed
- [ ] Helm install/upgrade completed
- [ ] `/config.json`, `/healthz`, `/livez` all pass
- [ ] Redirect configured only after apex validation
