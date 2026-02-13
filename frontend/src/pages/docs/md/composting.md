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

## Quest tree overview (current 4-quest path)

1. [Start a Compost Bucket](/quests/composting/start)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile)
3. [Check Compost Temperature](/quests/composting/check-temperature)
4. [Sift Finished Compost](/quests/composting/sift-compost)

The sections below list, for each quest:

- Dialogue `requiresItems` gates
- Dialogue `grantsItems` lists (currently none in this questline)
- Quest reward item list
- Exact process links plus each process's `requireItems`, `consumeItems`, and `createItems`

---

## 1) Start a Compost Bucket (`composting/start`)

**Quest prerequisite:** `hydroponics/basil`

### Processes used

#### [`start-compost-bin`](/processes/start-compost-bin) — Vent and layer a kitchen compost bucket

- **Requires:** 5 gallon bucket (1), nitrile gloves (pair) (1)
- **Consumes:** bundle of basil leaves (2), harvested basil plant (1)
- **Creates:** layered compost bucket (1)

### Dialogue `requiresItems` gates

- `run-process-hint` → “I ran it on the item page and made a layered compost bucket.”
    - layered compost bucket (1)
- `finish` → “Compost bucket started”
    - layered compost bucket (1)

### Dialogue `grantsItems`

- None

### Quest rewards

- Lettuce Seeds (2)
- compost sifter (1)

---

## 2) Turn Your Compost Bucket (`composting/turn-pile`)

**Quest prerequisite:** `composting/start`

### Processes used

#### [`turn-compost-bucket`](/processes/turn-compost-bucket) — Aerate and mix a layered compost bucket

- **Requires:** 5 gallon bucket (1), nitrile gloves (pair) (1), layered compost bucket (1)
- **Consumes:** layered compost bucket (1)
- **Creates:** active compost bucket (1)

#### [`measure-compost-temperature`](/processes/measure-compost-temperature) — Check core temperature

- **Requires:** compost thermometer (1), active compost bucket (1)
- **Consumes:** none
- **Creates:** compost temperature log (1)

#### [`measure-compost-moisture`](/processes/measure-compost-moisture) — Gauge compost moisture

- **Requires:** compost moisture meter (1), active compost bucket (1)
- **Consumes:** none
- **Creates:** compost moisture log (1)

### Dialogue `requiresItems` gates

- `start` → “Gloves on; bucket needs air.”
    - 5 gallon bucket (1), nitrile gloves (pair) (1), layered compost bucket (1)
- `mix` → “Check core temperature”
    - active compost bucket (1), compost thermometer (1)
- `mix` → “Measure moisture level”
    - compost temperature log (1), active compost bucket (1), compost moisture meter (1)
- `mix` → “Mix is fluffy and capped”
    - active compost bucket (1), compost temperature log (1), compost moisture log (1)
- `finish` → “Aerated and logged”
    - active compost bucket (1), compost temperature log (1), compost moisture log (1)

### Dialogue `grantsItems`

- None

### Quest rewards

- compost thermometer (1)
- compost moisture meter (1)

---

## 3) Check Compost Temperature (`composting/check-temperature`)

**Quest prerequisite:** `composting/turn-pile`

### Processes used

#### [`measure-compost-temperature`](/processes/measure-compost-temperature)

- **Requires:** compost thermometer (1), active compost bucket (1)
- **Consumes:** none
- **Creates:** compost temperature log (1)

#### [`measure-compost-moisture`](/processes/measure-compost-moisture)

- **Requires:** compost moisture meter (1), active compost bucket (1)
- **Consumes:** none
- **Creates:** compost moisture log (1)

#### [`recheck-compost-temperature`](/processes/recheck-compost-temperature)

- **Requires:** compost thermometer (1), active compost bucket (1), compost temperature log (1), compost moisture log (1)
- **Consumes:** none
- **Creates:** compost temperature log (1)

#### [`cure-compost-bucket`](/processes/cure-compost-bucket)

- **Requires:** active compost bucket (1), compost temperature log (2), compost moisture log (1)
- **Consumes:** active compost bucket (1)
- **Creates:** cured compost bucket (1)

### Dialogue `requiresItems` gates

- `start` → “Ready to take readings.”
    - active compost bucket (1)
- `probe` → “Log the temperature”
    - compost thermometer (1), active compost bucket (1)
- `probe` → “Check moisture too”
    - compost moisture meter (1), active compost bucket (1)
- `moisture` → “Record the moisture”
    - compost moisture meter (1), active compost bucket (1)
- `moisture` → “Readings logged”
    - compost temperature log (1), compost moisture log (1)
- `recheck` → “Two temps and moisture are logged”
    - compost temperature log (2), compost moisture log (1)
- `cooldown` → “Start the cure rest”
    - active compost bucket (1), compost temperature log (2), compost moisture log (1)
- `cooldown` → “Bucket has cooled and smells earthy”
    - cured compost bucket (1)
- `finish` → “On to sifting!”
    - cured compost bucket (1)

### Dialogue `grantsItems`

- None

### Quest rewards

- cured compost bucket (1)

---

## 4) Sift Finished Compost (`composting/sift-compost`)

**Quest prerequisite:** `composting/check-temperature`

### Processes used

#### [`sift-compost`](/processes/sift-compost) — Screen finished compost into a fine blend

- **Requires:** compost sifter (1), nitrile gloves (pair) (1), cured compost bucket (1)
- **Consumes:** cured compost bucket (1)
- **Creates:** screened compost blend (1)

### Dialogue `requiresItems` gates

- `start` → “Cured bucket and gloves ready.”
    - cured compost bucket (1), nitrile gloves (pair) (1)
- `setup` → “Sift the compost”
    - compost sifter (1), nitrile gloves (pair) (1), cured compost bucket (1)
- `setup` → “Screening complete.”
    - screened compost blend (1)
- `finish` → “Can't wait to use it!”
    - screened compost blend (1)

### Dialogue `grantsItems`

- None

### Quest rewards

- cured compost bucket (1)

---

## QA flow notes (to verify natural progression)

- The quest chain now explicitly requires **two compost temperature logs** before curing in
  `composting/check-temperature`.
- This avoids the confusing case where curing could be started with only one temperature check.
- You can still skip rerunning a process if you already have the exact required inventory from
  prior actions, but progression gates now match the intended minimum evidence for cooldown.

## Key gear

- 5 gallon bucket with airflow holes for a compact compost vessel
- Compost thermometer and compost moisture meter for core readings
- Compost temperature log and compost moisture log to track trends
- Compost sifter to screen finished material

## Common pitfalls

- Running too wet or too dry (aim for the "wrung sponge" feel)
- Skipping turns, which slows decomposition and creates odors
- Using compost before it cools and cures fully

## Next steps

- Aim for a screened compost blend before top-dressing beds or pots.
- Use the same logging habits in [Hydroponics](/docs/hydroponics) and other grow skills.
