# Playwright navigation retries timed out before Astro preview stabilized

## Summary
End-to-end specs intermittently failed in fresh/container runs because `navigateWithRetry` in
`frontend/e2e/test-helpers.ts` stopped retrying after 10 seconds. Cold starts that rebuilt Astro
artifacts (or recovered from preview restarts) exceeded that budget.

## User-visible impact
- E2E suites failed with `ERR_CONNECTION_REFUSED`/`page.goto` timeout even when the app became
  healthy moments later.
- QA checklist boxes for Playwright coverage remained unchecked due to infrastructure timing, not
  functional regressions.

## Regression window
- **Introduced:** helper default duration (`DEFAULT_MAX_DURATION_MS = 10_000`).
- **Detected:** 2026-03-25 while executing v3 QA checklist runs after Playwright/browser setup.
- **Fixed:** 2026-03-25.

## Root cause
The retry loop used short exponential backoff with an overall 10s ceiling. In containerized CI-like
environments, preview startup plus first-load rebuilds often take longer, so retries exhausted before
`/settings` and `/quests` became reachable.

## Resolution
- Increased `DEFAULT_MAX_DURATION_MS` from `10_000` to `30_000` in shared E2E helper
  `navigateWithRetry`.
- Kept existing attempt count/backoff behavior, only extending the overall readiness window for
  legitimate cold-start scenarios.
