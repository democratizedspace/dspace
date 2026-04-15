# Buy required items incorrectly disabled for consume-only process requirements

## Summary
The process detail page for `3dprint-rocket-body-tube` showed the **Buy required items** button as disabled with the message "All required items are already available." even when required consume inputs were missing (for example, `entry-level FDM 3D printer` and `green PLA filament` at zero inventory).

## User-visible impact
- Players could not use **Buy required items** to purchase missing consumables for affected processes.
- The disabled reason was misleading because the missing requirements were in `consumeItems`, not `requireItems`.

## Regression window
- **Introduced:** Before 2026-04-15 (exact introducing commit unknown).
- **Detected:** 2026-04-15 from staging report on `/processes/3dprint-rocket-body-tube`.
- **Fixed:** 2026-04-15.

## Root cause
The auto-buy logic only evaluated `requireItems`. Many built-in processes model start requirements in `consumeItems` (with empty `requireItems`), so missing inputs were ignored and the UI concluded that all required items were available.

## Resolution
- Updated process detail auto-buy requirement selection to:
  - use `requireItems` when present,
  - otherwise fall back to `consumeItems`.
- Added regression test coverage for consume-only processes to ensure the buy button enables and purchases missing priced consumables while skipping unpriced entries.
