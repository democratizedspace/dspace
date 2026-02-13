---
title: 'Chemistry'
slug: 'chemistry'
---

This page documents the full **Chemistry** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Demonstrate a Safe Chemical Reaction](/quests/chemistry/safe-reaction) (`chemistry/safe-reaction`)
2. [Measure Solution pH](/quests/chemistry/ph-test) (`chemistry/ph-test`)
3. [Dilute Hydrochloric Acid Safely](/quests/chemistry/acid-dilution) (`chemistry/acid-dilution`)
4. [Neutralize an Acid Spill](/quests/chemistry/acid-neutralization) (`chemistry/acid-neutralization`)
5. [Prepare a Buffer Solution](/quests/chemistry/buffer-solution) (`chemistry/buffer-solution`)
6. [Adjust Solution pH](/quests/chemistry/ph-adjustment) (`chemistry/ph-adjustment`)
7. [Form a Precipitate](/quests/chemistry/precipitation-reaction) (`chemistry/precipitation-reaction`)
8. [Extract Stevia Sweetener](/quests/chemistry/stevia-extraction) (`chemistry/stevia-extraction`)
9. [Refine Stevia Crystals](/quests/chemistry/stevia-crystals) (`chemistry/stevia-crystals`)
10. [Taste Test Stevia Crystals](/quests/chemistry/stevia-tasting) (`chemistry/stevia-tasting`)

## Quest details

### 1) Demonstrate a Safe Chemical Reaction (`chemistry/safe-reaction`)
- Quest link: `/quests/chemistry/safe-reaction`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - None
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 2) Measure Solution pH (`chemistry/ph-test`)
- Quest link: `/quests/chemistry/ph-test`
- Unlock prerequisite (`requiresQuests`): `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
  - Node `measure` / Result logged: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; lab coat (`3455faac-8811-4991-b818-cecb98e8fff7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-ph`](/processes/measure-ph)
    - Requires: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; 100 mL graduated cylinder (`4d1a3894-e471-4483-8ae6-c6e12db1afae`) x1
    - Consumes: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
    - Creates: hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1

### 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)
- Quest link: `/quests/chemistry/acid-dilution`
- Unlock prerequisite (`requiresQuests`): `chemistry/ph-test`
- Dialogue `requiresItems` gates:
  - Node `dilute` / Solution mixed safely.: 250 mL glass beaker (`10fab5e7-036b-4f8f-9f35-84117bc8ef09`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; lab coat (`3455faac-8811-4991-b818-cecb98e8fff7`) x1; pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1; hydrochloric acid (37%, 500 mL) (`7311a2ab-59b2-49cb-93cd-d59aab9dc68a`) x1; spill tray (`97b735d8-0d76-4fe5-908c-781178ff6308`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`wash-hands`](/processes/wash-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None

### 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)
- Quest link: `/quests/chemistry/acid-neutralization`
- Unlock prerequisite (`requiresQuests`): `chemistry/ph-test`
- Dialogue `requiresItems` gates:
  - Node `neutralize` / The spill is neutralized.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - `neutralize-acid` (process definition not found)

### 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)
- Quest link: `/quests/chemistry/buffer-solution`
- Unlock prerequisite (`requiresQuests`): `chemistry/ph-test`
- Dialogue `requiresItems` gates:
  - Node `mix` / pH is stable around 7.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-ph`](/processes/measure-ph)
    - Requires: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; 100 mL graduated cylinder (`4d1a3894-e471-4483-8ae6-c6e12db1afae`) x1
    - Consumes: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
    - Creates: hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1

