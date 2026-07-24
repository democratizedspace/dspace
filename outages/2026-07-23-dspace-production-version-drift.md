# Outage: DSPACE production release-artifact drift

## Incident metadata

- **Date**: 2026-07-23
- **Severity**: high
- **Status**: Resolved
- **Component**: production release artifacts and deployment image/chart coordinates
- **Incident ID**: `2026-07-23-dspace-production-version-drift`

## Summary

On July 23, 2026, manual operator inspection found that `democratized.space` was serving later
3.1-era frontend/changelog content while runtime version surfaces still identified production as
DSPACE v3.0.1. The application footer showed `prod v3.0.1`, `/healthz` reported
`version: "v3.0.1"` and `env: "prod"`, and `/livez` reported `version: "v3.0.1"` and
`env: "prod"`.

The service remained available. No data loss, saved-game corruption, credential exposure, privacy
incident, or security compromise was detected. The incident is resolved because the live Deployment
and production Git pin now agree on the immutable recovery image `main-1a31a56`. Residual Helm-state
and release-artifact publication risks remain open follow-up work.

The primary root cause was release-artifact mutability: the image workflow allowed ordinary branch
builds to publish the semantic `v<package-version>` image tag. Because the package version remained
`3.0.1` while later main-branch source changes accumulated, later source content could be made
available under `v3.0.1`. Production referenced `v3.0.1` with `image.pullPolicy=Always`, so a
recreated or restarted pod could pull different source content without any declared production tag or
package-version change.

During recovery, operators also discovered a separate artifact-integrity issue: the published OCI
Helm chart identified as `dspace:3.0.1` did not match the canonical chart source at the DSPACE
`v3.0.1` Git tag. That chart mismatch complicated a controlled Helm-based correction, but it is
recorded separately from the primary image-tag mutability cause of the user-visible frontend drift.

## Impact

- Production served later 3.1-era frontend/changelog content while runtime footer and health
  endpoints still identified the deployment as v3.0.1.
- Users could be misled about which DSPACE release was deployed.
- Operators could be misled because readiness/liveness checks stayed healthy and reported the
  expected semantic version.
- The service remained available throughout the observed incident.
- No data loss, saved-game corruption, credential exposure, privacy incident, or security compromise
  was detected.
- The exact beginning of user impact is unknown. Affected pods observed before immutable-image
  recovery had July 7 start times, but the pre-recovery image digest and public response body were
  not preserved, so this report does not claim that impact definitively began on July 7.
- The first confirmed user-visible impact was the July 23 manual observation.
- The staging DSPACE 3.1.0 observability rollout occurred in a separate staging cluster and is not
  treated as a direct production change.

## Detection

Detection was manual visual inspection, not an alert or automated release-integrity check. Existing
readiness and liveness checks continued to pass. Existing version surfaces reported the package
version rather than the source commit, immutable image revision, or resolved image digest.

The exact detection minute was not captured. Detection occurred shortly before the first rollback at
2026-07-23 16:02 PDT.

## Timeline

