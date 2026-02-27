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
    - `setup` → "Gear staged and meter configured" — red flashlight ×1, digital multimeter ×1,
      9 V battery ×1
    - `measure` process option → "Run measurement and log reading" — red flashlight ×1,
      digital multimeter ×1, 9 V battery ×1
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
- QA notes:
    - Expanded from a one-hop measurement to setup → measurement → interpretation → beam verification.
    - Added a safety stop branch for corrosion/damaged leads and a troubleshooting re-measure loop.
    - Completion now expects both mechanics-backed evidence (`check-flashlight-battery`) and an
      operational readiness confirmation.

## 3) Practice Basic CPR (`firstaid/learn-cpr`)

- Quest link: [/quests/firstaid/learn-cpr](/quests/firstaid/learn-cpr)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/assemble-kit`
- Dialogue `requiresItems` gates:
    - `prep-gear` → "Gear staged and emergency call sequence reviewed" — first aid kit ×1,
      nitrile gloves (pair) ×1, CPR pocket mask ×1, CPR training manikin ×1, antiseptic wipes ×1
    - `practice` process option → "Complete the practice cycle" — first aid kit ×1,
      nitrile gloves (pair) ×1, CPR pocket mask ×1, CPR training manikin ×1, antiseptic wipes ×1
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
    - Added explicit scene safety triage (`scene-check`) with a non-completing safety stop loop.
    - Added staged evidence progression (`prep-gear` item gate + `practice-cpr` process evidence)
      before debrief and finish.
    - Added troubleshooting/recovery loops for missing supplies (`resupply`) and technique drift
      (`technique-fix`) before completion.

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
    - `sort` → "Expired supplies are bagged and labeled" — first aid kit ×1, nitrile gloves
      (pair) ×1, safety goggles ×1
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
    - Reworked to a multi-step audit (`prep` → `sort` → `verify`) with a resettable hygiene path.
    - Added contamination spill handling (`escalate`) that forces cleanup and safe re-entry before
      progressing.
    - Completion now requires mechanics-backed disposal evidence and a final verification checkpoint
      instead of a single-step pass.

## 6) Sanitize Your CPR Pocket Mask (`firstaid/sanitize-pocket-mask`)

- Quest link: [/quests/firstaid/sanitize-pocket-mask](/quests/firstaid/sanitize-pocket-mask)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/learn-cpr`
- Dialogue `requiresItems` gates:
    - `inspect` → "Mask is intact and safe to sanitize" — CPR pocket mask ×1
    - `prep` → "Supplies staged" — nitrile gloves (pair) ×1, antiseptic wipes ×1
    - `sanitize` → "Sanitization cycle complete" — CPR pocket mask ×1, nitrile gloves (pair) ×1
    - `verify` → "Mask sanitized and sealed" — first aid kit ×1, CPR pocket mask ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Expanded to inspection → prep → sanitize → verification with explicit PPE and storage evidence gates.
    - Added contamination troubleshooting loop (`troubleshoot`) that forces a full reset before completion.
    - Added safety-stop branch (`safety-stop`) for damaged/unsafe PPE with replacement-first re-entry.

## 7) Stop a Nosebleed (`firstaid/stop-nosebleed`)

- Quest link: [/quests/firstaid/stop-nosebleed](/quests/firstaid/stop-nosebleed)
- Unlock prerequisite:
    - `requiresQuests`: `firstaid/restock-kit`
- Dialogue `requiresItems` gates:
    - `pressure` process option → "Run the guided pressure timer" — first aid kit ×1, sterile gauze pads ×1, nitrile gloves (pair) ×1, antiseptic wipes ×1
    - `pressure` manual option → "Holding pressure now" — first aid kit ×1, sterile gauze pads ×1, nitrile gloves (pair) ×1, antiseptic wipes ×1
    - `retry` → "Repeat pressure cycle with new gauze" — sterile gauze pads ×1
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
- QA notes:
    - Added explicit triage (`assess`) before intervention, including a non-completing escalation path.
    - Added mechanics-backed evidence via process-backed pressure timer and repeated-gauze retry gate.
    - Added troubleshooting/recovery loop (`retry`) with a hard escalation branch when bleeding persists.

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
    - `prep` manual option → "Already washed and staged" — liquid soap ×1, nitrile gloves (pair) ×1, antiseptic wipes ×1, antibiotic ointment packet ×1, adhesive bandages ×1, biohazard waste bag ×1
    - `clean` process option → "Complete clean-and-dress cycle" — liquid soap ×1, nitrile gloves (pair) ×1, antiseptic wipes ×1, antibiotic ointment packet ×1, adhesive bandages ×1, biohazard waste bag ×1
    - `clean` manual option → "Wound cleaned and bandaged manually" — first aid kit ×1, adhesive bandages ×1
    - `verify` → "Wound is stable and dressed" — first aid kit ×1
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
    - Added safety triage (`assess`) before treatment and an escalation-only branch (`safety-stop`) for non-minor wounds.
    - Split prep and treatment into staged evidence gates using wash-hands and clean-minor-cut process paths plus manual fallback gates.
    - Added contamination recovery loop (`troubleshoot`) that forces hygiene reset and reattempt before finish.

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
    - `prep` → "Supplies staged" — first aid kit ×1, antibiotic ointment packet ×1
    - `secure` → "Splint secured" — first aid kit ×1
    - `verify` → "Circulation remains stable" — first aid kit ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Reworked to triage → prep → secure → circulation re-check with explicit evidence gates before completion.
    - Added fit/circulation troubleshooting loop (`troubleshoot`) that routes back through re-padding and re-secure.
    - Added safety escalation branch (`safety-stop`) for red-flag fracture signs and post-adjust worsening symptoms.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