### 6) Adjust Solution pH (`chemistry/ph-adjustment`)
- Quest link: `/quests/chemistry/ph-adjustment`
- Unlock prerequisite (`requiresQuests`): `chemistry/buffer-solution`
- Dialogue `requiresItems` gates:
  - Node `adjust` / The pH is on target.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`adjust-ph`](/processes/adjust-ph)
    - Requires: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1; pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x1; pH up solution (potassium carbonate) (`9cdd41b1-392e-40c2-8072-0c1351b1a26b`) x1
    - Consumes: pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x0.05; pH up solution (potassium carbonate) (`9cdd41b1-392e-40c2-8072-0c1351b1a26b`) x0.05
    - Creates: None

### 7) Form a Precipitate (`chemistry/precipitation-reaction`)
- Quest link: `/quests/chemistry/precipitation-reaction`
- Unlock prerequisite (`requiresQuests`): `chemistry/ph-adjustment`
- Dialogue `requiresItems` gates:
  - Node `mix` / A solid precipitate settles.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`wash-hands`](/processes/wash-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None

### 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)
- Quest link: `/quests/chemistry/stevia-extraction`
- Unlock prerequisite (`requiresQuests`): `hydroponics/stevia`, `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
  - Node `extract` / The extract looks ready!: stevia extract (`a7cb182c-f491-4f49-8d36-964886d0d055`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`extract-stevia`](/processes/extract-stevia)
    - Requires: None
    - Consumes: bundle of stevia leaves (`c5d9469f-9e86-40c7-8b98-14b8b4ae91ae`) x10
    - Creates: stevia extract (`a7cb182c-f491-4f49-8d36-964886d0d055`) x1

### 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)
- Quest link: `/quests/chemistry/stevia-crystals`
- Unlock prerequisite (`requiresQuests`): `chemistry/stevia-extraction`
- Dialogue `requiresItems` gates:
  - Node `purify` / I see white crystals!: stevia crystals (`e1714868-aa17-4f04-ac09-13ac4d7ecea0`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`purify-stevia`](/processes/purify-stevia)
    - Requires: None
    - Consumes: stevia extract (`a7cb182c-f491-4f49-8d36-964886d0d055`) x1
    - Creates: stevia crystals (`e1714868-aa17-4f04-ac09-13ac4d7ecea0`) x1

### 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)
- Quest link: `/quests/chemistry/stevia-tasting`
- Unlock prerequisite (`requiresQuests`): `chemistry/stevia-crystals`
- Dialogue `requiresItems` gates:
  - Node `start` / Gloves and goggles on.: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `prep` / Solution mixed and labeled.: stevia crystals (`e1714868-aa17-4f04-ac09-13ac4d7ecea0`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; 250 mL glass beaker (`10fab5e7-036b-4f8f-9f35-84117bc8ef09`) x1; 100 mL graduated cylinder (`4d1a3894-e471-4483-8ae6-c6e12db1afae`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1
  - Node `taste` / Logged flavor notes.: stevia tasting solution (`d8e22b52-4807-4f8d-b901-5aee64a5770c`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
  - Node `finish` / Ready for the next batch.: stevia tasting notes (`fe146f9d-d912-4841-bf1f-1675c3aa93f3`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`mix-stevia-tasting-solution`](/processes/mix-stevia-tasting-solution)
    - Requires: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; 250 mL glass beaker (`10fab5e7-036b-4f8f-9f35-84117bc8ef09`) x1; 100 mL graduated cylinder (`4d1a3894-e471-4483-8ae6-c6e12db1afae`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1
    - Consumes: stevia crystals (`e1714868-aa17-4f04-ac09-13ac4d7ecea0`) x0.05
    - Creates: stevia tasting solution (`d8e22b52-4807-4f8d-b901-5aee64a5770c`) x1
  - [`record-stevia-tasting-notes`](/processes/record-stevia-tasting-notes)
    - Requires: stevia tasting solution (`d8e22b52-4807-4f8d-b901-5aee64a5770c`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: stevia tasting solution (`d8e22b52-4807-4f8d-b901-5aee64a5770c`) x1
    - Creates: stevia tasting notes (`fe146f9d-d912-4841-bf1f-1675c3aa93f3`) x1

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
