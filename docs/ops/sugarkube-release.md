# DSPACE Sugarkube release and deployment runbook

DSPACE is the mature Sugarkube baseline. Its staging and production path already works, so this
runbook documents the current contract instead of replacing it. Keep runtime behavior, image tags,
chart packaging, Cloudflare routing, and the existing `dspace-*` Sugarkube recipes intact unless a
future coordinated Sugarkube migration explicitly changes them.

Use this page as the steady-state source of truth for releasing DSPACE from GitHub Container
Registry (GHCR) artifacts into Sugarkube-managed Kubernetes environments.

## Artifact contract

- **Image workflow:** `.github/workflows/ci-image.yml` builds and publishes multi-architecture
  images to `ghcr.io/democratizedspace/dspace` on supported branches, including `main` and `v3`.
- **Image tags:** keep the existing tag shapes:
  - immutable branch/SHA tag, such as `main-REPLACE_SHORTSHA` or `v3-REPLACE_SHORTSHA`
  - mutable branch convenience tag, such as `main-latest` or `v3-latest`
  - package-version tag, currently shaped as `v<package.version>` such as `v3.0.1`
- **Chart workflow:** `.github/workflows/ci-helm.yml` packages `charts/dspace` and publishes it to
  `oci://ghcr.io/democratizedspace/charts/dspace`.
- **Chart version:** confirm the chart version in `charts/dspace/Chart.yaml` and, when needed, the
  matching publish workflow run before deploying.

Use immutable branch/SHA image tags for staging validation, production promotion, and rollback.
Mutable branch tags are convenient for discovery, but they are not the preferred audit trail for a
signed-off release.

## Release checklist

1. Open the **Build and publish GHCR image** (`ci-image.yml`) workflow run for the desired commit
   and branch.
2. Confirm the workflow succeeded, including the image push job and smoke validation.
3. Copy the immutable image tag printed in the workflow summary or shown in GHCR, for example
   `main-REPLACE_SHORTSHA` or `v3-REPLACE_SHORTSHA`.
4. Confirm the chart version in `charts/dspace/Chart.yaml` and/or the **Publish Helm chart**
   (`ci-helm.yml`) workflow run.
5. Deploy staging from the Sugarkube checkout:

   ```bash
   cd ~/sugarkube
   just dspace-oci-deploy env=staging tag=main-REPLACE_SHORTSHA
   ```

   Use the branch prefix that matches the workflow run when needed:

   ```bash
   just dspace-oci-deploy env=staging tag=v3-REPLACE_SHORTSHA
   ```

6. Validate staging with the commands below.
7. Promote production from Sugarkube after staging sign-off. The existing compatibility recipe
   accepts a release-style tag:

   ```bash
   just dspace-oci-promote-prod tag=3.0.1
   ```

   Or promote the immutable branch/SHA tag that passed staging:

   ```bash
   just dspace-oci-promote-prod tag=main-REPLACE_SHORTSHA
   ```

8. Validate production with the commands below.

## Future generic Sugarkube commands

After Sugarkube P5 lands, app-generic recipes should be available alongside the existing DSPACE
compatibility shims. The intended generic equivalents are:

```bash
cd ~/sugarkube
just app-deploy app=dspace env=staging tag=main-REPLACE_SHORTSHA
just app-promote-prod app=dspace tag=main-REPLACE_SHORTSHA
```

Until those generic recipes exist in Sugarkube, continue using the known-good `dspace-oci-*`
commands above.

## Validation commands

Run the staging checks after the deployment rollout completes:

```bash
curl -fsS https://staging.democratized.space/config.json | jq .
curl -fsS https://staging.democratized.space/healthz | jq .
curl -fsS https://staging.democratized.space/livez | jq .
```

Run the production checks after promotion completes:

```bash
curl -fsS https://democratized.space/config.json | jq .
curl -fsS https://democratized.space/healthz | jq .
curl -fsS https://democratized.space/livez | jq .
```

If a response fails, first inspect rollout and pod status from the Sugarkube cluster context before
changing artifacts:

```bash
kubectl -n dspace rollout status deploy/dspace --timeout=180s
kubectl -n dspace get deploy,po,svc,ingress
```

## Rollback

Rollback is artifact-first: redeploy the prior known-good immutable tag.

```bash
cd ~/sugarkube
just dspace-oci-deploy env=staging tag=main-PREVIOUS_SHORTSHA
```

For production rollback, use the same prior immutable tag with the production promotion recipe:

```bash
just dspace-oci-promote-prod tag=main-PREVIOUS_SHORTSHA
```

After rollback, rerun the relevant staging or production validation commands from this runbook.

## Cloudflare routing and DNS

Keep Cloudflare route, tunnel, DNS, and load-balancer setup separate from Helm deployment. The Helm
release should assume that the target hostname is already routed to the cluster ingress. If route or
DNS setup needs repair, use the Cloudflare and Sugarkube infrastructure runbooks first, then return
to this release runbook for app deployment.

## Local Docker builds

Local Docker builds are for local development, debugging, and CI smoke coverage only. They are not
the normal Sugarkube staging or production release path. Staging and production should consume the
GHCR image and Helm chart artifacts published by the workflows described above.
