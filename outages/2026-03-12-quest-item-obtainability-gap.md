# Robotics reflectance-sensors blocked by non-obtainable gating item

## Impact
- Staging quest `/quests/robotics/reflectance-sensors` could be blocked because `Wheel Encoder`
  was used as a required item while not being directly obtainable from inventory purchase or a
  process output.
- Existing quest completion tests did not enforce a direct-source contract for quest-gating items,
  allowing placeholder-priced gating items to slip through.

## Detection
- Reported from staging with inventory item and quest URLs showing that `Wheel Encoder`
  (`71fafa9a-3998-4763-a63a-279acc4ca603`) had no price and was not created by any process.

## Root cause
- `Wheel Encoder` had `priceExemptionReason: "BETA_PLACEHOLDER"` and no process in
  `createItems` for that item.
- Quest validation focused on finish-path feasibility and aggregate world obtainability, but did
  not explicitly fail when quest-required items lacked direct obtainability via price or process.

## Resolution
- Added explicit pricing for `Wheel Encoder`.
- Added and expanded test coverage to require all quest-gating items to be directly obtainable
  through purchase or process creation.
- Priced additional quest-gating placeholder items surfaced by the new test:
  `USB Cable`, `Servo Motor`, and `Lettuce Seeds`.

## Prevention
- CI now enforces a direct-source obtainability rule for all quest-required items.
- Placeholder pricing can no longer hide missing acquisition paths for quest progression gates.
