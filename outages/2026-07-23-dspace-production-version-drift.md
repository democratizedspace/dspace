# Outage: DSPACE production release-artifact drift

## Incident metadata

- **Date**: 2026-07-23
- **Severity**: high
- **Status**: Resolved
- **Component**: DSPACE production release artifacts, container image tags, Helm chart publication, and deployment verification
- **Incident ID**: `2026-07-23-dspace-production-version-drift`

## Summary

On July 23, 2026, manual operator inspection found that `democratized.space` was serving later 3.1-era frontend and changelog content while runtime version surfaces still identified the deployment as DSPACE v3.0.1. The application footer showed `prod v3.0.1`, `/healthz` reported `version: "v3.0.1"` and `env: "prod"`, and `/livez` reported `version: "v3.0.1"` and `env: "prod"`.

The service remained available, and no data loss, saved-game corruption, credential exposure, privacy incident, or security compromise was detected. The incident was nevertheless high severity because production served content that did not correspond to the expected release source while health checks and the footer presented the expected semantic version. That mismatch could mislead users about which release was deployed and could mislead operators because readiness and liveness remained healthy.

The primary cause was release-artifact mutability. The DSPACE image workflow published both immutable branch-SHA image tags and the semantic `v<package-version>` image tag from ordinary eligible branch builds. Because the package version remained `3.0.1` while later main-branch changes accumulated, later source revisions could be published under `v3.0.1`. Production used `v3.0.1` with `image.pullPolicy=Always`, so a pod replacement could pull different source content without any change to the declared production image tag or package version.

During recovery, a separate artifact-integrity problem was discovered: the published OCI chart identified as `dspace:3.0.1` did not match the chart source at the canonical `v3.0.1` Git tag. That chart mismatch complicated an attempted Helm-based immutable-image correction, but it is documented as a recovery complication rather than the primary source of the user-visible frontend drift.

## Impact

- Production served later 3.1-era frontend/changelog content while runtime version surfaces still reported v3.0.1.
- The service remained available throughout the confirmed incident window.
- No data loss, saved-game corruption, credential exposure, privacy incident, or security compromise was detected.
- The mismatch could mislead users and operators about which source revision was actually running.
- Existing readiness and liveness checks continued to pass, so the incident was not visible through the normal health endpoints.
- The exact beginning of user impact is unknown. The first confirmed user-visible impact was the July 23 manual observation shortly before 16:02 PDT.
- Affected pods observed before immutable-image recovery had July 7 start times, but the pre-recovery image digest and public response body were not preserved. This record therefore does not claim that impact definitively began on July 7.

## Detection

Detection was manual visual inspection, not an alert or automated release-integrity check. The operator observed production serving later 3.1-era frontend/changelog content while the footer, `/healthz`, and `/livez` still reported v3.0.1. The exact detection minute was not captured, but detection occurred shortly before the first rollback completed at 16:02 PDT on July 23, 2026.

Readiness and liveness checks helped confirm that the service was available during recovery, but they were insufficient for source-integrity verification because they reported the package version rather than the expected Git revision or immutable image identity.

## Timeline

