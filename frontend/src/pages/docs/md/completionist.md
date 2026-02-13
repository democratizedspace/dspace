---
title: 'Completionist'
slug: 'completionist'
---

This page documents the full **Completionist** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Congrats for finishing all the quests!!](/quests/completionist/v2) (`completionist/v2`)
2. [Catalog Your Trophy](/quests/completionist/catalog) (`completionist/catalog`)
3. [Show Off Your Trophy](/quests/completionist/display) (`completionist/display`)
4. [Polish Your Trophy](/quests/completionist/polish) (`completionist/polish`)
5. [Check for New Quests](/quests/completionist/reminder) (`completionist/reminder`)

## Quest details

### 1) Congrats for finishing all the quests!! (`completionist/v2`)
- Quest link: `/quests/completionist/v2`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`, `ubi/basicincome`, `3dprinter/start`, `aquaria/water-testing`, `energy/solar`, `rocketry/parachute`, `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - Node `prep-printer` / Printer is leveled and loaded: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x150
  - Node `print-core` / Core is printed and cool: Completionist Award II core (`0c0db0db-585f-4eca-b0d9-56fbed5ecfb6`) x1
  - Node `print-plate` / Plate fits the recess: Completionist Award II core (`0c0db0db-585f-4eca-b0d9-56fbed5ecfb6`) x1; Completionist Award II nameplate (`a0fc23b6-3460-404f-bd16-dfb5700f7326`) x1
  - Node `assemble` / Award is bonded and cured: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-completionist-award-ii`](/processes/assemble-completionist-award-ii)
    - Requires: Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1; superglue (`7bc8b73f-6e66-469d-865f-12d0cb36677a`) x1
    - Consumes: Completionist Award II core (`0c0db0db-585f-4eca-b0d9-56fbed5ecfb6`) x1; Completionist Award II nameplate (`a0fc23b6-3460-404f-bd16-dfb5700f7326`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x0.1; superglue (`7bc8b73f-6e66-469d-865f-12d0cb36677a`) x0.1
    - Creates: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
  - [`level-3d-printer-bed`](/processes/level-3d-printer-bed)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - [`print-completionist-core`](/processes/print-completionist-core)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x150; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1200
    - Creates: Completionist Award II core (`0c0db0db-585f-4eca-b0d9-56fbed5ecfb6`) x1
  - [`print-completionist-plate`](/processes/print-completionist-plate)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x30; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x250
    - Creates: Completionist Award II nameplate (`a0fc23b6-3460-404f-bd16-dfb5700f7326`) x1

### 2) Catalog Your Trophy (`completionist/catalog`)
- Quest link: `/quests/completionist/catalog`
- Unlock prerequisite (`requiresQuests`): `completionist/v2`
- Dialogue `requiresItems` gates:
  - Node `start` / Yeah, let's catalog it: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
  - Node `prep` / Entry saved with serial and placement noted: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1; completionist trophy log entry (`78896eea-e4a6-40d1-9b93-522482b71f4f`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`record-completionist-award-entry`](/processes/record-completionist-award-entry)
    - Requires: mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1; smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
    - Consumes: None
    - Creates: completionist trophy log entry (`78896eea-e4a6-40d1-9b93-522482b71f4f`) x1

### 3) Show Off Your Trophy (`completionist/display`)
- Quest link: `/quests/completionist/display`
- Unlock prerequisite (`requiresQuests`): `completionist/v2`
- Dialogue `requiresItems` gates:
  - Node `start` / Let's find the perfect spot: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
  - Node `dust` / Shelf is dusted and trophy gleams: Completionist Award II (polished) (`1030a6c5-88b9-46e9-b38a-b20d8d326764`) x1
  - Node `place` / Award is staged with lighting: Completionist Award II (displayed) (`a8120ce3-4a9d-4d49-b955-92bd9d7fbc07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`polish-completionist-award`](/processes/polish-completionist-award)
    - Requires: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Consumes: paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x0.1; Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
    - Creates: Completionist Award II (polished) (`1030a6c5-88b9-46e9-b38a-b20d8d326764`) x1
  - [`stage-completionist-award`](/processes/stage-completionist-award)
    - Requires: Bookshelf (`619d485d-803f-4875-a048-157ce28d31c4`) x1; Completionist Award II (polished) (`1030a6c5-88b9-46e9-b38a-b20d8d326764`) x1
    - Consumes: Completionist Award II (polished) (`1030a6c5-88b9-46e9-b38a-b20d8d326764`) x1
    - Creates: Completionist Award II (displayed) (`a8120ce3-4a9d-4d49-b955-92bd9d7fbc07`) x1

### 4) Polish Your Trophy (`completionist/polish`)
- Quest link: `/quests/completionist/polish`
- Unlock prerequisite (`requiresQuests`): `completionist/v2`
- Dialogue `requiresItems` gates:
  - Node `start` / Absolutely, let's polish it: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
  - Node `prep` / Here it is, sparkling: Completionist Award II (polished) (`1030a6c5-88b9-46e9-b38a-b20d8d326764`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`polish-completionist-award`](/processes/polish-completionist-award)
    - Requires: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Consumes: paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x0.1; Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
    - Creates: Completionist Award II (polished) (`1030a6c5-88b9-46e9-b38a-b20d8d326764`) x1

### 5) Check for New Quests (`completionist/reminder`)
- Quest link: `/quests/completionist/reminder`
- Unlock prerequisite (`requiresQuests`): `completionist/polish`
- Dialogue `requiresItems` gates:
  - Node `start` / I'll check back: Completionist Award II (`c01676ec-27e5-4a53-9a47-24bf6c5a56a9`) x1
  - Node `remind` / Reminder set: weekly quest reminder (`07d9b966-da28-465e-81b6-d6bd774326aa`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`schedule-quest-reminder`](/processes/schedule-quest-reminder)
    - Requires: smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1
    - Consumes: None
    - Creates: weekly quest reminder (`07d9b966-da28-465e-81b6-d6bd774326aa`) x1

## QA flow notes

- Cross-quest dependencies are enforced through `requiresQuests` and per-node item gates listed above.
- Progression integrity checks:
  - Verify each quest unlocks only after listed prerequisites are completed.
  - Verify each gated dialogue option appears only when required item counts are met.
  - Verify process outputs satisfy downstream quest gates without requiring unrelated items.
- Known pitfalls to test:
  - Reused processes across quests may require multiple item counts (confirm minimum counts before continue options).
  - If a process is repeatable, ensure “continue” dialogue remains blocked until expected logs/artifacts exist.
- End-to-end validation walkthrough:
  - Complete quests in tree order from the first root quest.
  - At each quest, run every listed process path at least once and confirm resulting inventory deltas.
  - Re-open the next quest and confirm required items and prerequisites are recognized correctly.
