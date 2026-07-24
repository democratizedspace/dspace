# Outage: DSPACE production release-artifact drift

## Incident metadata

- **Date**: 2026-07-23
- **Severity**: high
- **Status**: Resolved
- **Component**: DSPACE production release artifact integrity, container image publishing, Helm chart publishing, and deployment verification
- **Incident ID**: `2026-07-23-dspace-production-version-drift`

## Summary

On July 23, 2026, manual operator inspection found that `democratized.space` was serving later 3.1-era frontend and changelog content while runtime identity surfaces still identified production as DSPACE v3.0.1. The footer showed `prod v3.0.1`, `/healthz` reported `version: "v3.0.1"` and `env: "prod"`, and `/livez` reported `version: "v3.0.1"` and `env: "prod"`.

The service remained available, and no data loss, saved-game corruption, credential exposure, privacy incident, or security compromise was detected. The user-visible risk was release-identity drift: users and operators could be misled about which release was actually running because health checks stayed healthy and continued to report the expected semantic version.

The primary root cause was release-artifact mutability. The image workflow published an immutable branch-SHA tag and also republished the semantic `v<package-version>` tag from ordinary eligible branch builds. Because the package version remained `3.0.1` while later main-branch changes accumulated, later source revisions could be published under `v3.0.1`. Production used that semantic tag with `image.pullPolicy=Always`, so recreated or restarted pods could pull different source content without any change to the declared production tag or package version.

Recovery replaced the live Deployment image with the immutable branch-SHA image `ghcr.io/democratizedspace/dspace:main-1a31a56`, derived from the canonical DSPACE v3.0.1 commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d`. Both replicas were replaced and were running the resolved image digest `sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401` by 2026-07-23 16:13:28 PDT / 23:13:28 UTC. User impact is treated as ended by that point.

A separate artifact-integrity problem was discovered during recovery: the published OCI Helm chart identified as `dspace:3.0.1` did not match the chart source at the canonical `v3.0.1` Git tag. That mismatch complicated a controlled Helm-based correction, but it is documented as a recovery complication, not as the primary source of the frontend-content drift.

## Impact

- Production displayed later 3.1-era frontend/changelog content while version surfaces still reported DSPACE v3.0.1.
- The service remained available throughout the confirmed incident window.
- No data loss, saved-game corruption, credential exposure, privacy incident, or security compromise was detected.
- The mismatch could mislead users about which release was deployed.
- The mismatch could mislead operators because readiness, liveness, and footer version surfaces reported the expected semantic version while not proving the expected source commit or immutable image revision.
- The exact beginning of user impact is unknown. Affected pods observed before immutable-image recovery had July 7 start times, but the pre-recovery image digest and public response body were not preserved. This record therefore does not claim that impact began on July 7.
- The first confirmed user-visible impact was the July 23 manual observation.
- The staging DSPACE 3.1.0 observability rollout occurred in a separate staging cluster and is not treated as a direct production change.

## Detection

Detection was manual visual inspection, not an alert or automated release-integrity check. The exact detection minute was not captured, but detection occurred shortly before the first rollback at 2026-07-23 16:02 PDT.

Existing readiness and liveness checks continued to pass. Existing version surfaces reported the package version, not the expected Git revision, image digest, or immutable branch-SHA deployment coordinate.

## Timeline

| Time (PDT) | Time (UTC) | Event |
| --- | --- | --- |
| 2026-05-21 10:25:23 | 2026-05-21 17:25:23 | Commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d` was created and became the canonical `v3.0.1` tag target. The immutable short-SHA image coordinate for this release is `main-1a31a56`. |
| 2026-05-21 10:49:01 | 2026-05-21 17:49:01 | Production Helm revision 7 deployed chart `dspace-3.0.1` with stored image tag `v3.0.1`. |
| Shortly before 2026-07-23 16:02 | Shortly before 2026-07-23 23:02 | An operator detected production serving later 3.1-era frontend/changelog content while the footer, `/healthz`, and `/livez` still identified the runtime as v3.0.1. The exact detection timestamp and exact impact start are unknown. |
| 2026-07-23 16:02:32 | 2026-07-23 23:02:32 | Helm rollback to revision 7 completed and created revision 8. Helm reported success, but the release still used chart `dspace-3.0.1` and image tag `v3.0.1`. No meaningful pod-template image change occurred because the same mutable tag remained configured, and incorrect frontend content persisted. |
| Shortly after rollback | Shortly after rollback | A controlled Helm upgrade attempted to retain chart `3.0.1` while setting image tag `main-1a31a56` with `--reuse-values`. It failed during rendering with `template: dspace/templates/servicemonitor.yaml:1:14: executing "dspace/templates/servicemonitor.yaml" at <.Values.serviceMonitor.enabled>: nil pointer evaluating interface {}.enabled`. No production change occurred from this failed Helm command. |
| 2026-07-23 16:12:53 | 2026-07-23 23:12:53 | First replacement pod using `main-1a31a56` was created. |
| 2026-07-23 16:13:15 | 2026-07-23 23:13:15 | First replacement container started. |
| 2026-07-23 16:13:27 | 2026-07-23 23:13:27 | Second replacement pod using `main-1a31a56` was created. |
| 2026-07-23 16:13:28 | 2026-07-23 23:13:28 | Second replacement container started. Both replicas were running the immutable recovery image. User impact is treated as ended by this point. |
| 2026-07-23 16:39:19 | 2026-07-23 23:39:19 | Sugarkube PR #2320 merged and changed the production image pin to `main-1a31a56`. |
| 2026-07-23 16:41:32 | 2026-07-23 23:41:32 | Operational closeout confirmed the Git pin, live image, chart, replicas, and public health. |
| 2026-07-23 16:54:55 | 2026-07-23 23:54:55 | The operator began private evidence collection. |

