---
title: 'Composting'
slug: 'composting'
---

Composting quests teach you to turn organic scraps into stable soil amendments. This quest line uses
compact bucket composting with repeatable measurements so QA can validate state transitions.

## What you learn

- How to balance greens and browns for a healthy compost mix
- How to monitor moisture and temperature in the pile over multiple checks
- How to turn, cure, and sift finished compost for garden use

## Quest order (current tree)

1. [Start a Compost Bucket](/quests/composting/start)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile)
3. [Check Compost Temperature](/quests/composting/check-temperature)
4. [Sift Finished Compost](/quests/composting/sift-compost)

---

## 1) Start a Compost Bucket (`composting/start`)

**Unlock prerequisite**

- `requiresQuests`: `hydroponics/basil`

**Processes used**

- [`start-compost-bin`](/processes/start-compost-bin)
  - Requires: 5 gallon bucket ×1, nitrile gloves (pair) ×1
  - Consumes: bundle of basil leaves ×2, harvested basil plant ×1
  - Creates: layered compost bucket ×1

**Quest requiresItems gates**

- `run-process-hint` → “I ran it on the item page and made a layered compost bucket.”
  - layered compost bucket ×1
- `finish` → “Compost bucket started”
  - layered compost bucket ×1

**Quest grantsItems**

- None

**Quest rewards**

- Lettuce Seeds ×2
- compost sifter ×1

---

## 2) Turn Your Compost Bucket (`composting/turn-pile`)

**Unlock prerequisite**

- `requiresQuests`: `composting/start`

**Processes used**

- [`turn-compost-bucket`](/processes/turn-compost-bucket)
  - Requires: 5 gallon bucket ×1, nitrile gloves (pair) ×1, layered compost bucket ×1
  - Consumes: layered compost bucket ×1
  - Creates: active compost bucket ×1
- [`measure-compost-temperature`](/processes/measure-compost-temperature)
  - Requires: compost thermometer ×1, active compost bucket ×1
  - Consumes: none
  - Creates: compost temperature log ×1
- [`measure-compost-moisture`](/processes/measure-compost-moisture)
  - Requires: compost moisture meter ×1, active compost bucket ×1
  - Consumes: none
  - Creates: compost moisture log ×1

**Quest requiresItems gates**

- `start` → “Gloves on; bucket needs air.”
  - 5 gallon bucket ×1, nitrile gloves (pair) ×1, layered compost bucket ×1
- `mix` → “Check core temperature”
  - active compost bucket ×1, compost thermometer ×1
- `mix` → “Measure moisture level”
  - compost temperature log ×1, active compost bucket ×1, compost moisture meter ×1
- `mix` → “Mix is fluffy and capped”
  - active compost bucket ×1, compost temperature log ×1, compost moisture log ×1
- `finish` → “Aerated and logged”
  - active compost bucket ×1, compost temperature log ×1, compost moisture log ×1

**Quest grantsItems**

- None

**Quest rewards**

- compost thermometer ×1
- compost moisture meter ×1

---

## 3) Check Compost Temperature (`composting/check-temperature`)

**Unlock prerequisite**

- `requiresQuests`: `composting/turn-pile`

**Processes used**

- [`measure-compost-temperature`](/processes/measure-compost-temperature)
  - Requires: compost thermometer ×1, active compost bucket ×1
  - Consumes: none
  - Creates: compost temperature log ×1
- [`measure-compost-moisture`](/processes/measure-compost-moisture)
  - Requires: compost moisture meter ×1, active compost bucket ×1
  - Consumes: none
  - Creates: compost moisture log ×1
- [`recheck-compost-temperature`](/processes/recheck-compost-temperature)
  - Requires: compost thermometer ×1, active compost bucket ×1,
    compost temperature log ×1, compost moisture log ×1
  - Consumes: none
  - Creates: compost temperature log ×1
- [`cure-compost-bucket`](/processes/cure-compost-bucket)
  - Requires: active compost bucket ×1, compost temperature log ×1, compost moisture log ×1
  - Consumes: active compost bucket ×1
  - Creates: cured compost bucket ×1

> Note: The process itself requires one temperature log, but this quest deliberately adds a stricter
> gate at `cooldown` and `finish` that requires **two** temperature logs plus one moisture log so QA
> can verify the second-reading progression explicitly.

**Quest requiresItems gates**

- `start` → “Ready to take readings.”
  - active compost bucket ×1
- `probe` → “Log the temperature” (process option gate)
  - compost thermometer ×1, active compost bucket ×1
- `probe` → “Check moisture too”
  - compost moisture meter ×1, active compost bucket ×1
- `moisture` → “Record the moisture” (process option gate)
  - compost moisture meter ×1, active compost bucket ×1
- `moisture` → “Readings logged”
  - compost temperature log ×1, compost moisture log ×1
- `recheck` → “Two temps and moisture are logged”
  - compost temperature log ×2, compost moisture log ×1
- `cooldown` → “Start the cure rest” (process option gate)
  - active compost bucket ×1, compost temperature log ×2, compost moisture log ×1
- `cooldown` → “Bucket has cooled and smells earthy”
  - cured compost bucket ×1
- `finish` → “On to sifting!”
  - cured compost bucket ×1, compost temperature log ×2, compost moisture log ×1

**Quest grantsItems**

- None

**Quest rewards**

- cured compost bucket ×1

---

## 4) Sift Finished Compost (`composting/sift-compost`)

**Unlock prerequisite**

- `requiresQuests`: `composting/check-temperature`

**Processes used**

- [`sift-compost`](/processes/sift-compost)
  - Requires: compost sifter ×1, nitrile gloves (pair) ×1, cured compost bucket ×1
  - Consumes: cured compost bucket ×1
  - Creates: screened compost blend ×1

**Quest requiresItems gates**

- `start` → “Cured bucket and gloves ready.”
  - cured compost bucket ×1, nitrile gloves (pair) ×1
- `setup` → “Sift the compost” (process option gate)
  - compost sifter ×1, nitrile gloves (pair) ×1, cured compost bucket ×1
- `setup` → “Screening complete.”
  - screened compost blend ×1
- `finish` → “Can't wait to use it!”
  - screened compost blend ×1

**Quest grantsItems**

- None

**Quest rewards**

- cured compost bucket ×1

---

## QA flow notes

- Temperature is intentionally logged multiple times across quests. The full path now explicitly
  gates progression on two compost temperature logs in `composting/check-temperature` before cure
  completion, which makes the “second reading” requirement visible and testable.
- Shared processes (especially temperature and moisture checks) are reused across quests, but each
  quest now documents exactly which inventory states must exist to continue.

## Next steps

- Aim for a screened compost blend before top-dressing beds or pots.
- Use the same logging habits in [Hydroponics](/docs/hydroponics) and other grow skills.
