# Deploying dspace v3 to k3s with sugarkube (production)

> **Scope:** Production (`env=prod`) for `https://democratized.space` with a subdomain-first
> rollout at `https://prod.democratized.space`. QA Cheats must remain **disabled**.

This runbook is intentionally explicit and ordered. Follow steps in sequence and do not skip
validation gates.

## Canonical references

- dspace app guide in sugarkube:
  [`docs/apps/dspace.md`](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md)
- sugarkube Cloudflare Tunnel setup:
  [`docs/cloudflare_tunnel.md`](https://github.com/futuroptimist/sugarkube/blob/main/docs/cloudflare_tunnel.md)
- sugarkube just helpers used in this runbook:
  - [`helm-oci-install`](https://github.com/futuroptimist/sugarkube/blob/main/justfile#L345-L346)
  - [`helm-oci-upgrade`](https://github.com/futuroptimist/sugarkube/blob/main/justfile#L348-L349)
- Cloudflare docs for tunnel public hostnames (where `prod.democratized.space` is configured):
  [Configure public hostnames](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/routing-to-tunnel/dns/)
- Cloudflare docs for DNS records:
  [Manage DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- Cloudflare docs for redirect rules (`prod` → apex after cutover):
  [URL forwarding with Redirect Rules](https://developers.cloudflare.com/rules/url-forwarding/)

## Preconditions

Complete all items before you run Helm commands:

- Sugarkube cluster is online with `env=prod` (HA strongly recommended).
- Traefik ingress is installed and healthy (`just traefik-install` / `just traefik-status`).
- Cloudflare tunnel connector is installed in prod and authenticated with `SUGARKUBE_TOKEN_PROD`.
- You have GHCR pull access for charts/images and working `kubectl` + `just` on a control node.
- You have access to Cloudflare dashboard for the `democratized.space` zone.

## QA Cheats policy (prod)

Production runs with QA Cheats **OFF**. The production values set `environment: prod`, mapping to
`DSPACE_ENV=prod`, which disables cheats in the UI. Do not override this value.

## Immutable tags only

Production must use immutable tags so every rollout is reproducible and auditable:

- During `v3` validation, use `v3-<shortsha>` tags.
- After merging `v3` into `main`, use `main-<shortsha>` tags for apex deploys.
- Avoid mutable tags like `*-latest`. Mutable tags do not trigger a new rollout on image republish,
  and they make it harder to confirm which build is running during an incident.
- Pin `default_tag` in the Helm helper to one immutable tag (for example,
  `default_tag=v3-a1b2c3d` or `default_tag=main-a1b2c3d`).

## Production cutover sequence (subdomain first)

Use this exact sequence to keep the apex stable while validating v3 in production infrastructure:

1. **Phase A (validation host):** deploy v3 to `prod.democratized.space` first from branch `v3`
   using immutable tag `v3-<shortsha>`.
2. **Validate Phase A:** run health + smoke checks on `prod.democratized.space` and keep apex
   traffic untouched until sign-off.
3. **Merge gate:** merge `v3` into `main` only after Phase A sign-off on that immutable tag.
4. **Phase B (apex host):** deploy `democratized.space` from `main` with immutable
   `main-<shortsha>`.
5. **Redirect gate:** convert `prod.democratized.space` to redirect to
   `https://democratized.space` only after apex passes all checks.

---

## Step 1: Identify release tag and active host

1. Pick an immutable tag from GHCR workflows:
   - [ci-image.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
   - [ci-helm.yml](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)
2. Determine phase:
   - Phase A active host = `prod.democratized.space`, tag = `v3-<shortsha>`
   - Phase B active host = `democratized.space`, tag = `main-<shortsha>`
3. Write both in your deploy notes before touching cluster or DNS.

## Step 2: Configure `prod.democratized.space` in Cloudflare Tunnel

> Helm does **not** configure Cloudflare hostnames. Configure tunnel routing first.

1. Open Cloudflare dashboard for `democratized.space`.
2. Go to **Zero Trust → Networks → Tunnels**.
3. Select the prod tunnel associated with `SUGARKUBE_TOKEN_PROD`.
4. Under **Public Hostnames**, add or verify:
   - **Subdomain:** `prod`
   - **Domain:** `democratized.space`
   - **Type:** `HTTP`
   - **URL:** `traefik.kube-system.svc.cluster.local:80`
5. Save and confirm status is healthy in the tunnel UI.

Reference: Cloudflare public hostname docs:
<https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/routing-to-tunnel/dns/>.

## Step 3: Verify Cloudflare DNS record for `prod`

1. In Cloudflare dashboard, go to **DNS → Records**.
2. Verify there is a proxied CNAME:
   - **Name:** `prod`
   - **Target:** `<tunnel-UUID>.cfargotunnel.com`
   - **Proxy status:** Proxied (orange cloud)
3. If missing, create it manually and wait for propagation.

Reference: Cloudflare DNS record docs:
<https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/>.

## Step 4: Deploy dspace with sugarkube Helm helper

Run from a control node with `~/sugarkube` checked out.

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=<immutable-tag-from-step-1>
```

For an existing install, use `just helm-oci-upgrade` with the same arguments and a new immutable
`default_tag`.

## Step 5: Validate cluster and public endpoints

1. Validate Kubernetes resources:

   ```bash
   kubectl -n dspace get deploy,po,ingress
   ```

2. Validate active hostname endpoints:

   ```bash
   curl -fsS https://<active-host>/config.json
   curl -fsS https://<active-host>/healthz
   curl -fsS https://<active-host>/livez
   ```

3. If any endpoint fails, stop and rollback (see rollback section).

## Step 6: Phase B cutover to apex (`democratized.space`)

After Phase A sign-off and merge of `v3` → `main`:

1. Re-run deploy with `default_tag=main-<shortsha>`.
2. Ensure dspace production values still set `environment: prod`.
3. Validate apex endpoints:

   ```bash
   curl -fsS https://democratized.space/config.json
   curl -fsS https://democratized.space/healthz
   curl -fsS https://democratized.space/livez
   ```

## Step 7: Convert `prod` host to redirect (post-cutover only)

Only perform this step after apex validation succeeds.

1. In Cloudflare dashboard, go to **Rules → Redirect Rules**.
2. Create rule matching host `prod.democratized.space`.
3. Set static redirect target to `https://democratized.space`.
4. Use `301` for permanent redirect (or `302` if temporarily validating).
5. Verify:

   ```bash
   curl -I https://prod.democratized.space
   ```

   Expect `Location: https://democratized.space`.

Reference: Cloudflare URL forwarding docs:
<https://developers.cloudflare.com/rules/url-forwarding/>.

---

## Safe rollout / rollback

- Keep staging/dev values and tokens out of production.
- Use only `SUGARKUBE_TOKEN_PROD` and `docs/examples/dspace.values.prod.yaml`.

**Phase A rollback (validation host):**

1. Keep apex (`democratized.space`) unchanged.
2. Redeploy previous known-good `v3-<shortsha>` to `prod.democratized.space`.
3. Re-check `/config.json`, `/healthz`, and `/livez` on `prod.democratized.space`.

**Phase B rollback (apex host):**

1. Redeploy previous known-good `main-<shortsha>` to `democratized.space`.
2. Keep `prod.democratized.space` as live validation host until apex stabilizes.
3. Re-check `/config.json`, `/healthz`, and `/livez` on `democratized.space`.

**Redirect safety rule:**
Only enable the `prod.democratized.space` → `democratized.space` redirect after apex passes
validation on the intended `main-<shortsha>` tag.
