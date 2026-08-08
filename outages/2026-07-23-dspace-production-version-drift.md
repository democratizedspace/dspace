# Outage: DSPACE production release-artifact drift

## Incident metadata

- **Date**: 2026-07-23
- **Severity**: high
- **Status**: Resolved
- **Component**: production release artifact integrity for `democratized.space`
- **Incident ID**: `2026-07-23-dspace-production-version-drift`

## Summary

On July 23, 2026, manual operator inspection found that production `democratized.space` was
serving later 3.1-era frontend and changelog content while runtime identity surfaces still reported
DSPACE v3.0.1. The footer identified the deployment as `prod v3.0.1`, `/healthz` reported
`version: "v3.0.1"` and `env: "prod"`, and `/livez` reported `version: "v3.0.1"` and
`env: "prod"`. The incident was not limited to misleading release labels or changelog content:
the unintended 3.1-era frontend also made the non-working token.place prototype the default `/chat`
provider, creating a directly broken user-facing feature.

The service stayed available. No data loss, saved-game corruption, credential exposure, privacy
incident, or security compromise was detected. The incident was resolved by replacing the live
Deployment image with the immutable v3.0.1 source-coordinate image
`ghcr.io/democratizedspace/dspace:main-1a31a56`, whose canonical commit is
`1a31a569aff2dbeb238e8c2688b9e85140d2077d`.

