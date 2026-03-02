# Process progress bar contrast regression on inverted process cards

## Summary
Progress cards were intentionally switched to light chip surfaces in recent contrast fixes, but
`ProgressBar.svelte` still used hard-coded non-inverted colors. On light process cards this made
progress fill visually blend into the background and appear missing during in-progress states.

## User-visible impact
- Running process cards could show a nearly invisible progress fill.
- Users still saw numeric progress and remaining time, but the primary visual affordance (the bar)
  was hard to read.

## Regression window
- **Introduced:** after the inverted process-card follow-up landed in
  [PR #3816](https://github.com/democratizedspace/dspace/pull/3816) and
  [PR #3823](https://github.com/democratizedspace/dspace/pull/3823).
- **Detected:** 2026-03-02 from UI verification of in-progress process cards.
- **Fixed:** 2026-03-02 by propagating inversion state into `ProgressBar`.

## Root cause
`Process.svelte` already tracked chip inversion (`inverted`) for parent card contrast and action
chips, but `ProgressBar.svelte` did not accept inversion input. Its fixed palette (`#f3f3f3` track
+ `#68d46d` fill) has poor separation when rendered inside the light (`inverted=true`) process
context established by the prior contrast PRs.

## Resolution
- Added `inverted` prop to `ProgressBar.svelte`.
- Added `.progress-container.inverted` styles:
  - Darkened track with `rgba(0, 112, 6, 0.25)`
  - Dark fill `#007006` for clear contrast on light cards.
- Updated `Process.svelte` to pass its `inverted` state through to `ProgressBar` for both
  in-progress and paused render paths.
- Added regression coverage in both `ProgressBar.spec.ts` and `Process.spec.ts` to ensure
  inversion class wiring remains intact.

## Related outages and prior fixes
- `outages/2026-03-01-chip-inverted-contrast-specificity-regression.json`
- `outages/2026-02-16-item-page-contrast-regression.json`