| Time (PDT) | Time (UTC) | Event |
| --- | --- | --- |
| 2026-05-21 10:25:23 | 2026-05-21 17:25:23 | Commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d` was created and became the `v3.0.1` tag target. The corresponding immutable branch-SHA image tag was `main-1a31a56`. |
| 2026-05-21 10:49:01 | 2026-05-21 17:49:01 | Production Helm revision 7 deployed chart `dspace-3.0.1` with stored image tag `v3.0.1`. |
| Shortly before 2026-07-23 16:02 | Shortly before 2026-07-23 23:02 | Operator detected production serving later 3.1-era frontend/changelog content while runtime version surfaces still said v3.0.1. Exact detection timestamp and exact impact start are unknown. |
| 2026-07-23 16:02:32 | 2026-07-23 23:02:32 | Helm rollback to revision 7 completed and created revision 8. Helm reported success, but the release still used chart `dspace-3.0.1` and image tag `v3.0.1`. No meaningful pod-template image change occurred because the same mutable tag remained configured, and incorrect frontend content persisted. |
| Shortly after rollback | Shortly after rollback | A controlled Helm upgrade attempted to retain chart `3.0.1` while setting image tag `main-1a31a56` with `--reuse-values`. Rendering failed with `template: dspace/templates/servicemonitor.yaml:1:14: executing "dspace/templates/servicemonitor.yaml" at <.Values.serviceMonitor.enabled>: nil pointer evaluating interface {}.enabled`. No production change occurred from this failed Helm command. |
| 2026-07-23 16:12:53 | 2026-07-23 23:12:53 | First replacement pod using `main-1a31a56` was created. |
| 2026-07-23 16:13:15 | 2026-07-23 23:13:15 | First replacement container started. |
| 2026-07-23 16:13:27 | 2026-07-23 23:13:27 | Second replacement pod using `main-1a31a56` was created. |
| 2026-07-23 16:13:28 | 2026-07-23 23:13:28 | Second replacement container started. Both replicas were running the immutable recovery image. Treat user impact as ended by this point. |
| 2026-07-23 16:39:19 | 2026-07-23 23:39:19 | Sugarkube PR #2320 merged and changed the production image pin to `main-1a31a56`. |
| 2026-07-23 16:41:32 | 2026-07-23 23:41:32 | Operational closeout confirmed the Git pin, live image, chart, replicas, and public health. |
| 2026-07-23 16:54:55 | 2026-07-23 23:54:55 | Operator began private evidence collection. |

## Technical root cause

### Primary image-tag mutability cause

The primary root cause was release-artifact mutability.

Verified and supported facts:

- The canonical DSPACE v3.0.1 Git tag resolves to commit
  `1a31a569aff2dbeb238e8c2688b9e85140d2077d`.
- The immutable short-SHA image tag for that commit is `main-1a31a56`.
- The DSPACE image workflow derives branch-SHA tags as `<branch>-<short-sha>`.
- The same workflow also derived `v<package-version>` and published it on ordinary eligible branch
  builds.
- Until the 3.1.0 coordinate change merged, the package version remained `3.0.1`, so later
  successful branch builds could repoint the semantic `v3.0.1` image tag even though the source
  revision had changed.
- Production was configured with chart `dspace-3.0.1`, stored Helm image tag `v3.0.1`, and image
  pull policy `Always`.
- A recreated or restarted pod could therefore pull changed source content under the same declared
  semantic tag.
- Footer and health version surfaces continued to say v3.0.1 because they reflected the package or
  build version rather than proving the expected release source commit or immutable image revision.

The exact GitHub Actions run that last moved `v3.0.1`, its previous digest, and its final mutable
digest were not captured because the operator's GitHub CLI token lacked `read:packages`. This report
therefore does not invent the missing workflow run or digest. The workflow made semantic-tag movement
possible, and the production behavior demonstrated that the semantic tag was not a safe immutable
deployment coordinate.

### Published chart mismatch discovered during recovery

A separate artifact-integrity problem was discovered during recovery and complicated Helm-based
correction. It is not recorded as the primary source of the user-visible frontend drift.

Verified facts:

- The currently published OCI chart `dspace:3.0.1` had digest
  `sha256:fa10fef00cebf6f1e7cb46c38146552eb8418646f6060493127cc5554b990175`.
- The published chart's source content did not match the canonical chart source at Git tag
  `v3.0.1`.
- At Git tag `v3.0.1`, `charts/dspace/values.yaml` did not contain the `metrics` or
  `serviceMonitor` sections.
- At Git tag `v3.0.1`, `charts/dspace/templates/servicemonitor.yaml` did not exist.
- In the published OCI chart `3.0.1`, `values.yaml` contained later `metrics` and
  `serviceMonitor` defaults.
- In the published OCI chart `3.0.1`, `templates/servicemonitor.yaml` contained the authenticated
  ServiceMonitor implementation introduced later.
- The material artifact differences included a `metrics` block, a `serviceMonitor` block, and the
  complete `templates/servicemonitor.yaml` file.

This proves the published chart version `3.0.1` does not correspond to the source tree at the
`v3.0.1` Git tag. The safe characterization is an immutable-version contract violation: an OCI chart
identified as `3.0.1` was published from source content later than the canonical v3.0.1 tag, or was
subsequently replaced with such content. The exact overwrite or publish time and workflow run were
not captured.

### Helm-render evidence nuance

The real production `helm upgrade --reuse-values` command failed during recovery in the
`--reuse-values` path with the ServiceMonitor nil-pointer error recorded in the timeline. Later
standalone `helm template` commands using exported current user values and exported computed values
both succeeded. The exported user/all values did not show top-level `metrics` or `serviceMonitor`
keys, but standalone rendering still applied the published chart's defaults.

Therefore, the exact Helm value-merging path that produced the live `--reuse-values` nil pointer was
not fully reproduced offline. This report does not claim that every render of chart `3.0.1` fails and
does not claim the chart is unconditionally unusable. It records only that the actual recovery
upgrade failed in the `--reuse-values` path, the published artifact materially differs from the
`v3.0.1` Git tag, and the exact `--reuse-values` merge behavior remains a follow-up investigation.

## Contributing factors

- Production used a semantic image tag as though it were immutable.
- The image workflow republished semantic version tags from branch builds.
- `image.pullPolicy=Always` increased the chance that a pod replacement would pull changed content
  under the same tag.
- Health and footer version surfaces did not expose or validate the expected Git revision.
- No deployment gate compared the running image digest or source revision with the approved release
  commit.
- Helm rollback reused the same semantic tag, so Helm could report success without restoring an
  earlier image digest.
- The production Git pin was stale before recovery: `docs/apps/dspace.prod.tag` contained `v3.0.0`,
  so the repository's production pin did not fully represent the live Helm release.
- The chart artifact identified as `3.0.1` did not match the v3.0.1 source tag and complicated the
  immutable-image correction.
- There was no automated alert for frontend build/release-coordinate drift.
- Detection depended on manual visual review.

## Recovery and resolution

The Helm rollback alone did not restore the intended source artifact because it retained the mutable
`v3.0.1` tag. A subsequent controlled Helm upgrade attempt with `--reuse-values` failed during
rendering before changing production.

The operator then performed an emergency image-only correction on the live Deployment to:

```text
ghcr.io/democratizedspace/dspace:main-1a31a56
```

The rollout created two new pods. Both recovered pods used:

- declared image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- resolved image ID:
  `ghcr.io/democratizedspace/dspace@sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`

Both pods were ready with zero restarts. By 2026-07-23 16:13:28 PDT / 23:13:28 UTC, both replicas
were running the immutable recovery image, and user impact is treated as ended.

Sugarkube PR #2320 made the immutable image coordinate durable with merge commit
`61303e079e425808eb25f30d3be07e93ccdf6a37`.

After recovery:

- Git production image pin: `main-1a31a56`
- Live Deployment image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- Helm chart: `dspace-3.0.1`
- Helm stored image value: `v3.0.1`
- Replicas: 2 available
- `/healthz`: ready, v3.0.1, prod
- `/livez`: alive, v3.0.1, prod

## Post-recovery verification

Public and direct Kubernetes Service responses were compared after recovery.

Root page markers matched between public and direct-origin responses:

- `Latest update: April 1, 2026`
- `prod v3.0.1`
- `DSPACE v3.0.1`

Response hashes also matched:

| Resource | Public SHA-256 | Direct-origin SHA-256 |
| --- | --- | --- |
| Root page | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` |
| Changelog | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` |
| Docs changelog | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` |
| `/config.json` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` |

Cloudflare response evidence after recovery included `cache-control: no-store` and
`cf-cache-status: DYNAMIC`. The incident and post-recovery verification are not attributed to
Cloudflare caching. `/healthz` and `/livez` public/origin hashes differed because those responses
contain changing uptime and timestamp fields, so those hash differences were not treated as an
anomaly.

## What went well

- The service stayed available.
- Health and liveness endpoints helped confirm availability during recovery, even though they were
  insufficient for source-integrity verification.
- The canonical v3.0.1 Git commit was identifiable.
- The workflow's branch-SHA naming convention made the correct immutable recovery tag derivable.
- The emergency image-only rollout created fresh pods and restored correct content quickly.
- Public and direct-origin comparisons verified the recovery was not masked by Cloudflare.
- The production Git pin was corrected and merged in the same incident window.
- Evidence was captured immediately after recovery.

## What went poorly

- The initial Helm rollback appeared successful but did not restore the intended image content.
- Semantic version and source revision were conflated.
- The operator could not determine the currently moved package-tag digest through the GitHub packages
  API because the token lacked `read:packages`.
- The attempted Helm reconciliation failed because of the later chart content under version `3.0.1`
  and the live `--reuse-values` path.
- Helm stored values remained stale after the emergency Deployment correction.
- No pre-recovery image digest or response-body hash was preserved.
- The exact impact start and exact workflow run that moved the semantic tag remain unknown.

## Current residual risk

Incident status is **Resolved**. Current live Deployment and Git pin agree on `main-1a31a56`, and no
current user impact is claimed.

However, Helm revision 8 still stores `image.tag=v3.0.1`. The live Deployment was corrected outside
Helm, so Helm and live state remain intentionally drifted. DSPACE production Helm operations should
remain frozen until a controlled reconciliation is performed using a newly published,
never-overwritten chart version and the immutable image tag. This report does not recommend editing
Helm revision history directly.

## Corrective actions

| Priority | Owner area | Status | Completion condition |
| --- | --- | --- | --- |
| Completed | Production operations | Completed | Production restored to immutable image `main-1a31a56`. |
| Completed | Production operations | Completed | Both replicas verified using image digest `sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`. |
| Completed | Sugarkube deployment metadata | Completed | Sugarkube production pin changed to `main-1a31a56` through PR #2320. |
| Completed | Production verification | Completed | Public and direct-origin content compared after recovery. |
| P0 | DSPACE image release workflow | Open | Change `.github/workflows/ci-image.yml` so semantic `vX.Y.Z` tags are published only from the matching Git tag or release event, never ordinary branch pushes. |
| P0 | DSPACE image release workflow | Open | Add a guard that refuses to overwrite an already published semantic image tag. |
| P0 | Release/deployment policy | Open | Keep branch-SHA images as the authoritative staging, production, rollback, and promotion coordinates. |
| P0 | DSPACE Helm release workflow | Open | Change `.github/workflows/ci-helm.yml` so an existing OCI chart version can never be replaced. |
| P0 | DSPACE Helm release workflow | Open | Publish any chart repair under a new version; do not republish `3.0.1`. |
| P0 | Release integrity | Open | Add a release consistency gate proving Git tag, package version, chart version, chart `appVersion`, image OCI revision label, and approved source commit agree. |
| P0 | Production operations | Open | Reconcile production Helm state in a controlled maintenance operation so Git, Helm stored values, live Deployment, and resolved image digest all agree on the immutable image. |
| P0 | Sugarkube environment configuration | Open | Introduce environment-specific Sugarkube chart pins so staging can use DSPACE chart 3.1.0 while production remains on its approved chart version. |
| P1 | Runtime build identity | Open | Expose and verify a bounded build-identity signal containing the Git revision, not only the semantic application version. |
| P1 | Production verification | Open | Require production verification to compare the running image revision/digest against the approved release commit. |
| P1 | Rollback procedure | Open | Update rollback procedures to verify that pods were actually replaced and that the running image ID changed to the intended digest. |
| P1 | Frontend release verification | Open | Add a deterministic frontend content/build marker check so release-content drift is caught even when `/healthz` and `/livez` remain healthy. |
| P1 | Monitoring | Open | Add monitoring or alerting for unexpected production build-revision drift. |
| P1 | Incident tooling | Open | Ensure incident operators can retrieve package-version metadata or have another documented method to record semantic-tag and immutable-tag digests at deployment time. |

## Evidence gaps and unknowns

- The exact impact start is unknown.
- The exact detection minute is unknown; detection occurred shortly before 2026-07-23 16:02 PDT.
- Affected pods observed before immutable-image recovery had July 7 start times, but that does not
  prove user impact began on July 7.
- The pre-recovery image digest was not preserved.
- The pre-recovery public response body and response-body hash were not preserved.
- The exact GitHub Actions run that last moved the semantic `v3.0.1` image tag is unknown.
- The previous and final digests of the moved semantic `v3.0.1` image tag were not captured because
  the operator's GitHub CLI token lacked `read:packages`.
- The exact time and workflow run that produced or replaced the published OCI chart `dspace:3.0.1`
  were not captured.
- The exact Helm `--reuse-values` value-merging path that produced the live nil-pointer render
  failure was not fully reproduced offline.

## Verification commands or evidence references

Repository and public references used for the incident record:

- `.github/workflows/ci-image.yml`
- `.github/workflows/ci-helm.yml`
- `charts/dspace/Chart.yaml`
- `charts/dspace/values.yaml`
- `charts/dspace/templates/servicemonitor.yaml`
- `package.json`
- DSPACE v3.0.1 release: <https://github.com/democratizedspace/dspace/releases/tag/v3.0.1>
- Canonical v3.0.1 commit:
  <https://github.com/democratizedspace/dspace/commit/1a31a569aff2dbeb238e8c2688b9e85140d2077d>
- DSPACE PR #4718: <https://github.com/democratizedspace/dspace/pull/4718>
- DSPACE PR #4719: <https://github.com/democratizedspace/dspace/pull/4719>
- Sugarkube PR #2320: <https://github.com/futuroptimist/sugarkube/pull/2320>

Validation commands for this documentation-only change are recorded in the pull request summary and
final agent report.