| Time (PDT) | Time (UTC) | Event |
| --- | --- | --- |
| 2026-05-21 10:25:23 | 2026-05-21 17:25:23 | Commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d` was created and became the canonical `v3.0.1` tag target. The corresponding immutable branch-SHA image tag was `main-1a31a56`. |
| 2026-05-21 10:49:01 | 2026-05-21 17:49:01 | Production Helm revision 7 deployed chart `dspace-3.0.1` with stored image tag `v3.0.1`. |
| Shortly before 2026-07-23 16:02 | Shortly before 2026-07-23 23:02 | Operator detected production serving later 3.1-era frontend/changelog content while runtime version surfaces still said v3.0.1. The exact detection timestamp and exact impact start are unknown. |
| 2026-07-23 16:02:32 | 2026-07-23 23:02:32 | Helm rollback to revision 7 completed and created revision 8. Helm reported success, but the release still used chart `dspace-3.0.1` and image tag `v3.0.1`. No meaningful pod-template image change occurred because the same mutable tag remained configured, and incorrect frontend content persisted. |
| Shortly after rollback | Shortly after rollback | A controlled Helm upgrade attempted to retain chart `3.0.1` while setting image tag `main-1a31a56` with `--reuse-values`. It failed during rendering with `template: dspace/templates/servicemonitor.yaml:1:14: executing "dspace/templates/servicemonitor.yaml" at <.Values.serviceMonitor.enabled>: nil pointer evaluating interface {}.enabled`. No production change occurred from this failed Helm command. |
| 2026-07-23 16:12:53 | 2026-07-23 23:12:53 | First replacement pod using `main-1a31a56` was created. |
| 2026-07-23 16:13:15 | 2026-07-23 23:13:15 | First replacement container started. |
| 2026-07-23 16:13:27 | 2026-07-23 23:13:27 | Second replacement pod was created. |
| 2026-07-23 16:13:28 | 2026-07-23 23:13:28 | Second replacement container started. Both replicas were running the immutable recovery image. Treat user impact as ended by this point. |
| 2026-07-23 16:39:19 | 2026-07-23 23:39:19 | Sugarkube PR #2320 merged and changed the production image pin to `main-1a31a56`. |
| 2026-07-23 16:41:32 | 2026-07-23 23:41:32 | Operational closeout confirmed the Git pin, live image, chart, replicas, and public health. |
| 2026-07-23 16:54:55 | 2026-07-23 23:54:55 | Operator began private evidence collection. |

## Technical root cause

### Primary image-tag mutability cause

The primary root cause was release-artifact mutability in the production image coordinate:

- The canonical DSPACE v3.0.1 Git tag resolves to commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d`.
- The immutable short-SHA image tag for that commit is `main-1a31a56`.
- The image workflow derived branch-SHA tags as `<branch>-<short-sha>`.
- The same workflow also derived `v<package-version>` and published it on ordinary eligible branch builds.
- Until the 3.1.0 coordinate change merged, the package version remained `3.0.1`, so later successful branch builds could repoint the semantic `v3.0.1` image tag even though the source revision had changed.
- Production was configured with chart `dspace-3.0.1`, stored Helm image tag `v3.0.1`, and image pull policy `Always`.
- A recreated or restarted pod could therefore pull different source content under the same declared production image tag.
- The footer and health surfaces continued to say v3.0.1 because they reflected the package/build version, not proof that the running source matched the release commit.

The exact GitHub Actions run that last moved `v3.0.1`, the previous digest, and the final mutable digest were not captured because the operator's GitHub CLI token lacked `read:packages`. This record does not invent those missing details. The supported conclusion is that the workflow made semantic-tag movement possible, and the production behavior demonstrated that the semantic tag was not a safe immutable deployment coordinate.

### Published chart mismatch discovered during recovery

A separate artifact-integrity problem was discovered during recovery. This is documented as a recovery complication, not as the primary source of the user-visible frontend drift.

Verified chart facts:

- The currently published OCI chart `dspace:3.0.1` had digest `sha256:fa10fef00cebf6f1e7cb46c38146552eb8418646f6060493127cc5554b990175`.
- The published chart's source content did not match the canonical chart source at Git tag `v3.0.1`.
- At Git tag `v3.0.1`, `charts/dspace/values.yaml` did not contain the `metrics` or `serviceMonitor` sections, and `charts/dspace/templates/servicemonitor.yaml` did not exist.
- In the published OCI chart `3.0.1`, `values.yaml` contained later `metrics` and `serviceMonitor` defaults, and `templates/servicemonitor.yaml` contained the authenticated ServiceMonitor implementation introduced later.
- The material artifact differences included a `metrics` block, a `serviceMonitor` block, and the complete `templates/servicemonitor.yaml`.

This proves the published chart version `3.0.1` does not correspond to the source tree at the `v3.0.1` Git tag. The precise overwrite time or workflow run was not captured. The evidence supports characterizing this as an immutable-version contract violation: an OCI chart identified as `3.0.1` was published from source content later than the canonical `v3.0.1` tag, or was subsequently replaced with such content.

### Helm-render evidence nuance

The recovery evidence should be interpreted narrowly:

1. The actual production `helm upgrade --reuse-values` command failed in the live recovery path with the `serviceMonitor.enabled` nil-pointer rendering error shown in the timeline.
2. Later standalone `helm template` commands using exported current user values and exported computed values both succeeded.
3. The exported user/all values did not show top-level `metrics` or `serviceMonitor` keys, but standalone rendering still applied the published chart's defaults.

Therefore the exact Helm value-merging path that produced the live `--reuse-values` nil pointer was not fully reproduced offline. This record does not claim that every render of chart `3.0.1` fails and does not claim the chart is unconditionally unusable. The confirmed facts are that the actual recovery upgrade failed in the `--reuse-values` path, the published artifact materially differs from the `v3.0.1` Git tag, and the exact `--reuse-values` merge behavior remains a follow-up investigation.

## Contributing factors

- Production used a semantic image tag as though it were immutable.
- The image workflow republished semantic version tags from branch builds.
- `image.pullPolicy=Always` increased the chance that a pod replacement would pull changed content under the same tag.
- Health and footer version surfaces did not expose or validate the expected Git revision.
- No deployment gate compared the running image digest or source revision with the approved release commit.
- Helm rollback reused the same semantic tag, so Helm could report success without restoring an earlier image digest.
- The production Git pin was stale before recovery: `docs/apps/dspace.prod.tag` contained `v3.0.0`, so the production Helm release was not fully represented by the repository's production pin.
- The chart artifact identified as `3.0.1` did not match the `v3.0.1` source tag and complicated the immutable-image correction.
- There was no automated alert for frontend build/release-coordinate drift.
- Detection depended on manual visual review.

