---
title: 'Composting'
slug: 'composting'
---

Composting quests teach you to turn organic scraps into stable soil amendments. This path uses a
bucket compost loop with repeatable checks so QA can validate each state transition.

## Composting quest tree (current 4-quest flow)

1. [Start a Compost Bucket](/quests/composting/start)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile)
3. [Check Compost Temperature](/quests/composting/check-temperature)
4. [Sift Finished Compost](/quests/composting/sift-compost)

## Shared process map

These are the process actions used across the four quests.

| Process | Requires | Consumes | Creates |
| --- | --- | --- | --- |
| [Vent and layer a kitchen compost bucket](/processes/start-compost-bin) | 5 gallon bucket x1, nitrile gloves (pair) x1 | bundle of basil leaves x2, harvested basil plant x1 | layered compost bucket x1 |
| [Aerate and mix a layered compost bucket](/processes/turn-compost-bucket) | 5 gallon bucket x1, nitrile gloves (pair) x1, layered compost bucket x1 | layered compost bucket x1 | active compost bucket x1 |
| [Check core temperature of a compost pile with a compost thermometer](/processes/measure-compost-temperature) | compost thermometer x1, active compost bucket x1 | none | compost temperature log x1 |
| [Gauge compost moisture with a probe meter](/processes/measure-compost-moisture) | compost moisture meter x1, active compost bucket x1 | none | compost moisture log x1 |
| [Re-check compost temperature after moisture adjustment](/processes/recheck-compost-temperature) | compost thermometer x1, active compost bucket x1, compost temperature log x1, compost moisture log x1 | none | compost temperature log x1 |
| [Let a hot compost bucket cool and cure](/processes/cure-compost-bucket) | active compost bucket x1, compost temperature log x1, compost moisture log x1 | active compost bucket x1 | cured compost bucket x1 |
| [Screen finished compost into a fine blend](/processes/sift-compost) | compost sifter x1, nitrile gloves (pair) x1, cured compost bucket x1 | cured compost bucket x1 | screened compost blend x1 |

## Quest-by-quest QA details

### 1) Start a Compost Bucket (`composting/start`)

- **Requires quest(s):** `hydroponics/basil`
- **Primary process in quest:** [`start-compost-bin`](/processes/start-compost-bin)
- **Dialogue `requiresItems` gates:**
  - `run-process-hint -> finish`: layered compost bucket x1
  - `finish` (`type: finish`): layered compost bucket x1
- **Dialogue `grantsItems`:** none
- **Quest rewards:**
  - Lettuce Seeds x2
  - compost sifter x1

### 2) Turn Your Compost Bucket (`composting/turn-pile`)

- **Requires quest(s):** `composting/start`
- **Primary process in quest:** [`turn-compost-bucket`](/processes/turn-compost-bucket)
- **Additional reused processes:**
  - [`measure-compost-temperature`](/processes/measure-compost-temperature)
  - [`measure-compost-moisture`](/processes/measure-compost-moisture)
- **Dialogue `requiresItems` gates:**
  - `start -> mix`: 5 gallon bucket x1, nitrile gloves (pair) x1, layered compost bucket x1
  - `mix -> temp`: active compost bucket x1, compost thermometer x1
  - `mix -> moisture`: compost temperature log x1, active compost bucket x1,
    compost moisture meter x1
  - `mix -> finish`: active compost bucket x1, compost temperature log x1,
    compost moisture log x1
  - `finish` (`type: finish`): active compost bucket x1, compost temperature log x1,
    compost moisture log x1
- **Dialogue `grantsItems`:** none
- **Quest rewards:**
  - compost thermometer x1
  - compost moisture meter x1

### 3) Check Compost Temperature (`composting/check-temperature`)

- **Requires quest(s):** `composting/turn-pile`
- **Primary process sequence in quest:**
  1. [`measure-compost-temperature`](/processes/measure-compost-temperature)
  2. [`measure-compost-moisture`](/processes/measure-compost-moisture)
  3. [`recheck-compost-temperature`](/processes/recheck-compost-temperature)
  4. [`cure-compost-bucket`](/processes/cure-compost-bucket)
- **Dialogue `requiresItems` gates:**
  - `start -> probe`: active compost bucket x1
  - `probe` process (`measure-compost-temperature`): compost thermometer x1,
    active compost bucket x1
  - `probe -> moisture`: compost moisture meter x1, active compost bucket x1
  - `moisture` process (`measure-compost-moisture`): compost moisture meter x1,
    active compost bucket x1
  - `moisture -> recheck`: compost temperature log x1, compost moisture log x1
  - `recheck` process (`recheck-compost-temperature`): compost thermometer x1,
    active compost bucket x1, compost temperature log x1, compost moisture log x1
  - `recheck -> cooldown`: **compost temperature log x2**, compost moisture log x1
  - `cooldown` process (`cure-compost-bucket`): active compost bucket x1,
    **compost temperature log x2**, compost moisture log x1
  - `cooldown -> finish`: cured compost bucket x1
  - `finish` (`type: finish`): cured compost bucket x1
- **Dialogue `grantsItems`:** none
- **Quest rewards:**
  - cured compost bucket x1

### 4) Sift Finished Compost (`composting/sift-compost`)

- **Requires quest(s):** `composting/check-temperature`
- **Primary process in quest:** [`sift-compost`](/processes/sift-compost)
- **Dialogue `requiresItems` gates:**
  - `start -> setup`: cured compost bucket x1, nitrile gloves (pair) x1
  - `setup` process (`sift-compost`): compost sifter x1, nitrile gloves (pair) x1,
    cured compost bucket x1
  - `setup -> finish`: screened compost blend x1
  - `finish` (`type: finish`): screened compost blend x1
- **Dialogue `grantsItems`:** none
- **Quest rewards:**
  - cured compost bucket x1

## QA checklist for natural progression

- The second temperature checkpoint is now explicitly gated in quest dialogue at
  `composting/check-temperature` with a `requiresItems` threshold of
  **compost temperature log x2** before cure/finish progression.
- Temperature and moisture logs are intentionally reused across `turn-pile` and
  `check-temperature`; this is expected and should be validated as cumulative inventory state.
- If balance tuning is needed later, adjust dialogue gates first, then process requirements, so item
  page process cards and quest chat stay consistent.
