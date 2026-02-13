---
title: 'Composting'
slug: 'composting'
---

Composting quests teach you to turn organic scraps into stable soil amendments. The skill focuses
on the bucket compost method, which is compact and measurable.

## What you learn

- How to balance greens and browns for a healthy compost mix
- How to monitor moisture and temperature in the pile
- How to turn and sift finished compost for garden use

## Quest tree (current 4-quest flow)

1. [Start a Compost Bucket](/quests/composting/start)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile)
3. [Check Compost Temperature](/quests/composting/check-temperature)
4. [Sift Finished Compost](/quests/composting/sift-compost)

This order matters because each quest creates state needed by the next quest.

---

## 1) Start a Compost Bucket

Quest: [/quests/composting/start](/quests/composting/start)

### Requires quest

- `hydroponics/basil`

### Dialogue `requiresItems` gates

- `run-process-hint` → "I ran it on the item page and made a layered compost bucket."
  - layered compost bucket ×1
- `finish` → "Compost bucket started"
  - layered compost bucket ×1

### Processes used in this quest

- [Vent and layer a kitchen compost bucket](/processes/start-compost-bin)
  - Requires:
    - 5 gallon bucket ×1
    - nitrile gloves (pair) ×1
  - Consumes:
    - bundle of basil leaves ×2
    - harvested basil plant ×1
  - Creates:
    - layered compost bucket ×1

### `grantsItems` (from process completion during this quest)

- layered compost bucket ×1

### Quest rewards

- Lettuce Seeds ×2
- compost sifter ×1

---

## 2) Turn Your Compost Bucket

Quest: [/quests/composting/turn-pile](/quests/composting/turn-pile)

### Requires quest

- `composting/start`

### Dialogue `requiresItems` gates

- `start` → "Gloves on; bucket needs air."
  - 5 gallon bucket ×1
  - nitrile gloves (pair) ×1
  - layered compost bucket ×1
- `mix` → "Check core temperature"
  - active compost bucket ×1
  - compost thermometer ×1
- `mix` → "Measure moisture level"
  - compost moisture meter ×1
  - active compost bucket ×1
  - compost moisture log ×1
- `mix` → "Mix is fluffy and capped"
  - active compost bucket ×1
  - compost temperature log ×1
  - compost moisture log ×1
- `finish` → "Aerated and logged"
  - active compost bucket ×1
  - compost temperature log ×1
  - compost moisture log ×1

### Processes used in this quest

- [Aerate and mix a layered compost bucket](/processes/turn-compost-bucket)
  - Requires:
    - 5 gallon bucket ×1
    - nitrile gloves (pair) ×1
    - layered compost bucket ×1
  - Consumes:
    - layered compost bucket ×1
  - Creates:
    - active compost bucket ×1
- [Check core temperature of a compost pile with a compost thermometer](/processes/measure-compost-temperature)
  - Requires:
    - compost thermometer ×1
    - active compost bucket ×1
  - Consumes:
    - _(none)_
  - Creates:
    - compost temperature log ×1
- [Gauge compost moisture with a probe meter](/processes/measure-compost-moisture)
  - Requires:
    - compost moisture meter ×1
    - active compost bucket ×1
  - Consumes:
    - _(none)_
  - Creates:
    - compost moisture log ×1

### `grantsItems` (from process completion during this quest)

- active compost bucket ×1
- compost temperature log ×1
- compost moisture log ×1

### Quest rewards

- compost thermometer ×1
- compost moisture meter ×1

---

## 3) Check Compost Temperature

Quest: [/quests/composting/check-temperature](/quests/composting/check-temperature)

### Requires quest

- `composting/turn-pile`

### Dialogue `requiresItems` gates

- `start` → "Ready to take readings."
  - active compost bucket ×1
- `probe` process gate → "Log the temperature"
  - compost thermometer ×1
  - active compost bucket ×1
- `probe` → "Check moisture too"
  - compost moisture meter ×1
  - active compost bucket ×1
