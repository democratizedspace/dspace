---
title: 'Firstaid'
slug: 'firstaid'
---

Firstaid quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Assemble a First Aid Kit (`firstaid/assemble-kit`)

- Quest link: [/quests/firstaid/assemble-kit](/quests/firstaid/assemble-kit)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `pack` → "Supplies packed"
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [dry-hands](/processes/dry-hands)
    - Requires:
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Creates:
      - None
  - [pack-first-aid-kit](/processes/pack-first-aid-kit)
    - Requires:
      - None
    - Consumes:
      - 1b1030bf-9767-4b16-9ff6-a8e7de28b689 ×1
      - cc7d36e7-c66d-466f-9390-f7a365d857b9 ×1
      - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Creates:
      - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
  - [wash-hands](/processes/wash-hands)
    - Requires:
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Creates:
      - None

---

## 2) Check Flashlight Battery (`firstaid/flashlight-battery`)

- Quest link: [/quests/firstaid/flashlight-battery](/quests/firstaid/flashlight-battery)
- Unlock prerequisite:
  - `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
  - `measure` → "Battery reads 9 V"
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - 80d30825-a42b-4add-b715-322e1713952c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 3) Practice Basic CPR (`firstaid/learn-cpr`)

- Quest link: [/quests/firstaid/learn-cpr](/quests/firstaid/learn-cpr)
- Unlock prerequisite:
  - `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
  - `steps` → "Practicing now."
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - a1c7f153-5b2e-443d-936a-47f396a7d191 ×1
    - b397aa70-3503-4e40-b84a-4d5609578d2b ×1
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
  - `steps` → "I know the basics."
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - a1c7f153-5b2e-443d-936a-47f396a7d191 ×1
    - b397aa70-3503-4e40-b84a-4d5609578d2b ×1
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [practice-cpr](/processes/practice-cpr)
    - Requires:
      - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - a1c7f153-5b2e-443d-936a-47f396a7d191 ×1
      - b397aa70-3503-4e40-b84a-4d5609578d2b ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 4) Restock Your First Aid Kit (`firstaid/restock-kit`)

- Quest link: [/quests/firstaid/restock-kit](/quests/firstaid/restock-kit)
- Unlock prerequisite:
  - `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
  - `gather` → "Everything's replaced"
    - 1b1030bf-9767-4b16-9ff6-a8e7de28b689 ×1
    - cc7d36e7-c66d-466f-9390-f7a365d857b9 ×1
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 5) Dispose Expired First Aid Supplies (`firstaid/dispose-expired`)

- Quest link: [/quests/firstaid/dispose-expired](/quests/firstaid/dispose-expired)
- Unlock prerequisite:
  - `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
  - `sort` → "Expired items discarded"
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
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

## 6) Sanitize Your CPR Pocket Mask (`firstaid/sanitize-pocket-mask`)

- Quest link: [/quests/firstaid/sanitize-pocket-mask](/quests/firstaid/sanitize-pocket-mask)
- Unlock prerequisite:
  - `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
  - `clean` → "Mask is sanitized"
    - a1c7f153-5b2e-443d-936a-47f396a7d191 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 7) Stop a Nosebleed (`firstaid/stop-nosebleed`)

- Quest link: [/quests/firstaid/stop-nosebleed](/quests/firstaid/stop-nosebleed)
- Unlock prerequisite:
  - `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
  - `pressure` → "Holding pressure now."
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
    - cc7d36e7-c66d-466f-9390-f7a365d857b9 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [stop-nosebleed](/processes/stop-nosebleed)
    - Requires:
      - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
    - Consumes:
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - cc7d36e7-c66d-466f-9390-f7a365d857b9 ×1
      - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
    - Creates:
      - None

---

## 8) Treat a Minor Burn (`firstaid/treat-burn`)

- Quest link: [/quests/firstaid/treat-burn](/quests/firstaid/treat-burn)
- Unlock prerequisite:
  - `firstaid/stop-nosebleed`
- Dialogue `requiresItems` gates:
  - `cool` → "Cooled off and ready to cover"
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 9) Practice Basic Wound Care (`firstaid/wound-care`)

