# Processes preview + CI long tail

## Summary
A cluster of regressions landed after PR #2336 and the subsequent Svelte 5 upgrade.
Process previews became flaky, CI was noisy from patch-coverage gating, and repeated
changes were needed to re-stabilize tests. Between December 13–18, the team iterated
through locator fixes, Svelte 5 compatibility work, and CI guardrail tweaks until the
process preview suite ran green, changes merged, and a GHCR publish was queued for
staging verification.

## Impact
- Process preview E2E tests blocked merges on `v3` until stability was restored.
- Patch coverage gates and flaky selectors slowed CI and reviewers.
- Staging deploys were held waiting for a green pipeline and a fresh GHCR image for
  the process fixes.

## Detection
- CI repeatedly failed on process preview and tutorial quest flows after the Svelte 5
  upgrade, surfacing flaky cleanup timing and selector issues.
- Patch coverage calculations produced unstable expectations, prompting further CI
  tuning.

## Root causes
- Svelte 5 import and reactivity shifts required new Vitest configuration and updated
  selectors; initial upgrades broke preview flows and tests.
- Process preview components and tests relied on fragile timing, leading to flaky
  cleanup and toggle assertions under CI load.
- Patch coverage gating amplified noise from unrelated test flakes until the gate was
  removed.

## Timeline
- **2025-12-13** – PR [#2336](https://github.com/democratizedspace/dspace/pull/2336)
  merged, resolving a quest grant-items regression and kicking off the sequence of
  follow-up fixes.
- **2025-12-13** – PR [#2345](https://github.com/democratizedspace/dspace/pull/2345)
  landed with the Svelte 5 upgrade and process item display fixes, introducing the new
  runtime and the first wave of compatibility issues.
- **2025-12-14** – PR [#2356](https://github.com/democratizedspace/dspace/pull/2356)
  made Vitest Svelte-aware for coverage to unblock unit tests after the upgrade.
- **2025-12-15** – PR [#2343](https://github.com/democratizedspace/dspace/pull/2343)
  restored missing process item lists when inventories hit zero, ensuring data inputs
  for previews were correct.
- **2025-12-15** – PR [#2357](https://github.com/democratizedspace/dspace/pull/2357)
  addressed Svelte 5 Vitest imports, ProcessForm tests, and E2E stability gaps.
- **2025-12-15** – PR [#2362](https://github.com/democratizedspace/dspace/pull/2362)
  tightened patch coverage base handling and improved process preview toggle hygiene.
- **2025-12-16** – PR [#2360](https://github.com/democratizedspace/dspace/pull/2360)
  reduced Playwright timeout noise and refined coverage calculations.
- **2025-12-16** – PR [#2369](https://github.com/democratizedspace/dspace/pull/2369)
  removed the custom patch coverage gate to keep CI from blocking on noisy deltas.
- **2025-12-16** – PR [#2372](https://github.com/democratizedspace/dspace/pull/2372)
  stabilized manage-process preview timeouts with more deterministic locators.
- **2025-12-17** – PR [#2374](https://github.com/democratizedspace/dspace/pull/2374)
  hardened flaky preview cleanup and instrumentation in CI.
- **2025-12-18** – PR [#2380](https://github.com/democratizedspace/dspace/pull/2380)
  fixed invalid process IDs during editing and tightened toggle handling.
- **2025-12-18** – PR [#2384](https://github.com/democratizedspace/dspace/pull/2384)
  merged the final stabilization for preview toggles, returning CI to green.

## Resolution
- Updated Vitest and Svelte resolver settings to handle Svelte 5 internals cleanly.
- Reworked process preview selectors, instrumentation, and cleanup timing to remove
  race conditions in CI.
- Simplified coverage gating so flaky preview runs no longer blocked merges.

## Verification
- CI on `v3` is green after PR #2384 merged.
- The GHCR workflow builds and publishes on pushes to `v3`; the post-#2384 image is
  queued for publication before staging deployment.
- Staging deployment to `staging.democratized.space` will validate the new image once
  it appears in GHCR (pending at the time of this write-up).

## Lessons learned
- Svelte major upgrades require coordinated updates across Vitest, Playwright, and
  component selectors; deferring those changes caused cascading flakes.
- Instrumentation is useful, but determinism (stable locators and cleanup) is the real
  fix for CI reliability.
- Coverage gates should account for noisy suites; failing fast on metrics alone can
  mask the underlying flake.

## Follow-ups
- Keep Svelte/Vitest resolver tests alongside upgrades to catch subpath regressions.
- Add soak tests for process previews to detect timing regressions earlier.
- Monitor GHCR publish latency after merges and document expected tag availability
  before staging deploys.
