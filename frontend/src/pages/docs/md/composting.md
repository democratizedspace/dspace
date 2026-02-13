---
title: 'Composting'
slug: 'composting'
---

Composting quests cover the `composting` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Start a Compost Bucket](/quests/composting/start)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile)
3. [Check Compost Temperature](/quests/composting/check-temperature)
4. [Sift Finished Compost](/quests/composting/sift-compost)

## 1) Start a Compost Bucket (`composting/start`)

- Quest link: `/quests/composting/start`
- Unlock prerequisite: `requiresQuests`: ['hydroponics/basil']
- Dialogue `requiresItems` gates:
    - `run-process-hint` → “I ran it on the item page and made a layered compost bucket.”: layered compost bucket ×1
    - `finish` → “Compost bucket started”: layered compost bucket ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Lettuce Seeds ×2, compost sifter ×1
- Processes used:
    - [`start-compost-bin`](/processes/start-compost-bin)
        - Requires: 5 gallon bucket ×1, nitrile gloves (pair) ×1
        - Consumes: bundle of basil leaves ×2, harvested basil plant ×1
        - Creates: layered compost bucket ×1

## 2) Turn Your Compost Bucket (`composting/turn-pile`)

- Quest link: `/quests/composting/turn-pile`
- Unlock prerequisite: `requiresQuests`: ['composting/start']
- Dialogue `requiresItems` gates:
    - `start` → “Gloves on; bucket needs air.”: 5 gallon bucket ×1, nitrile gloves (pair) ×1, layered compost bucket ×1
    - `mix` → “Check core temperature”: active compost bucket ×1, compost thermometer ×1
    - `mix` → “Measure moisture level”: compost temperature log ×1, active compost bucket ×1, compost moisture meter ×1
    - `mix` → “Mix is fluffy and capped”: active compost bucket ×1, compost temperature log ×1, compost moisture log ×1
    - `finish` → “Aerated and logged”: active compost bucket ×1, compost temperature log ×1, compost moisture log ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: compost thermometer ×1, compost moisture meter ×1
- Processes used:
    - [`measure-compost-moisture`](/processes/measure-compost-moisture)
        - Requires: compost moisture meter ×1, active compost bucket ×1
        - Consumes: none
        - Creates: compost moisture log ×1
    - [`measure-compost-temperature`](/processes/measure-compost-temperature)
        - Requires: compost thermometer ×1, active compost bucket ×1
        - Consumes: none
        - Creates: compost temperature log ×1
    - [`turn-compost-bucket`](/processes/turn-compost-bucket)
        - Requires: 5 gallon bucket ×1, nitrile gloves (pair) ×1, layered compost bucket ×1
        - Consumes: layered compost bucket ×1
        - Creates: active compost bucket ×1

## 3) Check Compost Temperature (`composting/check-temperature`)

- Quest link: `/quests/composting/check-temperature`
- Unlock prerequisite: `requiresQuests`: ['composting/turn-pile']
- Dialogue `requiresItems` gates:
    - `start` → “Ready to take readings.”: active compost bucket ×1
    - `probe` → “Log the temperature”: compost thermometer ×1, active compost bucket ×1
    - `probe` → “Check moisture too”: compost moisture meter ×1, active compost bucket ×1
    - `moisture` → “Record the moisture”: compost moisture meter ×1, active compost bucket ×1
    - `moisture` → “Readings logged”: compost temperature log ×1, compost moisture log ×1
    - `recheck` → “Two temps and moisture are logged”: compost temperature log ×2, compost moisture log ×1
    - `cooldown` → “Start the cure rest”: active compost bucket ×1, compost temperature log ×2, compost moisture log ×1
    - `cooldown` → “Bucket has cooled and smells earthy”: cured compost bucket ×1, compost temperature log ×2, compost moisture log ×1
    - `finish` → “On to sifting!”: cured compost bucket ×1, compost temperature log ×2, compost moisture log ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`cure-compost-bucket`](/processes/cure-compost-bucket)
        - Requires: active compost bucket ×1, compost temperature log ×1, compost moisture log ×1
        - Consumes: active compost bucket ×1
        - Creates: cured compost bucket ×1
    - [`measure-compost-moisture`](/processes/measure-compost-moisture)
        - Requires: compost moisture meter ×1, active compost bucket ×1
        - Consumes: none
        - Creates: compost moisture log ×1
    - [`measure-compost-temperature`](/processes/measure-compost-temperature)
        - Requires: compost thermometer ×1, active compost bucket ×1
        - Consumes: none
        - Creates: compost temperature log ×1
    - [`recheck-compost-temperature`](/processes/recheck-compost-temperature)
        - Requires: compost thermometer ×1, active compost bucket ×1, compost temperature log ×1, compost moisture log ×1
        - Consumes: none
        - Creates: compost temperature log ×1

## 4) Sift Finished Compost (`composting/sift-compost`)

- Quest link: `/quests/composting/sift-compost`
- Unlock prerequisite: `requiresQuests`: ['composting/check-temperature']
- Dialogue `requiresItems` gates:
    - `start` → “Cured bucket and gloves ready.”: cured compost bucket ×1, nitrile gloves (pair) ×1
    - `setup` → “Sift the compost”: compost sifter ×1, nitrile gloves (pair) ×1, cured compost bucket ×1
    - `setup` → “Screening complete.”: screened compost blend ×1
    - `finish` → “Can't wait to use it!”: screened compost blend ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`sift-compost`](/processes/sift-compost)
        - Requires: compost sifter ×1, nitrile gloves (pair) ×1, cured compost bucket ×1
        - Consumes: cured compost bucket ×1
        - Creates: screened compost blend ×1

## QA flow notes

- Cross-quest dependencies:
    - `composting/start` unlocks after: hydroponics/basil
    - `composting/turn-pile` unlocks after: composting/start
    - `composting/check-temperature` unlocks after: composting/turn-pile
    - `composting/sift-compost` unlocks after: composting/check-temperature
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `measure-compost-moisture` is reused in 2 quests (composting/check-temperature, composting/turn-pile)
    - Process `measure-compost-temperature` is reused in 2 quests (composting/check-temperature, composting/turn-pile)
