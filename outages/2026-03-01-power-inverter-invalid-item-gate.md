# Power inverter quest blocked by invalid required item ID

## Impact
- Staging quest `/quests/energy/power-inverter` could not progress from the start node.
- The start option rendered as `Unknown item`, so players could not satisfy the gate and complete
  the quest.

## Detection
- Reported from staging walkthrough with screenshot evidence of `Requires: 1 / 0 x Unknown item`.

## Root cause
- `frontend/src/pages/quests/json/energy/power-inverter.json` referenced a placeholder/nonexistent
  item ID (`c9b51052-0000-0000-0000-000000000000`) in the start node `requiresItems`.
- `scripts/validate-quest.js` validated schema, quest dependencies, and process IDs, but did not
  validate quest item references (`requiresItems`, `grantsItems`, `rewards`) against inventory.

## Resolution
- Replaced the invalid start-node item requirement with the real `Solar setup (1 kWh)` item ID
  (`8bfdedf6-79a4-4527-a43d-4d57f793ac52`), matching the prerequisite quest progression.
- Extended quest validation to fail on unknown item references in options and rewards.
- Added test coverage for missing required/granted/reward item IDs so CI fails on regressions.

## Prevention
- Keep quest validation item-aware by default in `scripts/validate-quest.js`.
- Maintain unit tests around invalid item references to ensure future content additions fail fast
  during CI rather than being discovered on staging.
