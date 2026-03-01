# Power inverter quest blocked by invalid start-node item gate

## Impact
- Staging quest `/quests/energy/power-inverter` was not completable from the `start` node.
- The first actionable option displayed `Unknown item` and blocked progression.

## Detection
- Reported from staging with a screenshot showing `Requires: 1 / 0 x Unknown item` on the
  `I'm ready.` option.

## Root cause
- `energy/power-inverter` used an invalid item UUID at the `start` gate:
  `c9b51052-0000-0000-0000-000000000000`.
- The valid safety goggles item is `c9b51052-4594-42d7-a723-82b815ab8cc2`; the quest had a
  typo/placeholder-like ID rather than the canonical inventory ID.
- Existing quest completion validation dropped unknown dialogue-path requirements, which reduced
  chances of surfacing unknown IDs in that specific path analysis.

## Resolution
- Replaced the invalid start-node item ID in `energy/power-inverter` with the canonical safety
  goggles item ID.
- Hardened `tests/questCompletableItems.test.ts` by adding an explicit validation test that fails
  when any quest or process references unknown item IDs.
- Updated dialogue-path requirement handling to keep unknown IDs in failure analysis instead of
  filtering them out.

## Prevention
- CI now has a direct guard for unknown item references across both quests and processes.
- Keep item IDs sourced from canonical inventory JSON (copy from existing references) rather than
  manual UUID entry.
