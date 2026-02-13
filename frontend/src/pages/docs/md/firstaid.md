---
title: 'Firstaid'
slug: 'firstaid'
---

This page documents the full **Firstaid** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Assemble a First Aid Kit](/quests/firstaid/assemble-kit) (`firstaid/assemble-kit`)
2. [Check Flashlight Battery](/quests/firstaid/flashlight-battery) (`firstaid/flashlight-battery`)
3. [Practice Basic CPR](/quests/firstaid/learn-cpr) (`firstaid/learn-cpr`)
4. [Restock Your First Aid Kit](/quests/firstaid/restock-kit) (`firstaid/restock-kit`)
5. [Dispose Expired First Aid Supplies](/quests/firstaid/dispose-expired) (`firstaid/dispose-expired`)
6. [Sanitize Your CPR Pocket Mask](/quests/firstaid/sanitize-pocket-mask) (`firstaid/sanitize-pocket-mask`)
7. [Stop a Nosebleed](/quests/firstaid/stop-nosebleed) (`firstaid/stop-nosebleed`)
8. [Treat a Minor Burn](/quests/firstaid/treat-burn) (`firstaid/treat-burn`)
9. [Practice Basic Wound Care](/quests/firstaid/wound-care) (`firstaid/wound-care`)
10. [Change a Bandage](/quests/firstaid/change-bandage) (`firstaid/change-bandage`)
11. [Bag Used Bandages](/quests/firstaid/dispose-bandages) (`firstaid/dispose-bandages`)
12. [Remove a Splinter](/quests/firstaid/remove-splinter) (`firstaid/remove-splinter`)
13. [Splint a Minor Fracture](/quests/firstaid/splint-limb) (`firstaid/splint-limb`)

## Quest details

