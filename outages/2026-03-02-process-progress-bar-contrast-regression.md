# Process progress bar contrast regression

## Summary
Process cards regained intended light/dark contrast in recent Chip-focused fixes, but the in-progress bar remained hard-coded and did not inherit the same inversion semantics. In inverted process cards, the progress fill could appear nearly the same as the card surface, making progress hard to perceive.

## Related work
- PR #3816: https://github.com/democratizedspace/dspace/pull/3816
- PR #3823: https://github.com/democratizedspace/dspace/pull/3823
- Prior outage entries:
  - `outages/2026-02-16-item-page-contrast-regression.json`
  - `outages/2026-03-01-chip-inverted-contrast-specificity-regression.json`

## Root cause
`ProgressBar.svelte` used static palette values (`#f3f3f3` track, `#68d46d` fill) and did not accept an `inverted` prop. `Process.svelte` was already toggling contrast for chips based on parent inversion, but the progress bar was left out of that handoff. After process cards switched to light styling, the light fill no longer had sufficient contrast against surrounding surfaces.

## Resolution
- Added `inverted` support to `ProgressBar.svelte`.
- Passed `inverted` from `Process.svelte` into `ProgressBar` for both IN_PROGRESS and PAUSED states.
- In inverted mode, switched progress bar treatment to:
  - darker fill (`#007006`)
  - subtle dark-tinted track/border for separation.
- Added regression coverage to ensure process in-progress contrast wiring includes the progress bar and to ensure ProgressBar accepts inverted mode.

## Prevention
Any process-surface contrast changes must include ProgressBar in the same inversion contract (actions, content chips, and time/progress controls).
