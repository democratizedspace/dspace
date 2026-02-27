---
title: 'First Aid'
slug: 'firstaid'
---

First Aid quests build practical progression through the first aid skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Assemble a First Aid Kit](/quests/firstaid/assemble-kit)
2. [Check Flashlight Battery](/quests/firstaid/flashlight-battery)
3. [Practice Basic CPR](/quests/firstaid/learn-cpr)
4. [Restock Your First Aid Kit](/quests/firstaid/restock-kit)
5. [Dispose Expired First Aid Supplies](/quests/firstaid/dispose-expired)
6. [Sanitize Your CPR Pocket Mask](/quests/firstaid/sanitize-pocket-mask)
7. [Stop a Nosebleed](/quests/firstaid/stop-nosebleed)
8. [Treat a Minor Burn](/quests/firstaid/treat-burn)
9. [Practice Basic Wound Care](/quests/firstaid/wound-care)
10. [Change a Bandage](/quests/firstaid/change-bandage)
11. [Bag Used Bandages](/quests/firstaid/dispose-bandages)
12. [Remove a Splinter](/quests/firstaid/remove-splinter)
13. [Splint a Minor Fracture](/quests/firstaid/splint-limb)

## 1) Assemble a First Aid Kit (`firstaid/assemble-kit`)

- Quest link: [/quests/firstaid/assemble-kit](/quests/firstaid/assemble-kit)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `pack` → "Kit already packed and labeled" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
    - [dry-hands](/processes/dry-hands)
        - Requires: sink ×1
        - Consumes: paper towel ×1
        - Creates: none
    - [pack-first-aid-kit](/processes/pack-first-aid-kit)
        - Requires: none
        - Consumes: adhesive bandages ×1, sterile gauze pads ×1, antiseptic wipes ×1, nitrile gloves (pair) ×1
        - Creates: first aid kit ×1
- QA notes:
    - Main path is now prep → inspect → pack → safety-check with an explicit evidence gate (`pack-first-aid-kit` or existing first aid kit item).
    - Troubleshooting branches include hygiene reset (`restart-hygiene`) and replacement loop (`replace`) before completion.
    - Finish is blocked until storage safety is verified (`safety-check` / `relocate`).

## 2) Check Flashlight Battery (`firstaid/flashlight-battery`)

- Quest link: [/quests/firstaid/flashlight-battery](/quests/firstaid/flashlight-battery)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
    - `measure` → "Battery reads 9 V" — red flashlight ×1, digital multimeter ×1, 9 V battery ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [check-flashlight-battery](/processes/check-flashlight-battery)
        - Requires: red flashlight ×1, digital multimeter ×1, 9 V battery ×1
        - Consumes: none
        - Creates: none

## 3) Practice Basic CPR (`firstaid/learn-cpr`)

- Quest link: [/quests/firstaid/learn-cpr](/quests/firstaid/learn-cpr)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
    - `prep` → "PPE and training gear are ready" — first aid kit ×1, nitrile gloves (pair) ×1, CPR pocket mask ×1, CPR training manikin ×1, antiseptic wipes ×1
    - `compressions` → "Run the timed CPR drill" — first aid kit ×1, nitrile gloves (pair) ×1, CPR pocket mask ×1, CPR training manikin ×1, antiseptic wipes ×1
    - `verify` → "Drill met targets and gear is sanitized" — first aid kit ×1, nitrile gloves (pair) ×1, CPR pocket mask ×1, CPR training manikin ×1, antiseptic wipes ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [practice-cpr](/processes/practice-cpr)
        - Requires: first aid kit ×1, nitrile gloves (pair) ×1, CPR pocket mask ×1, CPR training manikin ×1
        - Consumes: none
        - Creates: none
- QA notes:
    - Added scene-safety triage with an emergency escalation stop for unsafe conditions.
    - Added coaching retry loop (`troubleshoot`) for failed pacing/form attempts.
    - Completion now requires process-backed drill evidence plus cleanup verification.

## 4) Restock Your First Aid Kit (`firstaid/restock-kit`)

- Quest link: [/quests/firstaid/restock-kit](/quests/firstaid/restock-kit)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
    - `replace` → "Core supplies replaced" — adhesive bandages ×1, sterile gauze pads ×1, antiseptic wipes ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Main path now enforces audit → replacement → readiness verification instead of a single-step completion.
    - Includes contamination recovery (`sanitize-reset`) and shortage troubleshooting (`shortage`) loops.
    - Completion is gated on required replacement items and a final operational readiness check.

## 5) Dispose Expired First Aid Supplies (`firstaid/dispose-expired`)

- Quest link: [/quests/firstaid/dispose-expired](/quests/firstaid/dispose-expired)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
    - `prep` → "Prep and PPE complete" — nitrile gloves (pair) ×1, safety goggles ×1
    - `sort` → "Expired supplies sealed and kit re-checked" — nitrile gloves (pair) ×1, safety goggles ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Added emergency-vs-routine safety branch to prevent disposal during active incidents.
    - Added audit/troubleshoot recovery path for uncertain expiry checks and contamination events.
    - Completion now requires PPE-backed disposal and post-sort re-verification.

## 6) Sanitize Your CPR Pocket Mask (`firstaid/sanitize-pocket-mask`)

- Quest link: [/quests/firstaid/sanitize-pocket-mask](/quests/firstaid/sanitize-pocket-mask)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
    - `clean` → "Mask is sanitized" — CPR pocket mask ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 7) Stop a Nosebleed (`firstaid/stop-nosebleed`)

