# 2025-12-18 — Processes + CI long tail

## Summary
After the processes "grant items" fix in PR #2336, the repository upgraded to
Svelte 5. The upgrade altered module resolution and reactivity, which broke
process preview E2E flows and left CI red while we reworked imports, waits, and
coverage rules. A week of follow-up fixes stabilized Playwright, hardened
ManageProcesses behaviors, and removed brittle patch-coverage gating, restoring
CI to green ahead of GHCR publication and staging validation.

## Impact
- Process preview E2E suites failed repeatedly, blocking the v3 merge queue and
  delaying validation of processes changes.
- Patch-coverage gating and Playwright setup failures caused CI false negatives
  until we adjusted the guardrails.
- Release cadence slowed while we waited for green CI before the next GHCR
  image and staging deployment.

## Detection
- Playwright suites for process preview and compact item lists failed after the
  Svelte 5 upgrade, surfacing in CI for PR #2356 and follow-on branches.
- Coverage workflows started failing once import timing and module resolution
  drifted, leaving the main tests red until addressed.

## Root cause
- Svelte 5 changed how internal modules resolve and how reactive toggles fire in
  tests, breaking existing vitest and Playwright assumptions.
- Processes UI relied on brittle timing for preview toggles and list state, and
  CI patch-coverage hooks amplified the noise from flaky tests.

## Timeline
- **2025-12-13 (PR #2336)** — Merged process grant-item fix that refreshed the
  grant items locator used by E2E flows, setting the starting point for the
  incident.【8f7ddf†L4-L6】【9497b7†L6-L15】
- **2025-12-14 (commit f39d17f)** — Upgraded to Svelte 5 and rewired vitest
  import resolution, introducing reactivity and import regressions that broke
  existing tests.【03f1f7†L1-L13】
- **2025-12-14 (PR #2356)** — Restored Svelte compatibility for SSR, adjusting
  vitest config and dependencies to get imports compiling again in CI.【8f7ddf†L11-L13】【74aff7†L1-L12】
- **2025-12-15 (PR #2343)** — Hardened Playwright browser installation against
  proxy issues to keep E2E setup reliable in CI.【9497b7†L15-L24】
- **2025-12-15 (PR #2357)** — Added stronger waits to `process-preview.spec.ts`
  so toggles hydrate before clicks, improving Svelte 5 stability.【8f7ddf†L13-L15】【9497b7†L24-L35】
- **2025-12-15 (PR #2360)** — Fixed Playwright timeout configuration and patch
  coverage setup, reducing CI flakes on process previews.【8f7ddf†L15-L17】【9497b7†L35-L42】
- **2025-12-15 (PR #2362)** — Simplified patch-coverage defaults to unblock
  coverage checks that were contributing to CI noise.【8f7ddf†L17-L19】【d4e1e3†L1-L9】
- **2025-12-16 (PR #2369)** — Removed the custom patch-coverage gate entirely to
  stop false CI failures while processes tests stabilized.【8f7ddf†L19-L21】【9497b7†L42-L57】
- **2025-12-16 (PR #2372)** — Tightened ManageProcesses preview logic and waits
  to prevent toggles from firing before hydration finished.【8f7ddf†L21-L23】【9497b7†L57-L67】
- **2025-12-17 (PR #2374)** — Tuned ManageProcesses cleanup timing to avoid
  lingering preview state between tests.【8f7ddf†L23-L24】【9497b7†L67-L73】
- **2025-12-18 (PR #2380)** — Added guards for invalid process IDs when editing,
  eliminating another preview failure mode.【8f7ddf†L24-L25】【9497b7†L73-L78】
- **2025-12-18 (PR #2384)** — Finalized CompactItemList expectations for process
  previews, clearing the last red CI checks before release prep.【8f7ddf†L25-L26】【9497b7†L78-L82】

## Resolution
- Landed successive Svelte 5 compatibility commits to fix import resolution and
  SSR/vitest wiring.
- Updated process preview tests and UI to wait for hydration, handle invalid IDs
  safely, and clean up between runs.
- Retired the brittle patch-coverage workflow so legitimate E2E fixes could
  drive CI status, culminating in green builds after PR #2384.

## Verification
- CI returned to green after PR #2384 merged, validating the Svelte 5 and
  processes fixes together.
- GHCR publication for the new build is pending observation; staging deploy to
  `staging.democratized.space` will proceed once the image appears.

## Lessons learned
- Major framework upgrades should ship with paired CI hardening and updated test
  fixtures to absorb reactivity changes.
- Coverage gates that depend on filesystem state can mask real failures; keep
  them simple or disable them during large migrations.
- Processes preview flows need explicit hydration waits and cleanup hooks to
  remain reliable under UI upgrades.

## Follow-ups / action items
- Add preflight checks that assert Playwright browsers are available before
  running E2E.
- Keep ManageProcesses preview guards and waits documented for future Svelte
  changes.
- Monitor GHCR publication and staging smoke tests to confirm the end-to-end
  flow is healthy.