## Technical root cause

### Primary image-tag mutability cause

The primary root cause was release-artifact mutability in the DSPACE image publishing and production deployment model.

Verified release coordinates:

- The canonical DSPACE v3.0.1 Git tag resolves to full commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d`.
- The immutable short-SHA image tag for that commit is `main-1a31a56`.
- The release URL is `https://github.com/democratizedspace/dspace/releases/tag/v3.0.1`.
- The commit URL is `https://github.com/democratizedspace/dspace/commit/1a31a569aff2dbeb238e8c2688b9e85140d2077d`.

Verified publishing and deployment behavior:

- `.github/workflows/ci-image.yml` derived branch-SHA image tags as `<branch>-<short-sha>`.
- The same workflow also derived and published `v<package-version>` on ordinary eligible branch builds.
- Until the 3.1.0 coordinate change merged, the package version remained `3.0.1`, so later successful branch builds could repoint the semantic `v3.0.1` image tag even when the source revision had changed.
- Production was configured with chart `dspace-3.0.1`, stored Helm image tag `v3.0.1`, and image pull policy `Always`.
- The production Git pin was stale before recovery: `docs/apps/dspace.prod.tag` contained `v3.0.0`, so the production Helm release was not fully represented by the repository production pin before the incident.

Supported conclusion:

The workflow made semantic-tag movement possible, and the observed production behavior demonstrated that `v3.0.1` was not a safe immutable deployment coordinate. A recreated or restarted pod could pull different source content under the same declared tag. Health and footer version surfaces continued to say v3.0.1 because they reflected the package/build version rather than proving the source commit expected for the release.

The exact GitHub Actions run that last moved `v3.0.1`, the previous digest, and the final mutable digest were not captured because the operator's GitHub CLI token lacked `read:packages`. This report does not invent the missing workflow run or digest.

### Published chart mismatch discovered during recovery

A separate artifact-integrity problem was discovered during recovery. It complicated the immutable-image correction but is not treated as the primary cause of the user-visible frontend drift.

Verified facts:

- The currently published OCI chart `dspace:3.0.1` had digest `sha256:fa10fef00cebf6f1e7cb46c38146552eb8418646f6060493127cc5554b990175`.
- The published chart source content did not match the canonical chart source at Git tag `v3.0.1`.
- At Git tag `v3.0.1`, `charts/dspace/values.yaml` did not contain the `metrics` or `serviceMonitor` sections.
- At Git tag `v3.0.1`, `charts/dspace/templates/servicemonitor.yaml` did not exist.
- In the published OCI chart `3.0.1`, `values.yaml` contained later `metrics` and `serviceMonitor` defaults.
- In the published OCI chart `3.0.1`, `templates/servicemonitor.yaml` contained the authenticated ServiceMonitor implementation introduced later.
- The material differences included a `metrics` block, a `serviceMonitor` block, and the complete `templates/servicemonitor.yaml`.

Supported conclusion:

The published chart version `3.0.1` does not correspond to the source tree at the canonical `v3.0.1` Git tag. This is an immutable-version contract violation: an OCI chart identified as `3.0.1` was published from source content later than the canonical v3.0.1 tag, or was subsequently replaced with such content. The exact overwrite time or workflow run was not captured and is not asserted here.

### Helm-render evidence nuance

