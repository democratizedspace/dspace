# DSPACE Sugarkube release and deployment runbook

DSPACE already has a mature, validated Sugarkube staging and production flow. This runbook makes
that flow explicit so DSPACE follows the shared Sugarkube release contract while preserving the
known-good image, chart, and deployment behavior.

Use this page as the steady-state release source of truth. The older environment runbooks remain
useful for environment-specific details, QA cheat settings, and cluster troubleshooting:

- [DSPACE dev runbook](../k3s-sugarkube-dev.md)
- [DSPACE staging runbook](../k3s-sugarkube-staging.md)
- [DSPACE production runbook](../k3s-sugarkube-prod.md)

## Release contract

| Artifact       | Canonical location                                        | Notes                                                          |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Image          | `ghcr.io/democratizedspace/dspace`                        | Built by `.github/workflows/ci-image.yml` for `main` and `v3`. |
| Chart          | `oci://ghcr.io/democratizedspace/charts/dspace`           | Packaged by `.github/workflows/ci-helm.yml`.                   |
| Chart version  | `charts/dspace/Chart.yaml` and `docs/apps/dspace.version` | Keep these in sync; current version is `3.0.1`.                |
| Runtime health | `/config.json`, `/healthz`, `/livez`                      | Validate these after every deploy and promotion.               |

The image workflow publishes the existing tag set that Sugarkube deployments consume:

- Immutable branch/SHA tag: `main-<shortsha>` or `v3-<shortsha>`.
- Mutable branch convenience tag: `main-latest` or `v3-latest`.
- Version tag: `v<package.version>` (currently `v3.0.1`).

Prefer immutable branch/SHA tags for staging, production promotion, and rollback because they point
to one exact image build.

## Release workflow

1. Open the **Build and publish GHCR image** (`ci-image.yml`) workflow run for the desired commit
   and branch (`main` or `v3`).
2. Confirm the workflow succeeded. The run must publish the multi-architecture image before any
   staging or production deployment uses that tag.
3. Copy the immutable image tag from the workflow summary or from GHCR, for example
   `main-REPLACE_SHORTSHA` or `v3-REPLACE_SHORTSHA`.
4. Confirm the chart version in `charts/dspace/Chart.yaml`, `docs/apps/dspace.version`, and/or the
   **Publish Helm chart** (`ci-helm.yml`) workflow run.
5. From a Sugarkube checkout, deploy staging with the current DSPACE-specific compatibility recipe:

   ```bash
   cd ~/sugarkube
   just dspace-oci-deploy env=staging tag=main-REPLACE_SHORTSHA
   ```

   Use the appropriate branch prefix for the source branch, for example:

   ```bash
   just dspace-oci-deploy env=staging tag=v3-REPLACE_SHORTSHA
   ```

6. Promote production after staging validation. Use the image tag that matches the release decision:

   ```bash
   just dspace-oci-promote-prod tag=3.0.1
   ```

   Or promote the exact branch/SHA image that passed staging:

   ```bash
   just dspace-oci-promote-prod tag=main-REPLACE_SHORTSHA
   ```

   `main-REPLACE_SHORTSHA` and `v3-REPLACE_SHORTSHA` are immutable image tags. The bare `3.0.1`
   form is the existing Sugarkube compatibility path for the current DSPACE release version.

## Future generic Sugarkube commands

After Sugarkube P5 lands, the app-generic recipes should become the preferred entry points while
the DSPACE-specific recipes remain compatibility shims:

```bash
cd ~/sugarkube
just app-deploy app=dspace env=staging tag=main-REPLACE_SHORTSHA
just app-promote-prod app=dspace tag=main-REPLACE_SHORTSHA
```

Use `v3-REPLACE_SHORTSHA` instead of `main-REPLACE_SHORTSHA` when the validated image came from the
`v3` branch.

## Post-deploy validation

Run the staging checks after every staging deployment:

```bash
curl -fsS https://staging.democratized.space/config.json | jq .
curl -fsS https://staging.democratized.space/healthz | jq .
curl -fsS https://staging.democratized.space/livez | jq .
```

Run the production checks immediately after promotion:

```bash
curl -fsS https://democratized.space/config.json | jq .
curl -fsS https://democratized.space/healthz | jq .
curl -fsS https://democratized.space/livez | jq .
```

If any endpoint fails, capture the failing command, response, and relevant Sugarkube/cluster logs
before rolling back or making additional changes.

## Rollback

Rollback by redeploying the prior known-good immutable tag through the same Sugarkube path. For
example, if staging or production was promoted from `main-abc1234` and the previous known-good image
was `main-def5678`, redeploy `main-def5678` rather than a mutable `main-latest` tag.

Current DSPACE-specific rollback pattern:

```bash
cd ~/sugarkube
just dspace-oci-deploy env=staging tag=main-def5678
just dspace-oci-promote-prod tag=main-def5678
```

Future generic rollback pattern after Sugarkube P5:

```bash
cd ~/sugarkube
just app-deploy app=dspace env=staging tag=main-def5678
just app-promote-prod app=dspace tag=main-def5678
```

## Cloudflare routes and DNS

Keep Cloudflare route and DNS setup separate from Helm deployment. Sugarkube Helm commands deploy
or upgrade the DSPACE Kubernetes release; they do not replace Cloudflare tunnel, DNS, or load
balancer configuration procedures. Use the Cloudflare and environment-specific runbooks when a
release also requires route or DNS changes.

## Local Docker builds

Local Docker builds are for local development, smoke testing, and debugging only. They are not the
normal Sugarkube staging or production release path. Staging and production should deploy images
published by `ci-image.yml` to `ghcr.io/democratizedspace/dspace` and charts published by
`ci-helm.yml` to `oci://ghcr.io/democratizedspace/charts/dspace`.