The primary release-control failure was release-artifact mutability: ordinary eligible branch image
builds could publish both immutable branch-SHA tags and the semantic `v<package-version>` tag.
Because the package version remained `3.0.1` while later main-branch changes accumulated, later
source revisions could be published under `v3.0.1`. Production used `v3.0.1` with
`image.pullPolicy=Always`, so the strongest evidence-supported causal mechanism is that a later
source revision was resolved under the moved `v3.0.1` tag when the observed production pods were
created or restarted. Follow-up controls are tracked in
[DSPACE #4727](https://github.com/democratizedspace/dspace/issues/4727) for release-only,
non-overwritable semantic image tags,
[DSPACE #4730](https://github.com/democratizedspace/dspace/issues/4730) for an end-to-end
release-coordinate consistency gate, and
[Sugarkube #2321](https://github.com/futuroptimist/sugarkube/issues/2321) for rejecting semantic
image tags before production mutation. The exact workflow run and image digests that moved the
semantic tag were not captured, but `v3.0.1` was unsafe as an immutable deployment coordinate.

A separate published Helm chart mismatch was discovered during recovery. The OCI chart identified as
`dspace:3.0.1` did not match the chart source at the canonical `v3.0.1` Git tag and complicated an
attempted controlled Helm reconciliation. Follow-up controls are tracked in
[DSPACE #4728](https://github.com/democratizedspace/dspace/issues/4728) for immutable chart
publication, [DSPACE #4729](https://github.com/democratizedspace/dspace/issues/4729) for
independent chart and application versioning, and
[DSPACE #4731](https://github.com/democratizedspace/dspace/issues/4731) for a new
v3.0.1-compatible recovery chart. This chart artifact problem is documented here as an
artifact-integrity violation and recovery complication, not as the primary source of the
user-visible frontend drift.

## Impact

- Production served later 3.1-era frontend and changelog content while visible runtime identity
  surfaces still reported v3.0.1.
- Users could be misled about which DSPACE release was deployed.
- Fresh/default production users opening `/chat` were routed to token.place by default; this
  provider-selection behavior is repository-verifiable from the token.place chat design and
  chat-provider routing E2E coverage.
- Based on operator evidence from the affected production state, the token.place-enabled chat
  prototype did not function during the incident, leaving the default chat workflow visibly broken.
- The OpenAI chat path remained available only through a manual workaround in `/settings`, where a
  user had to explicitly select OpenAI and provide or retain their own valid OpenAI API key.
- That workaround required knowledge that was not obvious from the broken default experience and therefore did not eliminate user impact.
- Existing users already persisted on OpenAI with a valid key may have avoided this specific chat failure.
- The number of affected chat sessions, attempted messages, exact client errors, and precise token.place failure mode were not captured.
- Operators could be misled because readiness and liveness checks stayed healthy and reported the
  expected semantic version rather than proving the expected source commit or immutable image
  revision.
- The service remained available throughout the confirmed incident window.
- No data loss, saved-game corruption, credential exposure, privacy incident, or security compromise
  was detected.
- The exact beginning of user impact is unknown. Affected pods observed before immutable-image
  recovery had July 7 start times, but the pre-recovery image digest and public response body were
  not preserved, so this record does not claim impact definitively began on July 7.
- The recorded recovery-action interval was 10 minutes 56 seconds, measured from the successful Helm
  rollback at 2026-07-23 23:02:32 UTC to the second replacement container start at 2026-07-23
  23:13:28 UTC.
- The plausible affected-pod residence window was approximately 16 days 18 hours 56 minutes for the
  earlier observed pre-recovery runtime that started at 2026-07-07T04:16:57.966Z, and approximately
  16 days 16 hours 51 minutes for the later observed pre-recovery runtime that started at
  2026-07-07T06:22:50.406Z, compared with the second replacement container start. These
  approximately 16.7-day windows describe how long the observed pre-recovery runtimes had existed;
  they are not proof that incorrect content was served from startup, are not a confirmed incident
  duration, and do not rule out an earlier or later activation within that interval.
- The first confirmed user-visible impact was the July 23 manual observation.
- Blast radius was limited to production `democratized.space` release-content integrity and the
  default `/chat` provider selection and chat user journey. Service availability remained healthy,
  and no evidence showed data loss, save corruption, credential exposure, privacy/security
  compromise, staging impact, token.place users outside DSPACE, or impact to the other Sugarkube
  applications.
- Severity is high because production release integrity and operator trust were violated, with a
  potentially multi-day exposure window, despite no confirmed availability, data-loss, or security
  impact.
- The staging DSPACE 3.1.0 observability rollout occurred in a separate staging cluster and is not
  treated as having directly changed production.

## Detection

Detection was manual visual inspection shortly before the first rollback at 16:02 PDT on
2026-07-23. There was no alert or automated release-integrity check. Existing readiness and
liveness probes continued to pass, and existing version surfaces reported the package version rather
than the source commit, immutable image tag, or resolved image digest. Detection follow-up is tracked
in [DSPACE #4732](https://github.com/democratizedspace/dspace/issues/4732) for bounded runtime
source identity, [DSPACE #4733](https://github.com/democratizedspace/dspace/issues/4733) for a
deterministic remote `/chat` smoke harness,
[Sugarkube #2328](https://github.com/futuroptimist/sugarkube/issues/2328) for enforcing build
identity and `/chat` smoke checks during promotion, and
[Sugarkube #2329](https://github.com/futuroptimist/sugarkube/issues/2329) for release-drift and
`/chat` alerts with mobile routing.

The exact detection minute was not captured.

## Timeline

All times are shown in PDT and UTC where available.

| Time (PDT)                      | Time (UTC)                      | Event                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-21 10:25:23             | 2026-05-21 17:25:23             | Commit `1a31a569aff2dbeb238e8c2688b9e85140d2077d` was created and became the `v3.0.1` tag target. The derived immutable short-SHA image tag was `main-1a31a56`.                                                                                                                                                                                                                                        |
| 2026-05-21 10:49:01             | 2026-05-21 17:49:01             | Production Helm revision 7 deployed chart `dspace-3.0.1` with stored image tag `v3.0.1`.                                                                                                                                                                                                                                                                                                               |
| 2026-07-14 23:45:55             | 2026-07-15 06:45:55             | PR #4718 merged the `metrics` and authenticated `ServiceMonitor` chart content at merge commit `c970091e294d88170677ad752b2bdac582e1e87e`, while the chart still identified itself as version `3.0.1`.                                                                                                                                                                                                 |
| Shortly before 2026-07-23 16:02 | Shortly before 2026-07-23 23:02 | Operator detected production serving later 3.1-era frontend/changelog content while runtime version surfaces still said v3.0.1. The exact detection timestamp and exact impact start are unknown.                                                                                                                                                                                                      |
| 2026-07-23 16:02:32             | 2026-07-23 23:02:32             | Helm rollback to revision 7 completed and created revision 8. Helm reported success, but the release still used chart `dspace-3.0.1` and image tag `v3.0.1`; no meaningful pod-template image change occurred because the same mutable tag remained configured, and the incorrect frontend content persisted.                                                                                          |
| Shortly after rollback          | Shortly after rollback          | A controlled Helm upgrade attempted to retain chart `3.0.1` while setting image tag `main-1a31a56` with `--reuse-values`. Rendering failed with `template: dspace/templates/servicemonitor.yaml:1:14: executing "dspace/templates/servicemonitor.yaml" at <.Values.serviceMonitor.enabled>: nil pointer evaluating interface {}.enabled`. No production change occurred from this failed Helm command. |
| 2026-07-23 16:12:53             | 2026-07-23 23:12:53             | First replacement pod using `main-1a31a56` was created.                                                                                                                                                                                                                                                                                                                                                |
| 2026-07-23 16:13:15             | 2026-07-23 23:13:15             | First replacement container started.                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-07-23 16:13:27             | 2026-07-23 23:13:27             | Second replacement pod was created.                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-07-23 16:13:28             | 2026-07-23 23:13:28             | Second replacement container started. The successful rollout and subsequent verification established both replicas as ready on the immutable image; user impact was declared over after that rollout. The exact readiness transition and exact last affected request were not captured.                                                                                                                |
| 2026-07-23 16:39:19             | 2026-07-23 23:39:19             | Sugarkube PR #2320 merged and changed the production image pin to `main-1a31a56`.                                                                                                                                                                                                                                                                                                                      |
| 2026-07-23 16:41:32             | 2026-07-23 23:41:32             | Operational closeout confirmed the Git pin, live image, chart, replicas, and public health.                                                                                                                                                                                                                                                                                                            |
| 2026-07-23 16:54:55             | 2026-07-23 23:54:55             | Operator began private evidence collection.                                                                                                                                                                                                                                                                                                                                                            |

## Technical root cause

### Primary image-tag mutability cause

The primary root cause was release-artifact mutability in the image publication and production
selection path.

Verified facts:

- The canonical DSPACE v3.0.1 Git tag resolves to commit
  `1a31a569aff2dbeb238e8c2688b9e85140d2077d`.
- The corresponding immutable branch-SHA image tag is `main-1a31a56`.
- The DSPACE image workflow derived branch-SHA tags as `<branch>-<short-sha>`.
- The same workflow also derived `v<package-version>` and published it on ordinary eligible branch
  builds.
- Until the 3.1.0 coordinate change merged, `package.json` still described package version
  `3.0.1`, allowing later successful branch builds to publish later source revisions under
  `v3.0.1`.
- Production was configured with chart `dspace-3.0.1`, stored Helm image tag `v3.0.1`, and
  `image.pullPolicy=Always`.
- The production Git pin was stale before recovery: the Sugarkube cross-repository file
  `docs/apps/dspace.prod.tag` contained `v3.0.0` before recovery, so the production Helm release was not fully represented by the repository's production
  pin before the incident.

Supported inference:

- Because production referenced the mutable semantic image tag with `image.pullPolicy=Always`, a
  recreated or restarted pod could pull later source content without any change to the declared
  production tag or package version. Pod recreation or restart was the mechanism capable of
  activating the moved tag, but the exact triggering event is unknown; the two July 7 `startedAt`
  values make July 7 a plausible activation point for the observed runtimes, not a proven impact
  start.
- Footer, `/healthz`, and `/livez` continued to report v3.0.1 because they reflected the
  package/build version, not proof that the running image matched the expected v3.0.1 source commit.
- The workflow made semantic-tag movement possible, and the production behavior demonstrated that
  `v3.0.1` was not a safe immutable deployment coordinate. The strongest supported incident
  mechanism is that a later source revision was resolved under the moved `v3.0.1` tag when the
  observed production pods were created or restarted; the incident-specific tag move was not
  directly captured.

Unresolved evidence:

- The exact GitHub Actions run that last moved `v3.0.1`, the previous digest, and the final mutable
  digest were not captured because the operator's GitHub CLI token lacked `read:packages`.
- This record does not invent the missing workflow run or digest.

### Published chart mismatch discovered during recovery

A separate artifact-integrity issue was discovered while attempting to reconcile production through
Helm. This was a recovery complication, not the primary source of the user-visible frontend drift.

Verified facts:

- The currently published OCI chart `dspace:3.0.1` had digest
  `sha256:fa10fef00cebf6f1e7cb46c38146552eb8418646f6060493127cc5554b990175`.
- The published chart's source content did not match the canonical chart source at Git tag
  `v3.0.1`.
- At Git tag `v3.0.1`, `charts/dspace/values.yaml` did not contain the `metrics` or
  `serviceMonitor` sections, and `charts/dspace/templates/servicemonitor.yaml` did not exist.
- PR #4718 merged the `metrics` and authenticated `ServiceMonitor` chart content at merge commit
  `c970091e294d88170677ad752b2bdac582e1e87e` on 2026-07-15 06:45:55 UTC / 2026-07-14
  23:45:55 PDT, while the chart still identified itself as version `3.0.1`.
- In the published OCI chart `3.0.1`, `values.yaml` contained the material `metrics` and
  `serviceMonitor` additions, and `templates/servicemonitor.yaml` contained the authenticated
  ServiceMonitor implementation from that merge, whereas the canonical `v3.0.1` Git tag at
  `1a31a569aff2dbeb238e8c2688b9e85140d2077d` does not.
- The material artifact differences included a `metrics` block, a `serviceMonitor` block, and the
  complete `templates/servicemonitor.yaml`.

Conclusion:

- The published chart version `3.0.1` does not correspond to the source tree at the `v3.0.1` Git
  tag. This is an immutable-version contract violation: an OCI chart identified as `3.0.1` was
  published from source content later than the canonical v3.0.1 tag, or was subsequently replaced
  with such content.
- The exact overwrite or publish time and workflow run were not captured and are not asserted here.

### Helm-render evidence nuance

The real production Helm upgrade that tried to retain chart `3.0.1` while setting the image tag to
`main-1a31a56` used `--reuse-values` and failed during rendering with this nil-pointer error:

```text
template: dspace/templates/servicemonitor.yaml:1:14: executing "dspace/templates/servicemonitor.yaml" at <.Values.serviceMonitor.enabled>: nil pointer evaluating interface {}.enabled
```

Later standalone `helm template` commands using exported current user values and exported computed
values both succeeded. The exported user/all values did not show top-level `metrics` or
`serviceMonitor` keys, but standalone rendering still applied the published chart's defaults.
Therefore the exact Helm value-merging path that produced the live `--reuse-values` nil pointer was
not fully reproduced offline.

This record states only that the actual recovery upgrade failed in the `--reuse-values` path, the
published artifact materially differs from the v3.0.1 Git tag, and the exact `--reuse-values` merge
behavior remains a follow-up investigation. It does not claim that every render of chart 3.0.1 fails
or that the chart is unconditionally unusable.

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
- The production Git pin was stale and did not match the live Helm release before the incident.
- The chart artifact identified as 3.0.1 did not match the v3.0.1 source tag and complicated the
  immutable-image correction.
- There was no automated alert for frontend build/release-coordinate drift.
- Detection depended on manual visual review.

## Recovery and resolution

The initial Helm rollback alone did not restore the intended source artifact because it retained the
mutable `v3.0.1` tag. After the attempted controlled Helm upgrade failed in the live
`--reuse-values` path, the operator performed an emergency image-only correction on the live
Deployment:

- Image: `ghcr.io/democratizedspace/dspace:main-1a31a56`
- Resolved image ID on both recovered pods:
  `ghcr.io/democratizedspace/dspace@sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401`

The rollout created two replacement pods, and the second replacement container started at
2026-07-23 16:13:28 PDT / 23:13:28 UTC. The successful rollout and subsequent verification
established both recovered pods as ready with zero restarts on the immutable recovery image, so user
impact was declared over after that rollout. The exact readiness transition and exact last affected
request were not captured.

Sugarkube PR #2320 then made the immutable image coordinate durable by changing the production image
pin to `main-1a31a56`; its merge commit was
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

| Surface                | Public value                                                       | Direct-origin value                                                | Result  |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------- |
| Root marker            | `Latest update: April 1, 2026`                                     | `Latest update: April 1, 2026`                                     | Matched |
| Root marker            | `prod v3.0.1`                                                      | `prod v3.0.1`                                                      | Matched |
| Root marker            | `DSPACE v3.0.1`                                                    | `DSPACE v3.0.1`                                                    | Matched |
| Root SHA-256           | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | `b8fc71b476d5d3c7000d3a2558f2824c553a886f81775f3dcd2fce3dea13c884` | Matched |
| Changelog SHA-256      | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | `01bd0fbe848825dd8f33ab50561df1863c7c4efcece5314af24d25f42ce01dde` | Matched |
| Docs changelog SHA-256 | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | `8303f63583db3b48326050d2bf1643b48753a3c70265164bb1e44bcc0bb017e3` | Matched |
| `/config.json` SHA-256 | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | `a42d7e88885d9a6529270d15584f2c9715f9bc53def928c4bae41a03747d3ee2` | Matched |

Cloudflare response evidence after recovery included `cache-control: no-store` and
`cf-cache-status: DYNAMIC`. The public and origin matches verified that recovery was not masked by
Cloudflare. This record does not attribute the incident or post-recovery state to Cloudflare
caching.

`/healthz` and `/livez` hashes differed between public and origin requests because those responses
contain changing uptime and timestamp fields; those differing hashes were not treated as an anomaly.

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
- The operator could not determine the currently moved package-tag digest through the GitHub
  packages API because the token lacked `read:packages`.
- The attempted Helm reconciliation failed in the combination of later chart content under version
  3.0.1 and the live `--reuse-values` path; the precise Helm merge behavior remains unresolved.
- Helm stored values remained stale after the emergency Deployment correction.
- No pre-recovery image digest or response-body hash was preserved.
- Availability and version checks did not exercise the default fresh-profile `/chat` path, allowing
  a visibly broken production chat experience to coexist with green `/healthz` and `/livez`
  results.
- The exact impact start and exact workflow run that moved the semantic tag remain unknown.

## Post-incident closeout

All 25 issues carrying `outage_2026_07_23_1` across DSPACE and Sugarkube were closed by
2026-08-08. The 16 canonical actions below are complete; DSPACE #4734–#4742 were duplicate
cross-repository mirrors closed as not planned in favor of the corresponding Sugarkube issues, not
nine additional controls.

The final control set is deliberately layered:

- **Prevention:** ordinary DSPACE branch builds publish only branch-SHA and explicitly mutable
  convenience image tags; semantic aliases are release-only, single-publication digest aliases.
  Chart publication is tag-gated and refuses an existing coordinate, while chart and application
  versions are independent. Sugarkube rejects semantic production image tags, resolves
  environment-specific chart pins, renders the exact proposed release before mutation, and omits
  `--reuse-values` from standard upgrades. Implementation and negative-path evidence is linked in
  the canonical-action table.
- **Mitigation and recovery:** recovery chart `3.0.2` was published once for application `3.0.1`,
  and manifest-driven deployment and rollback commands use explicit immutable image, chart,
  values, and source coordinates. The finalized production evidence record is
  [`deployment-evidence/dspace/prod/main-1a31a56-20260801T093443Z.json`](https://github.com/futuroptimist/sugarkube/blob/main/deployment-evidence/dspace/prod/main-1a31a56-20260801T093443Z.json).
- **Detection:** DSPACE exposes bounded runtime and frontend build identity and supplies a
  release-aware remote `/chat` smoke harness. Sugarkube promotion gates verify image, runtime,
  frontend, provider, replica, public/direct, and journey agreement. Five staging release-integrity
  alerts and a pinned five-minute `/chat` synthetic now exercise those signals.
- **Release proof:** the DSPACE
  [v3.1.1 release](https://github.com/democratizedspace/dspace/releases/tag/v3.1.1) validated source
  `22f506e07e0b5abfd0cf756e9c5827c0458fb4b2`, immutable image `main-22f506e`, and image digest
  `sha256:467890df969cc7938cb760f965fd8f90a8912b1dcb1f8425bc808216b7e1512b`.
  Semantic alias `v3.1.1` resolved to that same digest. Approved chart `3.1.2` resolved to
  `sha256:544a3e31ab827e6d2bf28754a19d8af17b0402b75159c2a40c1b3dfe5eb60161`.
  The [semantic recovery workflow](https://github.com/democratizedspace/dspace/actions/runs/31058866232)
  succeeded; the later [duplicate-publication run](https://github.com/democratizedspace/dspace/actions/runs/31059130820)
  then failed at the expected preflight guard without republishing. That intentional rejection was
  successful negative-path evidence, not an unexpected CI failure.

## Final production reconciliation and residual risk

The stale post-recovery drift was removed by a controlled Helm reconciliation, without editing or
rewriting Helm history. The finalized Sugarkube production record verifies these coordinates:

| Coordinate               | Final value                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| Application              | DSPACE `3.0.1`                                                            |
| Application source       | `1a31a569aff2dbeb238e8c2688b9e85140d2077d`                                |
| Image                    | `main-1a31a56`                                                            |
| Image digest             | `sha256:23dbc573377549136c1f10b05706b3c176ffbabaf04a3194381a24752104a401` |
| Chart                    | `3.0.2`                                                                   |
| Chart digest             | `sha256:8b862135e52146f301a41259d6dabb053ed891d798fc1c8c95ca775b2b8e9575` |
| Chart source             | `63063e287adb92a4158ce2c8e7d378b73f52c1c5`                                |
| Production Helm revision | `9`                                                                       |
| Expected provider        | OpenAI                                                                    |

The record reports passing image, chart, Helm-values, runtime-identity, frontend-identity,
replica-agreement, public/direct-agreement, provider, and `/chat` checks. Git, Helm, the Deployment,
pod image IDs, runtime identity, and the finalized manifest therefore agree. The incident-specific
production Helm freeze is lifted. This conclusion does not claim that Helm revision history was
altered; it records the new reconciled revision and preserves the earlier revision-8 evidence.

No incident corrective action remains open. The original evidence gaps below remain historical
unknowns; the later controls make future releases reconstructable but do not retroactively recover
missing July 23 evidence.

## Corrective actions

The following table is the canonical accounting of the 16 independent corrective actions. A
`Completed` status records both issue closure and the implemented or operational proof shown here;
it is not inferred from closure alone.

| Repository | Issue                                                            | Type     | Status    | Final proven control and evidence                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DSPACE     | [#4727](https://github.com/democratizedspace/dspace/issues/4727) | Prevent  | Completed | [PR #4743](https://github.com/democratizedspace/dspace/pull/4743) made semantic tags release-only and fail-closed; [PR #4802](https://github.com/democratizedspace/dspace/pull/4802), the successful v3.1.1 run, and the expected duplicate rejection proved publication and immutability.                                                                                          |
| DSPACE     | [#4728](https://github.com/democratizedspace/dspace/issues/4728) | Prevent  | Completed | [PR #4747](https://github.com/democratizedspace/dspace/pull/4747) restricted chart publication and refused existing OCI coordinates before packaging or push.                                                                                                                                                                                                                       |
| DSPACE     | [#4729](https://github.com/democratizedspace/dspace/issues/4729) | Prevent  | Completed | [PR #4745](https://github.com/democratizedspace/dspace/pull/4745) separated chart and application coordinate groups and added consistency tests.                                                                                                                                                                                                                                    |
| DSPACE     | [#4730](https://github.com/democratizedspace/dspace/issues/4730) | Prevent  | Completed | [PR #4753](https://github.com/democratizedspace/dspace/pull/4753) added the release-coordinate manifest gate; the v3.1.1 release run proved source, image, semantic alias, chart, and digest agreement end to end.                                                                                                                                                                  |
| DSPACE     | [#4731](https://github.com/democratizedspace/dspace/issues/4731) | Mitigate | Completed | [PR #4751](https://github.com/democratizedspace/dspace/pull/4751) produced recovery chart `3.0.2` for application `3.0.1`; [workflow attempt 1](https://github.com/democratizedspace/dspace/actions/runs/30150548091/attempts/1) published it and attempt 2 intentionally refused replacement.                                                                                      |
| DSPACE     | [#4732](https://github.com/democratizedspace/dspace/issues/4732) | Detect   | Completed | [PR #4759](https://github.com/democratizedspace/dspace/pull/4759) added bounded runtime and frontend source identity with build-time agreement checks. This also satisfies the formerly unlinked frontend-marker action.                                                                                                                                                            |
| DSPACE     | [#4733](https://github.com/democratizedspace/dspace/issues/4733) | Detect   | Completed | [PR #4763](https://github.com/democratizedspace/dspace/pull/4763) added the release-aware remote `/chat` harness; [PR #4806](https://github.com/democratizedspace/dspace/pull/4806) added bounded, retry-safe result evidence used by monitoring.                                                                                                                                   |
| Sugarkube  | [#2321](https://github.com/futuroptimist/sugarkube/issues/2321)  | Prevent  | Completed | [PR #2370](https://github.com/futuroptimist/sugarkube/pull/2370) made production deployment and rollback validation reject semantic or otherwise mutable image tags before mutation.                                                                                                                                                                                                |
| Sugarkube  | [#2322](https://github.com/futuroptimist/sugarkube/issues/2322)  | Prevent  | Completed | [PR #2331](https://github.com/futuroptimist/sugarkube/pull/2331) added independently reviewable environment-specific version files. The final scope retained generic inline version as the highest-priority compatibility override rather than adding environment-specific inline variables.                                                                                        |
| Sugarkube  | [#2323](https://github.com/futuroptimist/sugarkube/issues/2323)  | Prevent  | Completed | [PR #2378](https://github.com/futuroptimist/sugarkube/pull/2378) made the exact chart, version, values, namespace, release, and immutable image render a pre-mutation gate for app releases.                                                                                                                                                                                        |
| Sugarkube  | [#2324](https://github.com/futuroptimist/sugarkube/issues/2324)  | Prevent  | Completed | [PR #2387](https://github.com/futuroptimist/sugarkube/pull/2387) removed `--reuse-values` from standard upgrades and made the explicit repository values chain authoritative.                                                                                                                                                                                                       |
| Sugarkube  | [#2325](https://github.com/futuroptimist/sugarkube/issues/2325)  | Mitigate | Completed | [PR #2478](https://github.com/futuroptimist/sugarkube/pull/2478) preserved the finalized production evidence for Helm revision 9, proving Git, Helm, Deployment, pod digest, identities, provider, and journey agreement and lifting the freeze.                                                                                                                                    |
| Sugarkube  | [#2326](https://github.com/futuroptimist/sugarkube/issues/2326)  | Prevent  | Completed | [PR #2350](https://github.com/futuroptimist/sugarkube/pull/2350) added fail-closed, non-overwritable manifests and deployment evidence; production PR #2478 proves it operationally. This durable record also satisfies the formerly unlinked incident-artifact retrieval action without retrospective package-API access.                                                          |
| Sugarkube  | [#2327](https://github.com/futuroptimist/sugarkube/issues/2327)  | Mitigate | Completed | [PR #2363](https://github.com/futuroptimist/sugarkube/pull/2363) made a finalized immutable manifest the guarded rollback coordinate; [PR #2426](https://github.com/futuroptimist/sugarkube/pull/2426) supplied runtime, frontend, provider, and journey verification. Live evidence proves the verifier dependencies, not an unnecessary destructive production rollback exercise. |
| Sugarkube  | [#2328](https://github.com/futuroptimist/sugarkube/issues/2328)  | Prevent  | Completed | [PR #2426](https://github.com/futuroptimist/sugarkube/pull/2426) integrated release-aware identity and `/chat` checks into promotion evidence, including replica and public/direct agreement.                                                                                                                                                                                       |
| Sugarkube  | [#2329](https://github.com/futuroptimist/sugarkube/issues/2329)  | Detect   | Completed | [PR #2501](https://github.com/futuroptimist/sugarkube/pull/2501) installed alerting and the synthetic, DSPACE PR #4806 supplied bounded results, and [PR #2523](https://github.com/futuroptimist/sugarkube/pull/2523) preserved the staging drill and runbook closeout. Scope is detailed below.                                                                                    |

### DSPACE mirrored-issue reconciliation

These nine DSPACE issues duplicated ownership of the Sugarkube actions above. GitHub records each as
closed **not planned** after reconciliation to its canonical Sugarkube issue; they do not represent
unimplemented work.

| DSPACE mirror                                                    | Canonical Sugarkube action | Disposition                                             |
| ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| [#4734](https://github.com/democratizedspace/dspace/issues/4734) | Sugarkube 2321             | Closed not planned; tracked and completed in Sugarkube. |
| [#4735](https://github.com/democratizedspace/dspace/issues/4735) | Sugarkube 2322             | Closed not planned; tracked and completed in Sugarkube. |
| [#4736](https://github.com/democratizedspace/dspace/issues/4736) | Sugarkube 2323             | Closed not planned; tracked and completed in Sugarkube. |
| [#4737](https://github.com/democratizedspace/dspace/issues/4737) | Sugarkube 2324             | Closed not planned; tracked and completed in Sugarkube. |
| [#4738](https://github.com/democratizedspace/dspace/issues/4738) | Sugarkube 2325             | Closed not planned; tracked and completed in Sugarkube. |
| [#4739](https://github.com/democratizedspace/dspace/issues/4739) | Sugarkube 2326             | Closed not planned; tracked and completed in Sugarkube. |
| [#4740](https://github.com/democratizedspace/dspace/issues/4740) | Sugarkube 2327             | Closed not planned; tracked and completed in Sugarkube. |
| [#4741](https://github.com/democratizedspace/dspace/issues/4741) | Sugarkube 2328             | Closed not planned; tracked and completed in Sugarkube. |
| [#4742](https://github.com/democratizedspace/dspace/issues/4742) | Sugarkube 2329             | Closed not planned; tracked and completed in Sugarkube. |

The accounting is therefore 16 closed DSPACE labeled issues (seven canonical plus nine mirrors) and
nine closed Sugarkube labeled issues: 25 closed, zero open.

### Final observability scope for Sugarkube #2329

Sugarkube PR #2501, DSPACE PR #4806, and Sugarkube PR #2523 establish the final accepted scope. In
staging observability Helm revision 8, all five installed DSPACE release-integrity alerts
(`DspaceBuildRevisionMismatch`, `DspaceMixedBuildRevisions`,
`DspaceDeploymentImagePinMismatch`, `DspaceChatSyntheticFailed`, and
`DspaceMetricsTargetDown`) were loaded, healthy, and inactive at steady state. A pinned DSPACE
runner executes the `/chat` synthetic every five minutes.

Owner-scoped drill `dspace-2329-20260808T051818Z-1053` exercised three applicable failure signals.
Prometheus and Alertmanager observed them firing; PagerDuty delivered them to the configured mobile
receiver, and the operator successfully acknowledged them. After cleanup, PagerDuty delivered the
resolved state, the exact temporary rule was deleted, and verification found a clean steady state.
No routing key, private address, payload, credential, or private operator-evidence path is recorded
here.

The drill did **not** deploy or live-test production observability. Closing #2329 records completion
of its staging acceptance and this postmortem action item; production observability remains a
separate future rollout and is not claimed as proven by this incident closeout.

## Evidence gaps and unknowns

- The exact beginning of user-visible impact is unknown.
- The pre-recovery image digest was not preserved.
- The pre-recovery public response body and hashes were not preserved.
- The exact GitHub Actions run that last moved `v3.0.1` was not captured.
- The previous and final mutable `v3.0.1` image digests were not captured because the operator's
  GitHub CLI token lacked `read:packages`.
- The exact publish or overwrite time for the mismatched OCI chart `dspace:3.0.1` was not captured.
- The exact readiness transition and exact last affected request were not captured.
- The exact count of affected users, sessions, or failed chat attempts was not captured.
- No browser console/network trace or exact user-visible token.place error was preserved from the
  affected production state.
- There is no proof that users with an already persisted OpenAI provider and valid key were affected by the chat failure.
- The exact Helm `--reuse-values` merge path that produced the live nil-pointer rendering failure
  was not fully reproduced offline.

## Verification commands or evidence references

Repository and public references used by this record:

- `.github/workflows/ci-image.yml`
- `.github/workflows/ci-helm.yml`
- `charts/dspace/Chart.yaml`
- `charts/dspace/values.yaml`
- `charts/dspace/templates/servicemonitor.yaml`
- `package.json`
- `docs/design/token-place-chat-v3.1.md`
- `frontend/e2e/chat-provider-routing.spec.ts`
- `outages/2026-07-23-dspace-production-version-drift.json`
- `https://github.com/democratizedspace/dspace/releases/tag/v3.0.1`
- `https://github.com/democratizedspace/dspace/commit/1a31a569aff2dbeb238e8c2688b9e85140d2077d`
- `https://github.com/democratizedspace/dspace/pull/4718`
- `https://github.com/democratizedspace/dspace/commit/c970091e294d88170677ad752b2bdac582e1e87e`
- `https://github.com/democratizedspace/dspace/blob/1a31a569aff2dbeb238e8c2688b9e85140d2077d/.github/workflows/ci-image.yml`
- `https://github.com/democratizedspace/dspace/tree/1a31a569aff2dbeb238e8c2688b9e85140d2077d/charts/dspace`
- `https://github.com/futuroptimist/sugarkube/blob/301cb8a4c5a75a75bb73dde7a198731c762b1d5c/docs/apps/dspace.prod.tag`
- `https://github.com/futuroptimist/sugarkube/blob/61303e079e425808eb25f30d3be07e93ccdf6a37/docs/apps/dspace.prod.tag`
- `https://github.com/democratizedspace/dspace/pull/4719`
- `https://github.com/futuroptimist/sugarkube/pull/2320`

Validation commands for this documentation-only change are recorded in the companion pull request and
review output. This record intentionally excludes private evidence archive paths, credentials,
tokens, screenshots, generated evidence bundles, and binary artifacts.