## Recovery and resolution

The Helm rollback alone did not restore the intended source artifact because it retained the mutable `v3.0.1` tag. The operator then performed an emergency image-only correction on the live Deployment to use `ghcr.io/democratizedspace/dspace:main-1a31a56`.

The rollout created two new pods. Both recovered pods used:

- Declared image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- Resolved image ID: `ghcr.io/democratizedspace/dspace@sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`

Both pods were ready with zero restarts. User impact is treated as ended by 2026-07-23 16:13:28 PDT / 23:13:28 UTC, when the second replacement container started and both replicas were running the immutable recovery image.

Sugarkube PR #2320 made the immutable image coordinate durable by changing the production image pin to `main-1a31a56`. After recovery:

- Git production image pin: `main-1a31a56`
- Live Deployment image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- Helm chart: `dspace-3.0.1`
- Helm stored image value: `v3.0.1`
- Replicas: 2 available
- `/healthz`: ready, v3.0.1, prod
- `/livez`: alive, v3.0.1, prod

## Post-recovery verification

Public and direct Kubernetes Service responses were compared after recovery. Public root markers were:

- `Latest update: April 1, 2026`
- `prod v3.0.1`
- `DSPACE v3.0.1`

Direct-origin root markers were identical.

Post-recovery hash comparisons:

| Surface | Public SHA-256 | Direct-origin SHA-256 | Result |
| --- | --- | --- | --- |
| Root | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | Match |
| Changelog | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | Match |
| Docs changelog | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | Match |
| `/config.json` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | Match |

Cloudflare response evidence after recovery showed `cache-control: no-store` and `cf-cache-status: DYNAMIC`. This record does not attribute the incident or any post-recovery discrepancy to Cloudflare caching. `/healthz` and `/livez` hashes differed between public and origin requests because those responses contain changing uptime and timestamp fields; that difference was not treated as anomalous.

## What went well

- The service stayed available.
- Health and liveness endpoints helped confirm availability during recovery, even though they were insufficient for source-integrity verification.
- The canonical v3.0.1 Git commit was identifiable.
- The workflow's branch-SHA naming convention made the correct immutable recovery tag derivable.
- The emergency image-only rollout created fresh pods and restored correct content quickly.
- Public and direct-origin comparisons verified the recovery was not masked by Cloudflare.
- The production Git pin was corrected and merged in the same incident window.
- Evidence was captured immediately after recovery.

## What went poorly

- The initial Helm rollback appeared successful but did not restore the intended image content.
- Semantic version and source revision were conflated.
- The operator could not determine the currently moved package-tag digest through the GitHub packages API because the token lacked `read:packages`.
- The attempted Helm reconciliation failed because of the later chart content under version `3.0.1` and the live `--reuse-values` path.
- Helm stored values remained stale after the emergency Deployment correction.
- No pre-recovery image digest or response-body hash was preserved.
- The exact impact start and exact workflow run that moved the semantic tag remain unknown.

## Current residual risk

Incident status is resolved, and current live production user impact is over. The live Deployment and Git pin agree on `main-1a31a56`.

Residual operational risk remains because Helm revision 8 still stores `image.tag=v3.0.1`. The live Deployment was corrected outside Helm, so Helm and live state remain intentionally drifted. DSPACE production Helm operations should remain frozen until a controlled reconciliation is performed using a newly published, never-overwritten chart version and the immutable image tag. This record does not recommend editing Helm revision history directly.

## Corrective actions

