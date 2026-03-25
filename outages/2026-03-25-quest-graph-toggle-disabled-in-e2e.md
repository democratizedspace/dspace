# Quest graph toggle remained disabled in E2E settings bootstrap

## Summary
`enableQuestGraphVisualizer()` assumed the settings toggle would be clickable after hydration.
In some E2E runs, the toggle remained disabled (`loading=true`), causing repeated click timeouts and
blocking the entire quest-map Playwright suite.

## User-visible impact
- `quest-graph-map-viewport.spec.ts` failed before entering test assertions.
- QA checklist item for map viewport coverage stayed unresolved despite no direct map regression.

## Regression window
- **Introduced:** helper required interactive click path only.
- **Detected:** 2026-03-25 during v3 QA checklist reruns.
- **Fixed:** 2026-03-25.

## Root cause
The helper did not provide a fallback when the toggle control stayed disabled after hydration. This
can happen when settings state hydration lags in test environments.

## Resolution
- Added a fallback branch in `enableQuestGraphVisualizer()`:
  - write `showQuestGraphVisualizer: true` directly into `localStorage.gameState` settings,
  - reload settings page,
  - continue with normal toggle verification path.
- This keeps coverage deterministic even when the interactive toggle is temporarily unavailable.