- Quest link: [/quests/firstaid/stop-nosebleed](/quests/firstaid/stop-nosebleed)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
    - `pressure` → "Holding pressure now." — first aid kit ×1, sterile gauze pads ×1, nitrile gloves (pair) ×1, antiseptic wipes ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [stop-nosebleed](/processes/stop-nosebleed)
        - Requires: first aid kit ×1
        - Consumes: nitrile gloves (pair) ×1, sterile gauze pads ×1, antiseptic wipes ×1
        - Creates: none

## 8) Treat a Minor Burn (`firstaid/treat-burn`)

- Quest link: [/quests/firstaid/treat-burn](/quests/firstaid/treat-burn)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/stop-nosebleed`
- Dialogue `requiresItems` gates:
    - `dress` → "Dressing applied with clean supplies" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Added severity triage safety gate with an explicit emergency escalation endpoint (`escalate`).
    - Added cooling recovery branch (`retry-cooling`) with reassessment loop before dressing.
    - Completion requires kit-backed dressing evidence and a monitor/escalate branch for worsening symptoms.

## 9) Practice Basic Wound Care (`firstaid/wound-care`)

- Quest link: [/quests/firstaid/wound-care](/quests/firstaid/wound-care)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
    - `clean` → "Clean and dress the cut" — liquid soap ×1, nitrile gloves (pair) ×1, antiseptic wipes ×1, antibiotic ointment packet ×1, adhesive bandages ×1, biohazard waste bag ×1
    - `clean` → "All bandaged up!" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [clean-minor-cut](/processes/clean-minor-cut)
        - Requires: first aid kit ×1, sink ×1
        - Consumes: nitrile gloves (pair) ×1, antiseptic wipes ×1, adhesive bandages ×1, liquid soap ×1, biohazard waste bag ×1
        - Creates: none

## 10) Change a Bandage (`firstaid/change-bandage`)

- Quest link: [/quests/firstaid/change-bandage](/quests/firstaid/change-bandage)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/wound-care`
- Dialogue `requiresItems` gates:
    - `prep` → "Already washed and gloved" — nitrile gloves (pair) ×1
    - `change` → "Do a full clean-and-redress cycle" — antiseptic wipes ×1, adhesive bandages ×1
    - `change` → "Bandage swapped with clean supplies" — first aid kit ×1, adhesive bandages ×1
    - `verify` → "Dressing is secure and clean" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
    - [clean-minor-cut](/processes/clean-minor-cut)
        - Requires: first aid kit ×1, sink ×1
        - Consumes: nitrile gloves (pair) ×1, antiseptic wipes ×1, adhesive bandages ×1, liquid soap ×1, biohazard waste bag ×1
        - Creates: none
- QA notes:
    - Added explicit safety triage (`assess`) with non-completing escalation path (`safety-stop`) for worsening symptoms.
    - Completion now requires prep + care + verification, with mechanics-backed evidence from item gates and a clean-and-redress process option.
    - Added contamination and adhesion failure recovery loop (`troubleshoot`) that routes through hygiene reset before reattempt.

## 11) Bag Used Bandages (`firstaid/dispose-bandages`)

- Quest link: [/quests/firstaid/dispose-bandages](/quests/firstaid/dispose-bandages)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/change-bandage`
- Dialogue `requiresItems` gates:
    - `prep` → "Supplies staged" — nitrile gloves (pair) ×1, biohazard waste bag ×1
    - `bag` → "Bag sealed and leak-free" — biohazard waste bag ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Reworked to containment sequence (`prep` → `bag` → `verify`) instead of single-step disposal.
    - Added leak/exposure troubleshooting (`recover`) with required hygiene reset process before retry.
    - Added a safety escalation stop (`safety-stop`) for exposure incidents that should not complete in-quest.

## 12) Remove a Splinter (`firstaid/remove-splinter`)

- Quest link: [/quests/firstaid/remove-splinter](/quests/firstaid/remove-splinter)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/wound-care`
- Dialogue `requiresItems` gates:
    - `prep` → "Prep complete with available kit" — precision tweezers ×1, antiseptic wipes ×1, nitrile gloves (pair) ×1
    - `remove` → "Splinter removed and site cleaned" — precision tweezers ×1, antiseptic wipes ×1
    - `verify` → "Site looks clean and controlled" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [wash-hands](/processes/wash-hands)
        - Requires: sink ×1
        - Consumes: liquid soap ×1, paper towel ×1
        - Creates: none
- QA notes:
    - Added front-loaded safety triage (`assess`) and clinician escalation branch (`safety-stop`) for deep-risk cases.
    - Added troubleshooting branch (`recover`) for broken/retained fragments with enforced clean retry loop.
    - Completion now requires a post-removal verification gate in addition to removal evidence.

## 13) Splint a Minor Fracture (`firstaid/splint-limb`)

- Quest link: [/quests/firstaid/splint-limb](/quests/firstaid/splint-limb)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/wound-care`
- Dialogue `requiresItems` gates:
    - `prep` → "Padding and supports are staged" — first aid kit ×1
    - `secure` → "Splint secured and circulation re-check passed" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Added severity triage with explicit emergency escalation stop.
    - Added troubleshooting loop for failed circulation/pain checks before reattempt.
    - Completion now requires both setup and circulation verification checkpoints.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
