# Playwright config used a weaker Astro artifact check than setup script

## Summary
`frontend/playwright.config.ts` had a local `ensureAstroBuildArtifacts()` implementation that only
checked for `dist/server/entry.mjs`. This drifted from `scripts/ensure-astro-build.mjs`, which has
richer validation and clean-rebuild recovery.

## User-visible impact
- Playwright could proceed with stale/partial artifacts when `entry.mjs` existed but required chunks
  were missing, causing preview startup failures.
- Setup and config could disagree about build health, leading to flaky E2E bootstrap behavior.

## Regression window
- **Introduced:** duplicate minimal artifact check in Playwright config.
- **Detected:** 2026-03-25 while chasing repeated preview startup failures in QA reruns.
- **Fixed:** 2026-03-25.

## Root cause
Two different build-readiness checks existed:
- `setup-test-env` used `ensure-astro-build.mjs` (resilient).
- `playwright.config.ts` used a separate `exists(entry.mjs)` check (insufficient).

The weaker check allowed broken dist states to pass config-time validation.

## Resolution
- Removed the duplicate config-side artifact checker.
- Updated `playwright.config.ts` to call shared `ensureAstroBuild({ root: frontendDir })`.
- This centralizes behavior and ensures config/setup use the same readiness and retry logic.
