# Process progress bar contrast regression after inversion fixes

## Summary
After the contrast work in PR #3816 and inversion follow-up in PR #3823, process cards correctly rendered with light inverted containers in more contexts. The process progress bar still used a light-green fill designed for dark cards, so on light process cards it blended into the background and looked partially invisible.

## User-visible impact
- In active or paused process cards, the progress bar fill had low contrast against the surrounding light-green process card.
- Players could still read numeric progress text, but at-a-glance progress scanning regressed.

## Regression window
- **Introduced:** 2026-03-01 after merges of PR #3816 and PR #3823 changed effective process-card inversion usage.
- **Detected:** 2026-03-02 via process UI QA.
- **Fixed:** 2026-03-02 by wiring inversion state into `ProgressBar.svelte` and adding inverted-specific styles.

## Root cause
`Process.svelte` passed inversion state to chips and compact item lists but not to `ProgressBar.svelte`.
`ProgressBar.svelte` had a single, hard-coded palette (`#f3f3f3` track + `#68d46d` fill) that assumed a dark surrounding surface. Once process cards were intentionally rendered with `inverted=true` (from prior contrast fixes), the same light-green fill no longer had enough contrast against the card background.

## Resolution
- Added an `inverted` prop to `ProgressBar.svelte`.
- Passed `{inverted}` from `Process.svelte` to progress bars in both `IN_PROGRESS` and `PAUSED` states.
- Added inverted-mode styling for the progress bar:
  - darker fill (`#007006`),
  - neutral track for separation,
  - and dark progress text for readability.
- Added regression coverage in `ProgressBar.spec.ts` to assert inverted mode wiring.

## Related prior work
- PR #3816 and outage entry `outages/2026-03-01-chip-inverted-contrast-specificity-regression.md` restored chip/process container inversion behavior.
- PR #3823 refined inversion nesting in item detail buy/sell surfaces and followed the same contrast theme direction established by earlier contrast outages (see `outages/2026-02-16-item-page-contrast-regression.json`).
