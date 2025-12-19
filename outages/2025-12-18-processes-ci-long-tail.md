# Processes preview regressions and CI long tail

## Summary
Following PR #2336 (compact item handling fixes), the processes preview UI regressed. The repo was
upgraded to Svelte 5, preview toggles in Manage Processes became flaky, and CI coverage gates
started masking the real failures. A series of stabilization PRs hardened the process preview
components,
removed brittle coverage gating, and restored reliable Playwright and Vitest runs. CI finally went
green on 2025-12-18 with the last process preview toggle fix merged.

## Impact
- Process previews and detail toggles frequently failed in E2E runs, blocking merges.
- Patch coverage gating created noise that obscured the underlying UI regression signals.
- Releases to GHCR and staging were paused until the process pages stabilized and tests stopped
  flaking.

## Detection
- Playwright specs (`process-preview.spec.ts`, `manage-processes.spec.ts`) failed right after the
  Svelte 5 upgrade. Repeated toggling failures kept CI red across multiple PRs.
- Coverage checks in `scripts/checkPatchCoverage.cjs` produced conflicting statuses, masking the
  real UI regressions until the gating was removed.

## Root cause
- The Svelte 5 upgrade (commit `39e2e8a`) tightened reactivity semantics, exposing brittle preview
  toggle state handling in `ManageProcesses.svelte` and related components.
- Patch coverage gating and inconsistent PR base selection amplified CI noise and obscured the
  regressions.

## Timeline
- **2025-12-13 – PR #2336**: Compact item rendering fixes touched shared helpers used by process
  previews, introducing stricter rendering paths for grant items and process lists.
- **2025-12-14 – Commit 39e2e8a**: Upgraded the frontend Svelte dependency to 5.x, triggering new
  reactivity behavior in preview toggles.
- **2025-12-14 – PR #2356**: Added Svelte 5-aware test configuration and resolver fixes to unblock
  CI after the upgrade.
- **2025-12-15 – PR #2343**: Restored process item lists when inventory counts were zero and
  tightened E2E coverage for previews.
- **2025-12-15 – PR #2362**: Stabilized process preview toggles and corrected patch coverage base
  selection to reflect the right comparison branch.
- **2025-12-15 – PR #2360**: Continued preview timeout and coverage fixes, aligning scripts and
  tests with the new process behavior.
- **2025-12-16 – PR #2369**: Removed the custom patch coverage gate that was obscuring true UI
  failures, reducing CI noise.
- **2025-12-16 – PR #2372**: Hardened `ManageProcesses.svelte` and `process-preview.spec.ts` to
  reduce timeouts and stabilize previews.
- **2025-12-17 – PR #2374**: Expanded preview toggle hardening across Playwright helpers and
  tutorial quests, addressing remaining flakiness.
- **2025-12-18 – PR #2380**: Finalized Manage Processes detail panel toggle logic and aligned
  Playwright specs.
- **2025-12-18 – PR #2384**: Added component-level regression tests for compact item rendering and
  tightened preview toggle handling, turning CI green.

## Resolution
- Reworked preview toggle logic and compact item rendering to align with Svelte 5 reactivity.
- Simplified coverage enforcement by removing brittle gates and aligning PR base detection.
- Expanded Playwright helpers and component tests to exercise preview toggles deterministically.

## Verification
- CI passed after PR #2384 merged, with Playwright and Vitest suites stabilizing the preview flows.
- GHCR image publish is handled by `.github/workflows/ci-image.yml`; the next `v3` push should emit
  tags for the merged SHA and refresh `ghcr.io/democratizedspace/dspace`.
- Staging deployment to `staging.democratized.space` is pending the freshly published GHCR image;
  smoke checks will follow once the image is available.

## Lessons learned
- Svelte major upgrades can silently change reactivity expectations; pair code changes with targeted
  component tests to catch UI drift.
- Coverage gates should not mask red pipelines; keeping coverage reporting informative but
  non-blocking during UI stabilization reduces noise.
- Preview toggles need deterministic helpers and clear loading semantics to avoid flakiness.

## Follow-ups
- Add regression Playwright coverage for process preview toggles with explicit wait conditions.
- Document Svelte 5-specific reactivity expectations for preview panels and compact item lists.
- Monitor the next GHCR publish and staging rollout to confirm the stabilized flows hold outside CI.
