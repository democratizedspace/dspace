# OUT-2026-03-06 quest build process immersion gap

## Summary

Build/install quests were shipping as dialogue-only checklists with no process hooks. That meant
players could complete "construction" quests without running a real-time process.

## Impact

- Reduced quest quality and immersion.
- Violated the real-time progression standard documented in `/docs/realtime`.
- Allowed progression on machine/enclosure quests without process evidence.

## Fix

- Added process options directly in affected quest flows.
- Added corresponding process records in `frontend/src/pages/processes/base.json`.
- Set `build-biogas-digester` duration to `16h` to represent a real-time fermentation/build run.
- Added regression test `tests/questBuildProcessCoverage.test.ts`.

## Preventive action

Any quest whose title/description indicates a physical build/install of a structure or machine must
include at least one `process` option.