The real production Helm recovery path failed, but the failure should not be overstated.

- The actual production `helm upgrade --reuse-values` command failed in the `servicemonitor.yaml` rendering path with a nil pointer evaluating `.Values.serviceMonitor.enabled`.
- Later standalone `helm template` commands using exported current user values and exported computed values both succeeded.
- The exported user/all values did not show top-level `metrics` or `serviceMonitor` keys, but standalone rendering still applied the published chart defaults.

Therefore, the exact Helm value-merging path that produced the live `--reuse-values` nil pointer was not fully reproduced offline. This record does not claim that every render of chart 3.0.1 fails or that chart 3.0.1 is unconditionally unusable. It records three narrower facts: the actual recovery upgrade failed in the `--reuse-values` path, the published chart artifact materially differs from the v3.0.1 Git tag, and the exact `--reuse-values` merge behavior remains a follow-up investigation.

## Contributing factors

- Production used a semantic image tag as though it were immutable.
- The image workflow republished semantic version tags from branch builds.
- `image.pullPolicy=Always` increased the chance that a pod replacement would pull changed content under the same tag.
- Health and footer version surfaces did not expose or validate the expected Git revision.
- No deployment gate compared the running image digest or source revision with the approved release commit.
- Helm rollback reused the same semantic tag, so Helm could report success without restoring an earlier image digest.
- The production Git pin was stale and did not match the live Helm release before the incident.
- The chart artifact identified as 3.0.1 did not match the v3.0.1 source tag and complicated the immutable-image correction.
- There was no automated alert for frontend build/release-coordinate drift.
- Detection depended on manual visual review.

## Recovery and resolution

The initial Helm rollback did not restore the intended source artifact because it retained the mutable `v3.0.1` image tag. The attempted controlled Helm upgrade to set `main-1a31a56` with `--reuse-values` failed during rendering and made no production change.

The operator then performed an emergency image-only correction on the live Deployment to:

```text
ghcr.io/democratizedspace/dspace:main-1a31a56
```

The rollout created two replacement pods. Both recovered pods used:

- Declared image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- Resolved image ID: `ghcr.io/democratizedspace/dspace@sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`

Both pods were ready with zero restarts. Sugarkube PR #2320 then made the immutable production image coordinate durable, merging commit `61303e079e425808eb25f30d3be07e93ccdf6a37`.

After recovery:

- Git production image pin: `main-1a31a56`
- Live Deployment image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- Helm chart: `dspace-3.0.1`
- Helm stored image value: `v3.0.1`
- Replicas: 2 available
- `/healthz`: ready, v3.0.1, prod
- `/livez`: alive, v3.0.1, prod

The incident is resolved because the live Deployment and Git pin now agree on the immutable recovery image and the user-visible release-content drift was corrected. Helm stored values still need controlled reconciliation, as described in the residual-risk and corrective-action sections.

## Post-recovery verification

Public and direct Kubernetes Service responses were compared after recovery.

Root page markers matched between public and direct-origin responses:

- `Latest update: April 1, 2026`
- `prod v3.0.1`
- `DSPACE v3.0.1`

Content hashes also matched:

| Surface | Public SHA-256 | Direct-origin SHA-256 | Result |
| --- | --- | --- | --- |
| Root page | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | Match |
| Changelog | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | Match |
| Docs changelog | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | Match |
| `/config.json` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | Match |

Cloudflare response evidence after recovery showed `cache-control: no-store` and `cf-cache-status: DYNAMIC`. This incident is not attributed to Cloudflare caching, and no post-recovery discrepancy is attributed to Cloudflare caching.

Public and origin `/healthz` and `/livez` hashes differed because those responses contain changing uptime and timestamp fields. Those hash differences are not treated as an anomaly.

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
- The attempted Helm reconciliation failed because of later chart content under version 3.0.1 and the live `--reuse-values` path.
- Helm stored values remained stale after the emergency Deployment correction.
- No pre-recovery image digest or response-body hash was preserved.
- The exact impact start and exact workflow run that moved the semantic tag remain unknown.

## Current residual risk

Incident status is resolved. Current live Deployment state and the Git production pin agree on `main-1a31a56`, and this report does not claim ongoing user impact.

However, Helm revision 8 still stores `image.tag=v3.0.1`. The live Deployment was corrected outside Helm, so Helm stored values and live state remain intentionally drifted. DSPACE production Helm operations should remain frozen until a controlled reconciliation is performed using a newly published, never-overwritten chart version and the immutable image tag. This report does not recommend editing Helm revision history directly.

