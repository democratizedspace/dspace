# Outage: quest ID and JSON path drift caused 404 source links

## Summary
The Electronics quest **Tin a Soldering Iron** used the quest id
`electronics/tin-soldering-iron`, but the underlying JSON file remained at
`frontend/src/pages/quests/json/electronics/soldering-intro.json`.

This mismatch made path-derived references point to a non-existent canonical file path and caused
confusion when navigating to GitHub source URLs for the quest.

## Impact
- Broken source expectations for: `frontend/src/pages/quests/json/electronics/tin-soldering-iron.json`
- Drift in docs/lists that derive quest identifiers from filenames
- Risk of repeated regressions for any quest renamed in id but not in file path

## Root cause
A quest id rename was applied in JSON content without renaming the physical file to keep the path in
lockstep with `id`.

## Fix
- Renamed the quest file to `tin-soldering-iron.json`.
- Updated path-based references that still pointed to `soldering-intro`.
- Added a regression test that fails when any quest JSON file has `id` not matching
  `<tree>/<filename>`.

## Preventive action
Treat quest ID changes and file-path changes as a single atomic change. Any quest rename must update:
1. JSON `id`
2. JSON filename
3. Path-derived docs/assets references
4. Regression tests (already enforced by `tests/questIdPathConsistency.test.ts`)
