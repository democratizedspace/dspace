# Outage: completionist/catalog blocked by stale award gate

## Summary
`/quests/completionist/catalog` became non-completable for users who had already converted
**Completionist Award II** into **Completionist Award II (polished)**.

The dialogue gate and its supporting process still required the unpolished award item, so users
with only the polished variant could not advance despite meeting the intended progression.

## Impact
- Affected quest: `completionist/catalog`
- User-visible symptom: first dialogue option disabled with missing `Completionist Award II`
- Reproduction: imported game state with `Completionist Award II (polished)` and `Completionist Award II` count of 0

## Root cause
Quest and process requirements drifted from the progression contract after the polish flow:
- `completionist/catalog` start and prep gates required unpolished award
- `record-completionist-award-entry` process required unpolished award

## Fix
- Updated `completionist/catalog` dialogue gates to require `Completionist Award II (polished)`
- Updated `record-completionist-award-entry` process requirement to require `Completionist Award II (polished)`
- Added regression test coverage for both quest and process gates
- Updated completionist skills documentation to match live gating

## Preventive action
Keep completionist quest-tree docs and item gates synchronized in the same PR whenever any quest
step requirement changes.
