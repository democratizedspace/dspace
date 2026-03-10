# Completionist catalog quest blocked by unpolished trophy gate

## Impact
- Players with `Completionist Award II (polished)` but without the base `Completionist Award II`
  could not advance `completionist/catalog`.
- The catalog start option and the `record-completionist-award-entry` process were both gated on
  the older base trophy item, creating a dead-end with valid polished inventories.

## Detection
- Reported from staging reproduction at `/quests/completionist/catalog` with an exported player
  state showing the polished trophy but zero base trophy quantity.

## Root cause
- Quest dialogue `requiresItems` in `completionist/catalog` used the base trophy ID.
- The process `record-completionist-award-entry` also required the base trophy ID.
- The quest chain intent had already shifted to the polished variant, but these gates were not
  updated in lockstep.

## Resolution
- Switched catalog dialogue gates to `Completionist Award II (polished)`.
- Switched `record-completionist-award-entry` process requirement to
  `Completionist Award II (polished)`.
- Added regression tests that assert both the relevant dialogue options and process requirement
  are keyed to the polished trophy item.

## Prevention
- Keep quest and process gate IDs synchronized whenever item progression evolves between variants
  (raw, polished, displayed).
- Preserve regression coverage that validates critical gate item IDs on high-friction progression
  quests like completionist.
