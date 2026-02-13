---
title: 'Chemistry'
slug: 'chemistry'
---

Chemistry quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Demonstrate a Safe Chemical Reaction (`chemistry/safe-reaction`)

- Quest link: [/quests/chemistry/safe-reaction](/quests/chemistry/safe-reaction)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 2) Measure Solution pH (`chemistry/ph-test`)

- Quest link: [/quests/chemistry/ph-test](/quests/chemistry/ph-test)
- Unlock prerequisite:
  - `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
  - `measure` → "Result logged"
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 3455faac-8811-4991-b818-cecb98e8fff7 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [measure-ph](/processes/measure-ph)
    - Requires:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 4d1a3894-e471-4483-8ae6-c6e12db1afae ×1
    - Consumes:
      - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - Creates:
      - 5456a6a5-5da9-46a0-aa4e-a74b6814404a ×1

---

## 3) Dilute Hydrochloric Acid Safely (`chemistry/acid-dilution`)

- Quest link: [/quests/chemistry/acid-dilution](/quests/chemistry/acid-dilution)
- Unlock prerequisite:
  - `chemistry/ph-test`
- Dialogue `requiresItems` gates:
  - `dilute` → "Solution mixed safely."
    - 10fab5e7-036b-4f8f-9f35-84117bc8ef09 ×1
    - c46e98b4-0c1a-478b-988c-8c9260dce434 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 3455faac-8811-4991-b818-cecb98e8fff7 ×1
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - 7311a2ab-59b2-49cb-93cd-d59aab9dc68a ×1
    - 97b735d8-0d76-4fe5-908c-781178ff6308 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [wash-hands](/processes/wash-hands)
    - Requires:
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Creates:
      - None

---

## 4) Neutralize an Acid Spill (`chemistry/acid-neutralization`)

- Quest link: [/quests/chemistry/acid-neutralization](/quests/chemistry/acid-neutralization)
- Unlock prerequisite:
  - `chemistry/ph-test`
- Dialogue `requiresItems` gates:
  - `neutralize` → "The spill is neutralized."
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [neutralize-acid](/processes/neutralize-acid)
    - Requires: Unknown process id in canonical process list

---

## 5) Prepare a Buffer Solution (`chemistry/buffer-solution`)

- Quest link: [/quests/chemistry/buffer-solution](/quests/chemistry/buffer-solution)
- Unlock prerequisite:
  - `chemistry/ph-test`
- Dialogue `requiresItems` gates:
  - `mix` → "pH is stable around 7."
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [measure-ph](/processes/measure-ph)
    - Requires:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 4d1a3894-e471-4483-8ae6-c6e12db1afae ×1
    - Consumes:
      - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - Creates:
      - 5456a6a5-5da9-46a0-aa4e-a74b6814404a ×1

---

## 6) Adjust Solution pH (`chemistry/ph-adjustment`)

- Quest link: [/quests/chemistry/ph-adjustment](/quests/chemistry/ph-adjustment)
- Unlock prerequisite:
  - `chemistry/buffer-solution`
- Dialogue `requiresItems` gates:
  - `adjust` → "The pH is on target."
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [adjust-ph](/processes/adjust-ph)
    - Requires:
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - c46e98b4-0c1a-478b-988c-8c9260dce434 ×1
      - d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04 ×1
      - 9cdd41b1-392e-40c2-8072-0c1351b1a26b ×1
    - Consumes:
      - d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04 ×0.05
      - 9cdd41b1-392e-40c2-8072-0c1351b1a26b ×0.05
    - Creates:
      - None

---

## 7) Form a Precipitate (`chemistry/precipitation-reaction`)

- Quest link: [/quests/chemistry/precipitation-reaction](/quests/chemistry/precipitation-reaction)
- Unlock prerequisite:
  - `chemistry/ph-adjustment`
- Dialogue `requiresItems` gates:
  - `mix` → "A solid precipitate settles."
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [wash-hands](/processes/wash-hands)
    - Requires:
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Creates:
      - None

---

## 8) Extract Stevia Sweetener (`chemistry/stevia-extraction`)

- Quest link: [/quests/chemistry/stevia-extraction](/quests/chemistry/stevia-extraction)
- Unlock prerequisite:
  - `hydroponics/stevia`
  - `chemistry/safe-reaction`
- Dialogue `requiresItems` gates:
  - `extract` → "The extract looks ready!"
    - a7cb182c-f491-4f49-8d36-964886d0d055 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [extract-stevia](/processes/extract-stevia)
    - Requires:
      - None
    - Consumes:
      - c5d9469f-9e86-40c7-8b98-14b8b4ae91ae ×10
    - Creates:
      - a7cb182c-f491-4f49-8d36-964886d0d055 ×1

---

## 9) Refine Stevia Crystals (`chemistry/stevia-crystals`)

- Quest link: [/quests/chemistry/stevia-crystals](/quests/chemistry/stevia-crystals)
- Unlock prerequisite:
  - `chemistry/stevia-extraction`
- Dialogue `requiresItems` gates:
  - `purify` → "I see white crystals!"
    - e1714868-aa17-4f04-ac09-13ac4d7ecea0 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [purify-stevia](/processes/purify-stevia)
    - Requires:
      - None
    - Consumes:
      - a7cb182c-f491-4f49-8d36-964886d0d055 ×1
    - Creates:
      - e1714868-aa17-4f04-ac09-13ac4d7ecea0 ×1

---

## 10) Taste Test Stevia Crystals (`chemistry/stevia-tasting`)

- Quest link: [/quests/chemistry/stevia-tasting](/quests/chemistry/stevia-tasting)
- Unlock prerequisite:
  - `chemistry/stevia-crystals`
- Dialogue `requiresItems` gates:
  - `start` → "Gloves and goggles on."
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - `prep` → "Solution mixed and labeled."
    - e1714868-aa17-4f04-ac09-13ac4d7ecea0 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 10fab5e7-036b-4f8f-9f35-84117bc8ef09 ×1
    - 4d1a3894-e471-4483-8ae6-c6e12db1afae ×1
    - c46e98b4-0c1a-478b-988c-8c9260dce434 ×1
  - `taste` → "Logged flavor notes."
    - d8e22b52-4807-4f8d-b901-5aee64a5770c ×1
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
  - `finish` → "Ready for the next batch."
    - fe146f9d-d912-4841-bf1f-1675c3aa93f3 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## QA flow notes

- Cross-quest dependencies:
  - `chemistry/safe-reaction` depends on external quests: `welcome/howtodoquests`.
  - `chemistry/stevia-extraction` depends on external quests: `hydroponics/stevia`.
- Progression integrity checks:
  - `chemistry/safe-reaction`: verify prerequisite completion and inventory gates.
  - `chemistry/ph-test`: verify prerequisite completion and inventory gates.
  - `chemistry/acid-dilution`: verify prerequisite completion and inventory gates.
  - `chemistry/acid-neutralization`: verify prerequisite completion and inventory gates.
  - `chemistry/buffer-solution`: verify prerequisite completion and inventory gates.
  - `chemistry/ph-adjustment`: verify prerequisite completion and inventory gates.
  - `chemistry/precipitation-reaction`: verify prerequisite completion and inventory gates.
  - `chemistry/stevia-extraction`: verify prerequisite completion and inventory gates.
  - `chemistry/stevia-crystals`: verify prerequisite completion and inventory gates.
  - `chemistry/stevia-tasting`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
