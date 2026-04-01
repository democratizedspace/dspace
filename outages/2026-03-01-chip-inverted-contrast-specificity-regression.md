# Chip inverted contrast regression (static + nested process cards)

## Summary
`Chip.svelte` had a CSS specificity regression where `inverted=true` no longer reliably produced the light-green surface for static chip containers. This broke contrast expectations in nested UIs such as `Process.svelte` cards and made contrast behavior inconsistent across chip modes (static vs button vs link).

## User-visible impact
- Process cards expected to be light (`inverted=true`) could render dark backgrounds in nested/static contexts.
- Text contrast became inconsistent in light cards (for example, white labels on light green).
- Action chips like `Start` could visually blend into light process backgrounds when both used the same inversion state.

## Regression window
- **Introduced:** `e4c80b0f82e078ac5b7c68a57340b8b5bc9f8a89` (2026-02-15)
- **Detected:** 2026-03-01 during contrast QA on quest and dedicated process pages.
- **Fixed:** 2026-03-01 on branch `fix/process-compact-item-contrast`.

## Root cause
The introducing commit split static chip base styling into `nav .chip-container` (higher specificity) but left inversion/state styles on generic selectors such as `.inverted`.  
Because `nav .chip-container` is more specific than `.inverted`, static chip background/color declarations won in the cascade, so `inverted=true` did not reliably apply light-green styling.

## Resolution
- Updated `Chip.svelte` to apply state styles with matched specificity:
  - `nav a.inverted`, `nav button.inverted`, `nav .chip-container.inverted`
  - Same pattern for `disabled`, `hazard`, `cheat`, and `red`
- Added class bindings for anchor chips so links honor `inverted` and related state props.
- Updated process usage to enforce intended contrast:
  - Process cards in quest option and dedicated process view now pass `inverted=true`.
  - Start action chip is explicitly dark (`inverted=false`) so it contrasts against light process cards.
  - Process heading colors switch to dark text only for inverted process containers.

## Regression-prevention coverage
- `frontend/src/components/__tests__/Chip.spec.ts`
  - Asserts default vs inverted static chip background colors.
  - Asserts inverted contrast for interactive button and link chips.
- `frontend/src/components/__tests__/Process.spec.ts`
  - Asserts parent/child process chip contrast alternation.
  - Asserts inverted process containers keep a dark `Start` chip and apply the inverted container class.

