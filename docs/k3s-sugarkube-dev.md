# DSPACE dev runbook (planned): k3s + sugarkube

> **Status:** Dev is **not live yet**. This is the intended runbook for when dev is stood up.

## Intended topology and purpose

- Environment: `env=dev`
- Planned node: `sugarkube6` only
- Availability model: single-node, non-HA by design
- Exposure model: non-user-facing / low-stakes environment
- QA Cheats: **ON** (`DSPACE_ENV=dev`)

Dev intentionally favors speed and convenience over durability. Outages, node loss, and local resets
are acceptable in this environment.

## Release model for dev

- Use `main-latest` for rapid iteration and convenience redeploys.
- Use immutable `main-<shortsha>` tags for reproducible debugging and handoff.
- Do not treat dev sign-off as a substitute for staging validation.

See the release workflow: [docs/merge-plan.md](./merge-plan.md).

Related docs:

- [Release procedure](./merge-plan.md)
- [Patch QA checklist (`v3.0.0.1`)](./qa/v3.0.0.1.md)
- [Feature QA checklist (`v3.1`)](./qa/v3.1.md)

## Prerequisites (when dev is provisioned)

- sugarkube cluster access for `env=dev` targeting sugarkube6
- GHCR pull access for:
  - `ghcr.io/democratizedspace/dspace`
  - `oci://ghcr.io/democratizedspace/charts/dspace`
- local tools: `just`, `kubectl`, `curl`
- sugarkube checkout at `~/sugarkube`

## Deploy with convenience tag (`main-latest`)

```bash
cd ~/sugarkube
```

```bash
just helm-oci-install release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-latest
```

## Deploy with immutable tag (`main-<shortsha>`)

If this is the first deployment in the namespace, run `helm-oci-install` first. `helm-oci-upgrade`
assumes an existing release.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_SHORTSHA
```

## Verify deployment (local-first)

```bash
kubectl -n dspace get deploy,po,svc,ingress
```

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=120s
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

## Rollback

Use the previous known-good immutable tag.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=docs/examples/dspace.values.dev.yaml version_file=docs/apps/dspace.version default_tag=main-REPLACE_PREVIOUS_SHORTSHA
```

## Operator notes

- Keep `environment: dev` in the dev values file so QA Cheats remain enabled.
- Because dev is single-node and non-HA, expect lower resilience than staging/prod.
- If public ingress is ever enabled for dev, keep it explicitly non-production and low-trust.
