# Outage: quest ID and JSON path drifted out of sync

## Summary
The quest route `/quests/electronics/tin-soldering-iron` existed in content references, but the
canonical source file path returned `404` on GitHub because the quest JSON filename had drifted to
`soldering-intro.json`.

## Impact
- Broken canonical source links for `electronics/tin-soldering-iron`
- Harder debugging and maintenance for quest references that assume `id -> path` identity

## Root cause
Quest IDs are used as canonical identifiers, but there was no regression guard enforcing that
`<tree>/<questId>` exactly matches `frontend/src/pages/quests/json/<tree>/<questId>.json`.

## Fix
- Renamed `frontend/src/pages/quests/json/electronics/soldering-intro.json` to
  `frontend/src/pages/quests/json/electronics/tin-soldering-iron.json`
- Added regression coverage in `scripts/tests/questIdPathConsistency.test.ts` to fail whenever a
  quest file path and its internal `id` diverge

## Preventive action
Keep quest IDs and JSON filenames aligned. Any future rename should update both simultaneously,
and CI now enforces this invariant for all quest files.