| Priority | Owner area | Status | Action | Completion condition |
| --- | --- | --- | --- | --- |
| P0 | Production operations | Completed | Restore production to immutable image `main-1a31a56`. | Live Deployment image is `ghcr.io/democratizedspace/dspace:main-1a31a56`. |
| P0 | Production operations | Completed | Verify both replicas use image digest `sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`. | Both recovered pods report the expected resolved image ID, are ready, and have zero restarts. |
| P0 | Sugarkube production configuration | Completed | Pin Sugarkube production to `main-1a31a56` through PR #2320. | PR #2320 is merged with production pin `main-1a31a56`. |
| P0 | Production verification | Completed | Compare public and direct-origin content after recovery. | Root, changelog, docs changelog, and `/config.json` public/origin hashes match. |
| P0 | DSPACE image publishing | Open | Change `.github/workflows/ci-image.yml` so semantic `vX.Y.Z` tags are published only from the matching Git tag or release event, never ordinary branch pushes. | Branch builds cannot publish semantic version tags; release/tag builds are the only semantic-tag publishers. |
| P0 | DSPACE image publishing | Open | Add a guard that refuses to overwrite an already published semantic image tag. | CI fails before publishing when a semantic tag already exists with a different digest. |
| P0 | Release operations | Open | Keep branch-SHA images as the authoritative staging, production, rollback, and promotion coordinates. | Runbooks, deployment pins, and release gates use immutable branch-SHA or digest coordinates for environments. |
| P0 | DSPACE chart publishing | Open | Change `.github/workflows/ci-helm.yml` so an existing OCI chart version can never be replaced. | Chart publishing fails when the target chart version already exists. |
| P0 | DSPACE chart publishing | Open | Publish any chart repair under a new version; do not republish `3.0.1`. | Repair chart is available only as a new version and `3.0.1` is not overwritten. |
| P0 | Release engineering | Open | Add a release consistency gate proving Git tag, package version, chart version, chart appVersion, image OCI revision label, and approved source commit agree. | Release promotion blocks unless all coordinates resolve to the same approved source revision. |
| P0 | Production operations | Open | Reconcile production Helm state in a controlled maintenance operation so Git, Helm stored values, the live Deployment, and the resolved image digest all agree on the immutable image. | Helm stored image tag, live Deployment image, Git pin, and resolved digest agree after a planned reconciliation. |
| P0 | Sugarkube environment configuration | Open | Introduce environment-specific Sugarkube chart pins so staging can use DSPACE chart 3.1.0 while production remains on its approved chart version. | Staging and production chart pins can advance independently without changing the other environment. |
| P1 | DSPACE application identity | Open | Expose and verify a bounded build-identity signal containing the Git revision, not only the semantic application version. | Runtime identity includes a Git revision or equivalent immutable source coordinate. |
| P1 | Production verification | Open | Require production verification to compare the running image revision/digest against the approved release commit. | Release verification fails if running image metadata does not match the approved release commit. |
| P1 | Rollback procedure | Open | Update rollback procedures to verify that pods were actually replaced and that the running image ID changed to the intended digest. | Rollback checklist includes pod replacement and image ID/digest confirmation. |
| P1 | Frontend/release verification | Open | Add a deterministic frontend content/build marker check so release-content drift is caught even when `/healthz` and `/livez` remain healthy. | Monitoring or release checks compare a deterministic build marker against the approved release. |
| P1 | Observability | Open | Add monitoring or alerting for unexpected production build-revision drift. | Operators receive an alert when production source identity differs from the approved coordinate. |
| P1 | Incident readiness | Open | Ensure incident operators can retrieve package-version metadata or have another documented method to record semantic-tag and immutable-tag digests at deployment time. | Operators can capture semantic-tag and immutable-tag digests during deployment or incident response without missing package permissions. |

## Evidence gaps and unknowns

- The exact beginning of user impact is unknown.
- The exact detection minute was not captured; detection occurred shortly before 16:02 PDT on July 23, 2026.
- The pre-recovery image digest was not preserved.
- The pre-recovery public response body and response-body hashes were not preserved.
- The exact GitHub Actions run that last moved `v3.0.1` was not captured.
- The previous digest and final mutable digest for the moved semantic `v3.0.1` image tag were not captured because the operator's GitHub CLI token lacked `read:packages`.
- The precise publish or overwrite time for the mismatched OCI chart `dspace:3.0.1` was not captured.
- The exact Helm `--reuse-values` merge behavior that produced the live nil-pointer render failure was not fully reproduced offline.
- The staging DSPACE 3.1.0 observability rollout occurred in a separate staging cluster; this record does not claim that staging directly changed production.

## Verification commands or evidence references

Repository and public references relevant to this record:

- `.github/workflows/ci-image.yml`
- `.github/workflows/ci-helm.yml`
- `charts/dspace/Chart.yaml`
- `charts/dspace/values.yaml`
- `charts/dspace/templates/servicemonitor.yaml`
- `package.json`
- `https://github.com/democratizedspace/dspace/releases/tag/v3.0.1`
- `https://github.com/democratizedspace/dspace/commit/1a31a569aff2dbeb238e8c2688b9e85140d2077d`
- `https://github.com/democratizedspace/dspace/pull/4718`
- `https://github.com/democratizedspace/dspace/pull/4719`
- `https://github.com/futuroptimist/sugarkube/pull/2320`
- `outages/2026-07-23-dspace-production-version-drift.json`

Validation for this documentation-only change should include the outage convention tests, schema validation through the existing test suite, link checking, linting, type-checking, build, CI tests, diff whitespace checks, diff stat review, and secret scanning. No runtime code, charts, workflows, packages, release metadata, deployment configuration, external repositories, screenshots, archives, or binary evidence files are modified by this record.
