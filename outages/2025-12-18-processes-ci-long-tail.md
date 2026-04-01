# Processes + CI long-tail stabilization (Svelte 5)

## Summary
After PR #2336 shipped a fix for missing grant items in quests (Dec 13), follow-on work
upgraded the frontend to Svelte 5 (PR #2345) and exposed brittle process preview toggles and
coverage gates. Over the next five days we iterated on Playwright waits, Svelte 5 import
resolution, and Manage Processes UI state. CI finally returned green with PR #2384 on Dec 18,
clearing the path for a GHCR image publish and staging verification.

## Impact
- Process preview experiences regressed while toggles and detail panels intermittently failed
  in Playwright and manual flows.
- CI blocked merges due to coverage gate noise and Svelte 5 module resolution errors.
- Release cadence slowed until the process pages and tests were hardened.

## Detection
- CI failures in Playwright suites (`process-preview.spec.ts`, `manage-processes.spec.ts`) and
  vitest coverage runs after the Svelte 5 upgrade highlighted reactivity and timing issues.
- Patch coverage workflow noise raised additional red flags in CI.

## Root causes
- Svelte 5 changed internal import paths and reactivity timing, breaking process preview
  toggles and coverage instrumentation.
- Aggressive patch coverage gating magnified failures unrelated to functionality.
- Playwright waits were tuned for pre-upgrade timing and needed stabilization for new UI
  behavior.

## Timeline
- **2025-12-13 — PR #2336**: Fixed missing grant item display, touching `CompactItemList` and
  adding quest E2E coverage. Established the baseline before the upgrade.
- **2025-12-13 — PR #2345**: Upgraded to Svelte 5 and adjusted process item formatting,
  introducing the new runtime/reactivity surface for processes.
- **2025-12-14 — PR #2356**: Made vitest coverage Svelte-aware to unblock CI imports.
- **2025-12-15 — PR #2343**: Restored process item lists and strengthened Playwright waits
  after the upgrade fallout.
- **2025-12-15 — PR #2357**: Fixed Svelte 5 vitest imports, ProcessForm tests, and Playwright
  flakiness for processes.
- **2025-12-15 — PR #2362**: Stabilized process preview toggles while ensuring patch coverage
  calculations respected PR base.
- **2025-12-15 — PR #2360**: Reduced Playwright timeouts and aligned Manage Processes toggle
  behavior with coverage expectations.
- **2025-12-16 — PR #2369**: Removed the custom patch coverage gate to stop blocking merges on
  flaky coverage diffs.
- **2025-12-16 — PR #2372**: Hardened Manage Processes preview timing and state updates in
  Playwright.
- **2025-12-17 — PR #2374**: Further stabilized process previews and tutorial quest overlap by
  tightening waits and UI state handling.
- **2025-12-18 — PR #2380**: Locked down Manage Processes detail panel toggles to stop hover
  races in tests and the UI.
- **2025-12-18 — PR #2384**: Finalized process preview toggle stability and compact item list
  rendering, delivering a green CI run on v3.

## Resolution
- Standardized Svelte 5 import resolution across vitest and Playwright harnesses.
- Relaxed brittle coverage enforcement and tuned waits around Manage Processes toggles and
  preview cards.
- Added targeted regression tests for process toggles to guard against future regressions.

## Verification
- CI passed after PR #2384 merged to `v3`, confirming Playwright and unit suites were stable.
- GHCR image publish is expected via `.github/workflows/ci-image.yml`; monitoring for the new
  tag before promoting.
- Staging deploy to `staging.democratized.space` is planned once the GHCR image is available.

## Lessons learned
- Upgrading framework internals (Svelte 5) requires synchronized updates across unit, E2E, and
  coverage tooling to avoid cascading failures.
- Coverage gates that drift from real risk signals can extend outage tails when paired with UI
  regressions.
- Process preview UI needs explicit waits and resilient toggles to handle reactive changes.

## Follow-ups
- Added vitest coverage for the Svelte import resolution helper
  (`tests/svelteSubpathResolver.test.ts`) to catch upstream changes early.
- Revisit coverage gating thresholds after stability holds for a release window.
- Add a small staging smoke checklist for Manage Processes to detect toggle regressions before
  PR merges.