- `moisture` process gate → "Record the moisture"
  - compost moisture meter ×1
  - active compost bucket ×1
- `moisture` → "Readings logged"
  - compost temperature log ×1
  - compost moisture log ×1
- `recheck` → "Two temps and moisture are logged"
  - compost temperature log ×2
  - compost moisture log ×1
- `cooldown` process gate → "Start the cure rest"
  - active compost bucket ×1
  - compost temperature log ×2
  - compost moisture log ×1
- `cooldown` → "Bucket has cooled and smells earthy"
  - cured compost bucket ×1
- `finish` → "On to sifting!"
  - cured compost bucket ×1

### Processes used in this quest

- [Check core temperature of a compost pile with a compost thermometer](/processes/measure-compost-temperature)
  - Requires:
    - compost thermometer ×1
    - active compost bucket ×1
  - Consumes:
    - _(none)_
  - Creates:
    - compost temperature log ×1
- [Gauge compost moisture with a probe meter](/processes/measure-compost-moisture)
  - Requires:
    - compost moisture meter ×1
    - active compost bucket ×1
  - Consumes:
    - _(none)_
  - Creates:
    - compost moisture log ×1
- [Re-check compost temperature after moisture adjustment](/processes/recheck-compost-temperature)
  - Requires:
    - compost thermometer ×1
    - active compost bucket ×1
    - compost temperature log ×1
    - compost moisture log ×1
  - Consumes:
    - _(none)_
  - Creates:
    - compost temperature log ×1
- [Let a hot compost bucket cool and cure](/processes/cure-compost-bucket)
  - Requires:
    - active compost bucket ×1
    - compost temperature log ×1
    - compost moisture log ×1
  - Consumes:
    - active compost bucket ×1
  - Creates:
    - cured compost bucket ×1

### `grantsItems` (from process completion during this quest)

- compost temperature log ×1 (first check)
- compost moisture log ×1
- compost temperature log ×1 (re-check)
- cured compost bucket ×1

### Quest rewards

- cured compost bucket ×1

---

## 4) Sift Finished Compost

Quest: [/quests/composting/sift-compost](/quests/composting/sift-compost)

### Requires quest

- `composting/check-temperature`

### Dialogue `requiresItems` gates

- `start` → "Cured bucket and gloves ready."
  - cured compost bucket ×1
  - nitrile gloves (pair) ×1
- `setup` process gate → "Sift the compost"
  - compost sifter ×1
  - nitrile gloves (pair) ×1
  - cured compost bucket ×1
- `setup` → "Screening complete."
  - screened compost blend ×1
- `finish` → "Can't wait to use it!"
  - screened compost blend ×1

### Processes used in this quest

- [Screen finished compost into a fine blend](/processes/sift-compost)
  - Requires:
    - compost sifter ×1
    - nitrile gloves (pair) ×1
    - cured compost bucket ×1
  - Consumes:
    - cured compost bucket ×1
  - Creates:
    - screened compost blend ×1

### `grantsItems` (from process completion during this quest)

- screened compost blend ×1

### Quest rewards

- cured compost bucket ×1

---

## QA flow checks (cross-quest dependencies)

- You must create a **layered compost bucket** in quest 1 before quest 2 can start.
- Quest 2 creates the first **active compost bucket** and first temp/moisture logs.
- Quest 3 now explicitly gates curing flow on **two compost temperature logs** plus moisture, so
  the second temperature check is not skipped in progression logic.
- Quest 4 consumes a **cured compost bucket** and creates a **screened compost blend**.

## Common pitfalls

- Running too wet or too dry (aim for the "wrung sponge" feel)
- Skipping turns, which slows decomposition and creates odors
- Using compost before it cools and cures fully

## Next steps

- Aim for a screened compost blend before top-dressing beds or pots.
- Use the same logging habits in [Hydroponics](/docs/hydroponics) and other grow skills.
