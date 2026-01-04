# Deploying dspace v3 to k3s with sugarkube (prod)

> **Scope:** Production environment at `https://democratized.space`. QA Cheats **must be disabled**
> (`DSPACE_ENV=production`). Use immutable image tags for predictable rollouts.

This runbook parallels the staging guide but targets the prod cluster and hostname.

## Prerequisites

- Sugarkube prod cluster online (`just ha3 env=prod`) with Traefik installed.
- Cloudflare tunnel for prod configured with `SUGARKUBE_TOKEN_PROD` and the prod tunnel token.
- GHCR access to pull `ghcr.io/democratizedspace/dspace` and the Helm chart.
- `just` available on the control node you deploy from.

## QA Cheats policy

- Set `DSPACE_ENV=production` (or unset to rely on the chart default) so QA-only UI remains hidden.
- Dev and staging keep QA Cheats enabled; prod must not.

## Build artifacts

Use the same workflows as staging, selecting the branch/tag you intend to serve in production:

- [Build and publish GHCR image](https://github.com/democratizedspace/dspace/actions/workflows/ci-image.yml)
- [Publish Helm chart](https://github.com/democratizedspace/dspace/actions/workflows/ci-helm.yml)

Prefer versioned or git-SHA tags in production (for example `v3.0.0` or `v3-<shortsha>`). Mutable
tags such as `v3-latest` may not roll pods without an explicit restart.

## Install/upgrade the Helm release (prod)

From `~/sugarkube` on a prod control node:

```bash
cd ~/sugarkube
just helm-oci-install \
  release=dspace namespace=dspace \
  chart=oci://ghcr.io/democratizedspace/charts/dspace \
  values=docs/examples/dspace.values.prod.yaml \
  version_file=docs/apps/dspace.version \
  default_tag=v3.0.0
```

- `dspace.values.prod.yaml` pins the host to `democratized.space` and sets the environment to `prod`.
- If you deploy with a mutable tag, follow up with `kubectl -n dspace rollout restart deploy/dspace`
  to ensure pods pull the new digest.

## Safe rollout and rollback

- To upgrade with an immutable tag: rerun `just helm-oci-install ... tag=<sha-or-version>`.
- To rollback: `helm -n dspace rollback dspace <revision>` after confirming the desired revision with
  `helm -n dspace history dspace`.
- Avoid mixing staging/dev values; only `dspace.values.prod.yaml` should be used for prod.

## Verification checklist

- Cloudflare route: `democratized.space` (or desired subdomain) → `traefik.kube-system.svc.cluster.local`.
- DNS CNAME points to the prod tunnel endpoint and is proxied.
- `kubectl -n dspace get ingress` shows `democratized.space`.
- QA Cheats are **off** (no cheat controls in the UI); `DSPACE_ENV` reports `production`.
- Release references immutable tags in `helm -n dspace get values dspace`.

## References

- Staging runbook: `docs/k3s-sugarkube-staging.md`
- Dev runbook: `docs/k3s-sugarkube-dev.md`
- Sugarkube app guide for dspace:
  <https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md>
