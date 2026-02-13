---
title: 'Completionist'
slug: 'completionist'
---

Completionist quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Congrats for finishing all the quests!!](/quests/completionist/v2) (`completionist/v2`)
2. [Catalog Your Trophy](/quests/completionist/catalog) (`completionist/catalog`)
3. [Show Off Your Trophy](/quests/completionist/display) (`completionist/display`)
4. [Polish Your Trophy](/quests/completionist/polish) (`completionist/polish`)
5. [Check for New Quests](/quests/completionist/reminder) (`completionist/reminder`)

---

## 1) Congrats for finishing all the quests!! (`completionist/v2`)

- Quest link: [/quests/completionist/v2](/quests/completionist/v2)
- Unlock prerequisite:
  - `welcome/howtodoquests`
  - `ubi/basicincome`
  - `3dprinter/start`
  - `aquaria/water-testing`
  - `energy/solar`
  - `rocketry/parachute`
  - `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - `prep-printer` → "Printer is leveled and loaded"
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×150
  - `print-core` → "Core is printed and cool"
    - 0c0db0db-585f-4eca-b0d9-56fbed5ecfb6 ×1
  - `print-plate` → "Plate fits the recess"
    - 0c0db0db-585f-4eca-b0d9-56fbed5ecfb6 ×1
    - a0fc23b6-3460-404f-bd16-dfb5700f7326 ×1
  - `assemble` → "Award is bonded and cured"
    - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-completionist-award-ii](/processes/assemble-completionist-award-ii)
    - Requires:
      - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
      - 7bc8b73f-6e66-469d-865f-12d0cb36677a ×1
    - Consumes:
      - 0c0db0db-585f-4eca-b0d9-56fbed5ecfb6 ×1
      - a0fc23b6-3460-404f-bd16-dfb5700f7326 ×1
      - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×0.1
      - 7bc8b73f-6e66-469d-865f-12d0cb36677a ×0.1
    - Creates:
      - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
  - [level-3d-printer-bed](/processes/level-3d-printer-bed)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - [print-completionist-core](/processes/print-completionist-core)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×150
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1200
    - Creates:
      - 0c0db0db-585f-4eca-b0d9-56fbed5ecfb6 ×1
  - [print-completionist-plate](/processes/print-completionist-plate)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×30
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×250
    - Creates:
      - a0fc23b6-3460-404f-bd16-dfb5700f7326 ×1

---

## 2) Catalog Your Trophy (`completionist/catalog`)

- Quest link: [/quests/completionist/catalog](/quests/completionist/catalog)
- Unlock prerequisite:
  - `completionist/v2`
- Dialogue `requiresItems` gates:
  - `start` → "Yeah, let's catalog it"
    - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
  - `prep` → "Entry saved with serial and placement noted"
    - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
    - 78896eea-e4a6-40d1-9b93-522482b71f4f ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [record-completionist-award-entry](/processes/record-completionist-award-entry)
    - Requires:
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
      - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
    - Consumes:
      - None
    - Creates:
      - 78896eea-e4a6-40d1-9b93-522482b71f4f ×1

---

## 3) Show Off Your Trophy (`completionist/display`)

- Quest link: [/quests/completionist/display](/quests/completionist/display)
- Unlock prerequisite:
  - `completionist/v2`
- Dialogue `requiresItems` gates:
  - `start` → "Let's find the perfect spot"
    - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
  - `dust` → "Shelf is dusted and trophy gleams"
    - 1030a6c5-88b9-46e9-b38a-b20d8d326764 ×1
  - `place` → "Award is staged with lighting"
    - a8120ce3-4a9d-4d49-b955-92bd9d7fbc07 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [polish-completionist-award](/processes/polish-completionist-award)
    - Requires:
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Consumes:
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×0.1
      - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
    - Creates:
      - 1030a6c5-88b9-46e9-b38a-b20d8d326764 ×1
  - [stage-completionist-award](/processes/stage-completionist-award)
    - Requires:
      - 619d485d-803f-4875-a048-157ce28d31c4 ×1
      - 1030a6c5-88b9-46e9-b38a-b20d8d326764 ×1
    - Consumes:
      - 1030a6c5-88b9-46e9-b38a-b20d8d326764 ×1
    - Creates:
      - a8120ce3-4a9d-4d49-b955-92bd9d7fbc07 ×1

---

## 4) Polish Your Trophy (`completionist/polish`)

- Quest link: [/quests/completionist/polish](/quests/completionist/polish)
- Unlock prerequisite:
  - `completionist/v2`
- Dialogue `requiresItems` gates:
  - `start` → "Absolutely, let's polish it"
    - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
  - `prep` → "Here it is, sparkling"
    - 1030a6c5-88b9-46e9-b38a-b20d8d326764 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [polish-completionist-award](/processes/polish-completionist-award)
    - Requires:
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Consumes:
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×0.1
      - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
    - Creates:
      - 1030a6c5-88b9-46e9-b38a-b20d8d326764 ×1

---

## 5) Check for New Quests (`completionist/reminder`)

- Quest link: [/quests/completionist/reminder](/quests/completionist/reminder)
- Unlock prerequisite:
  - `completionist/polish`
- Dialogue `requiresItems` gates:
  - `start` → "I'll check back"
    - c01676ec-27e5-4a53-9a47-24bf6c5a56a9 ×1
  - `remind` → "Reminder set"
    - 07d9b966-da28-465e-81b6-d6bd774326aa ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [schedule-quest-reminder](/processes/schedule-quest-reminder)
    - Requires:
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
    - Consumes:
      - None
    - Creates:
      - 07d9b966-da28-465e-81b6-d6bd774326aa ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `completionist/v2` depends on external quests: `welcome/howtodoquests`, `ubi/basicincome`, `3dprinter/start`, `aquaria/water-testing`, `energy/solar`, `rocketry/parachute`, `hydroponics/basil`.
- Progression integrity checks:
  - `completionist/v2`: verify prerequisite completion and inventory gates (notable count gates: 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×150).
  - `completionist/catalog`: verify prerequisite completion and inventory gates.
  - `completionist/display`: verify prerequisite completion and inventory gates.
  - `completionist/polish`: verify prerequisite completion and inventory gates.
  - `completionist/reminder`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