### 1) Assemble a First Aid Kit (`firstaid/assemble-kit`)
- Quest link: `/quests/firstaid/assemble-kit`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `pack` / Supplies packed: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`dry-hands`](/processes/dry-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None
  - [`pack-first-aid-kit`](/processes/pack-first-aid-kit)
    - Requires: None
    - Consumes: adhesive bandages (`1b1030bf-9767-4b16-9ff6-a8e7de28b689`) x1; sterile gauze pads (`cc7d36e7-c66d-466f-9390-f7a365d857b9`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Creates: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
  - [`wash-hands`](/processes/wash-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None

### 2) Check Flashlight Battery (`firstaid/flashlight-battery`)
- Quest link: `/quests/firstaid/flashlight-battery`
- Unlock prerequisite (`requiresQuests`): `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
  - Node `measure` / Battery reads 9 V: red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 9 V battery (`80d30825-a42b-4add-b715-322e1713952c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`check-flashlight-battery`](/processes/check-flashlight-battery)
    - Requires: red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 9 V battery (`80d30825-a42b-4add-b715-322e1713952c`) x1
    - Consumes: None
    - Creates: None

### 3) Practice Basic CPR (`firstaid/learn-cpr`)
- Quest link: `/quests/firstaid/learn-cpr`
- Unlock prerequisite (`requiresQuests`): `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
  - Node `steps` / Practicing now.: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; CPR pocket mask (`a1c7f153-5b2e-443d-936a-47f396a7d191`) x1; CPR training manikin (`b397aa70-3503-4e40-b84a-4d5609578d2b`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1
  - Node `steps` / I know the basics.: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; CPR pocket mask (`a1c7f153-5b2e-443d-936a-47f396a7d191`) x1; CPR training manikin (`b397aa70-3503-4e40-b84a-4d5609578d2b`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`practice-cpr`](/processes/practice-cpr)
    - Requires: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; CPR pocket mask (`a1c7f153-5b2e-443d-936a-47f396a7d191`) x1; CPR training manikin (`b397aa70-3503-4e40-b84a-4d5609578d2b`) x1
    - Consumes: None
    - Creates: None

### 4) Restock Your First Aid Kit (`firstaid/restock-kit`)
- Quest link: `/quests/firstaid/restock-kit`
- Unlock prerequisite (`requiresQuests`): `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
  - Node `gather` / Everything's replaced: adhesive bandages (`1b1030bf-9767-4b16-9ff6-a8e7de28b689`) x1; sterile gauze pads (`cc7d36e7-c66d-466f-9390-f7a365d857b9`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 5) Dispose Expired First Aid Supplies (`firstaid/dispose-expired`)
- Quest link: `/quests/firstaid/dispose-expired`
- Unlock prerequisite (`requiresQuests`): `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
  - Node `sort` / Expired items discarded: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`wash-hands`](/processes/wash-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None

### 6) Sanitize Your CPR Pocket Mask (`firstaid/sanitize-pocket-mask`)
- Quest link: `/quests/firstaid/sanitize-pocket-mask`
- Unlock prerequisite (`requiresQuests`): `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
  - Node `clean` / Mask is sanitized: CPR pocket mask (`a1c7f153-5b2e-443d-936a-47f396a7d191`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 7) Stop a Nosebleed (`firstaid/stop-nosebleed`)
- Quest link: `/quests/firstaid/stop-nosebleed`
- Unlock prerequisite (`requiresQuests`): `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
  - Node `pressure` / Holding pressure now.: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1; sterile gauze pads (`cc7d36e7-c66d-466f-9390-f7a365d857b9`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`stop-nosebleed`](/processes/stop-nosebleed)
    - Requires: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
    - Consumes: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; sterile gauze pads (`cc7d36e7-c66d-466f-9390-f7a365d857b9`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1
    - Creates: None

### 8) Treat a Minor Burn (`firstaid/treat-burn`)
- Quest link: `/quests/firstaid/treat-burn`
- Unlock prerequisite (`requiresQuests`): `firstaid/stop-nosebleed`
- Dialogue `requiresItems` gates:
  - Node `cool` / Cooled off and ready to cover: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 9) Practice Basic Wound Care (`firstaid/wound-care`)
- Quest link: `/quests/firstaid/wound-care`
- Unlock prerequisite (`requiresQuests`): `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
  - Node `clean` / Clean and dress the cut: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1; antibiotic ointment packet (`0dde854e-7fcb-40ac-88ea-9afd9196f856`) x1; adhesive bandages (`1b1030bf-9767-4b16-9ff6-a8e7de28b689`) x1; biohazard waste bag (`7a4b8892-365f-4a56-93ce-127aa989f50d`) x1
  - Node `clean` / All bandaged up!: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`clean-minor-cut`](/processes/clean-minor-cut)
    - Requires: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1; sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1; adhesive bandages (`1b1030bf-9767-4b16-9ff6-a8e7de28b689`) x1; liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; biohazard waste bag (`7a4b8892-365f-4a56-93ce-127aa989f50d`) x1
    - Creates: None

### 10) Change a Bandage (`firstaid/change-bandage`)
- Quest link: `/quests/firstaid/change-bandage`
- Unlock prerequisite (`requiresQuests`): `firstaid/wound-care`
- Dialogue `requiresItems` gates:
  - Node `change` / Bandage changed: antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1; adhesive bandages (`1b1030bf-9767-4b16-9ff6-a8e7de28b689`) x1
  - Node `change` / Fresh bandage is on.: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`clean-minor-cut`](/processes/clean-minor-cut)
    - Requires: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1; sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1; adhesive bandages (`1b1030bf-9767-4b16-9ff6-a8e7de28b689`) x1; liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; biohazard waste bag (`7a4b8892-365f-4a56-93ce-127aa989f50d`) x1
    - Creates: None

### 11) Bag Used Bandages (`firstaid/dispose-bandages`)
- Quest link: `/quests/firstaid/dispose-bandages`
- Unlock prerequisite (`requiresQuests`): `firstaid/change-bandage`
- Dialogue `requiresItems` gates:
  - Node `bag` / Supplies bagged: biohazard waste bag (`7a4b8892-365f-4a56-93ce-127aa989f50d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`wash-hands`](/processes/wash-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None

### 12) Remove a Splinter (`firstaid/remove-splinter`)
- Quest link: `/quests/firstaid/remove-splinter`
- Unlock prerequisite (`requiresQuests`): `firstaid/wound-care`
- Dialogue `requiresItems` gates:
  - Node `remove` / Splinter removed: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; antiseptic wipes (`b0f10930-53aa-4d45-8bb7-9c7b17f14a5a`) x1; precision tweezers (`fc9301ec-674f-4b0d-b85e-c47140d5ae00`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`wash-hands`](/processes/wash-hands)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: liquid soap (`55ace400-79ee-4b24-b7da-0b0435ab7d72`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: None

### 13) Splint a Minor Fracture (`firstaid/splint-limb`)
- Quest link: `/quests/firstaid/splint-limb`
- Unlock prerequisite (`requiresQuests`): `firstaid/wound-care`
- Dialogue `requiresItems` gates:
  - Node `wrap` / Splint secured: first aid kit (`09af703f-7054-4b33-a67d-4035d58bdfb7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

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