- Quest link: [/quests/firstaid/wound-care](/quests/firstaid/wound-care)
- Unlock prerequisite:
  - `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
  - `clean` → "Clean and dress the cut"
    - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
    - 0dde854e-7fcb-40ac-88ea-9afd9196f856 ×1
    - 1b1030bf-9767-4b16-9ff6-a8e7de28b689 ×1
    - 7a4b8892-365f-4a56-93ce-127aa989f50d ×1
  - `clean` → "All bandaged up!"
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [clean-minor-cut](/processes/clean-minor-cut)
    - Requires:
      - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
      - 1b1030bf-9767-4b16-9ff6-a8e7de28b689 ×1
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - 7a4b8892-365f-4a56-93ce-127aa989f50d ×1
    - Creates:
      - None

---

## 10) Change a Bandage (`firstaid/change-bandage`)

- Quest link: [/quests/firstaid/change-bandage](/quests/firstaid/change-bandage)
- Unlock prerequisite:
  - `firstaid/wound-care`
- Dialogue `requiresItems` gates:
  - `change` → "Bandage changed"
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
    - 1b1030bf-9767-4b16-9ff6-a8e7de28b689 ×1
  - `change` → "Fresh bandage is on."
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [clean-minor-cut](/processes/clean-minor-cut)
    - Requires:
      - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
      - 1b1030bf-9767-4b16-9ff6-a8e7de28b689 ×1
      - 55ace400-79ee-4b24-b7da-0b0435ab7d72 ×1
      - 7a4b8892-365f-4a56-93ce-127aa989f50d ×1
    - Creates:
      - None

---

## 11) Bag Used Bandages (`firstaid/dispose-bandages`)

- Quest link: [/quests/firstaid/dispose-bandages](/quests/firstaid/dispose-bandages)
- Unlock prerequisite:
  - `firstaid/change-bandage`
- Dialogue `requiresItems` gates:
  - `bag` → "Supplies bagged"
    - 7a4b8892-365f-4a56-93ce-127aa989f50d ×1
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

## 12) Remove a Splinter (`firstaid/remove-splinter`)

- Quest link: [/quests/firstaid/remove-splinter](/quests/firstaid/remove-splinter)
- Unlock prerequisite:
  - `firstaid/wound-care`
- Dialogue `requiresItems` gates:
  - `remove` → "Splinter removed"
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - b0f10930-53aa-4d45-8bb7-9c7b17f14a5a ×1
    - fc9301ec-674f-4b0d-b85e-c47140d5ae00 ×1
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

## 13) Splint a Minor Fracture (`firstaid/splint-limb`)

- Quest link: [/quests/firstaid/splint-limb](/quests/firstaid/splint-limb)
- Unlock prerequisite:
  - `firstaid/wound-care`
- Dialogue `requiresItems` gates:
  - `wrap` → "Splint secured"
    - 09af703f-7054-4b33-a67d-4035d58bdfb7 ×1
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
  - `firstaid/assemble-kit` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `firstaid/assemble-kit`: verify prerequisite completion and inventory gates.
  - `firstaid/flashlight-battery`: verify prerequisite completion and inventory gates.
  - `firstaid/learn-cpr`: verify prerequisite completion and inventory gates.
  - `firstaid/restock-kit`: verify prerequisite completion and inventory gates.
  - `firstaid/dispose-expired`: verify prerequisite completion and inventory gates.
  - `firstaid/sanitize-pocket-mask`: verify prerequisite completion and inventory gates.
  - `firstaid/stop-nosebleed`: verify prerequisite completion and inventory gates.
  - `firstaid/treat-burn`: verify prerequisite completion and inventory gates.
  - `firstaid/wound-care`: verify prerequisite completion and inventory gates.
  - `firstaid/change-bandage`: verify prerequisite completion and inventory gates.
  - `firstaid/dispose-bandages`: verify prerequisite completion and inventory gates.
  - `firstaid/remove-splinter`: verify prerequisite completion and inventory gates.
  - `firstaid/splint-limb`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