Artifact-publication risk also remains until image and chart workflows are changed so semantic image tags and OCI chart versions cannot be overwritten or repointed after publication.

## Corrective actions

| Priority | Owner area | Status | Completion condition |
| --- | --- | --- | --- |
| P0 | Production operations | Completed | Production restored to immutable image `ghcr.io/democratizedspace/dspace:main-1a31a56`. |
| P0 | Production operations | Completed | Both replicas verified using image digest `sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`. |
| P0 | Sugarkube production configuration | Completed | Sugarkube production pin changed to `main-1a31a56` through PR #2320. |
| P0 | Production verification | Completed | Public and direct-origin content compared after recovery with matching root, changelog, docs-changelog, and `/config.json` hashes. |
| P0 | DSPACE image publishing | Open | `.github/workflows/ci-image.yml` publishes semantic `vX.Y.Z` image tags only from the matching Git tag or release event, never ordinary branch pushes. |
| P0 | DSPACE image publishing | Open | Semantic image publication refuses to overwrite an already published semantic image tag. |
| P0 | Release/deployment operations | Open | Branch-SHA images are documented and enforced as the authoritative staging, production, rollback, and promotion coordinates. |
| P0 | DSPACE Helm publishing | Open | `.github/workflows/ci-helm.yml` prevents replacement of an existing OCI chart version. |
| P0 | DSPACE Helm publishing | Open | Any chart repair is published under a new version; chart `3.0.1` is not republished. |
| P0 | Release integrity | Open | A release consistency gate proves Git tag, package version, chart version, chart appVersion, image OCI revision label, and approved source commit all agree. |
| P0 | Production operations | Open | Production Helm state is reconciled in a controlled maintenance operation so Git, Helm stored values, the live Deployment, and the resolved image digest all agree on the immutable image. |
| P0 | Sugarkube deployment model | Open | Environment-specific Sugarkube chart pins allow staging to use DSPACE chart 3.1.0 while production remains on its approved chart version. |
| P1 | Runtime identity | Open | Production exposes and verifies a bounded build-identity signal containing the Git revision, not only the semantic application version. |
| P1 | Production verification | Open | Production verification compares the running image revision or digest against the approved release commit. |
| P1 | Rollback procedure | Open | Rollback procedure verifies that pods were actually replaced and that the running image ID changed to the intended digest. |
| P1 | Frontend release verification | Open | A deterministic frontend content/build marker check catches release-content drift even when `/healthz` and `/livez` remain healthy. |
| P1 | Observability | Open | Monitoring or alerting detects unexpected production build-revision drift. |
| P1 | Incident readiness | Open | Incident operators can retrieve package-version metadata or have another documented method to record semantic-tag and immutable-tag digests at deployment time. |

## Evidence gaps and unknowns

- The exact beginning of user-visible impact is unknown.
- The affected pods observed before immutable-image recovery had July 7 start times, but the pre-recovery image digest and response body were not preserved; impact is not asserted to have begun on July 7.
- The exact detection minute was not captured, only that detection occurred shortly before 2026-07-23 16:02 PDT.
- The exact GitHub Actions run that last moved `v3.0.1` was not captured.
- The previous digest and final mutable digest for the moved semantic image tag were not captured because the operator's GitHub CLI token lacked `read:packages`.
- The exact publish or overwrite time for the mismatched OCI chart `dspace:3.0.1` was not captured.
- The exact Helm `--reuse-values` value-merging path that produced the production nil pointer was not fully reproduced offline.

## Verification commands or evidence references

Repository references:

- `.github/workflows/ci-image.yml`
- `.github/workflows/ci-helm.yml`
- `charts/dspace/Chart.yaml`
- `charts/dspace/values.yaml`
- `charts/dspace/templates/servicemonitor.yaml`
- `package.json`
- `outages/2026-07-23-dspace-production-version-drift.json`
- `https://github.com/democratizedspace/dspace/releases/tag/v3.0.1`
- `https://github.com/democratizedspace/dspace/commit/1a31a569aff2dbeb238e8c2688b9e85140d2077d`
- `https://github.com/democratizedspace/dspace/pull/4718`
- `https://github.com/democratizedspace/dspace/pull/4719`
- `https://github.com/futuroptimist/sugarkube/pull/2320`

Validation commands for this documentation change:

```bash
npm run test:root -- \
  tests/outagesConventions.test.ts \
  tests/docsPromptsOutages.test.ts
npm run audit:ci
npm run lint
npm run type-check
npm run build
npm run test:ci
node scripts/link-check.mjs
git diff --check
git diff --stat
git diff main...HEAD | python3 scripts/scan-secrets.py
```
