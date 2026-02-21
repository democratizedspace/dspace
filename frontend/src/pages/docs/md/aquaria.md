---
title: 'Aquaria'
slug: 'aquaria'
---

Aquaria quests build practical progression through the aquaria skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Set up a Walstad tank](/quests/aquaria/walstad)
2. [Attach Aquarium Thermometer](/quests/aquaria/thermometer)
3. [Move the Walstad tank](/quests/aquaria/position-tank)
4. [Install a sponge filter](/quests/aquaria/sponge-filter)
5. [Install an aquarium light](/quests/aquaria/aquarium-light)
6. [Rinse Sponge Filter](/quests/aquaria/filter-rinse)
7. [Install an aquarium heater](/quests/aquaria/heater-install)
8. [Test water parameters](/quests/aquaria/water-testing)
9. [Add guppies](/quests/aquaria/guppy)
10. [Log Water Parameters](/quests/aquaria/log-water-parameters)
11. [Check aquarium pH](/quests/aquaria/ph-strip-test)
12. [Balance aquarium pH](/quests/aquaria/balance-ph)
13. [Add dwarf shrimp](/quests/aquaria/shrimp)
14. [Add Floating Plants](/quests/aquaria/floating-plants)
15. [Breed your guppies](/quests/aquaria/breeding)
16. [Set up an aquarium for a goldfish](/quests/aquaria/goldfish)
17. [Perform a partial water change](/quests/aquaria/water-change)
18. [Catch a fish with a net](/quests/aquaria/net-fish)
19. [Top Off Evaporated Water](/quests/aquaria/top-off)

## 1) Set up a Walstad tank (`aquaria/walstad`)

- Quest link: [/quests/aquaria/walstad](/quests/aquaria/walstad)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `start` → "Yes—show me the steps" — aquarium (150 L) ×1, aquarium stand (80 L) ×1, aquarium gravel (1 kg) ×3, aquarium LED light (20 W) ×1, Guppy grass starter ×1, Duckweed portion ×1, 5 gallon bucket ×1, Water conditioner ×1
    - `stage` → "Bucket is dechlorinated and tools are staged" — 5 gallon bucket of dechlorinated tap water ×1
    - `build` → "Substrate settled and plants look secure" — Walstad aquarium (80 L) ×1
    - `thermo` → "Placement marked and glass is dry" — Walstad aquarium (80 L) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [condition-bucket-water](/processes/condition-bucket-water)
        - Requires: 5 gallon bucket ×1, Water conditioner ×1
        - Consumes: Water conditioner ×0.1, 5 gallon bucket of tap water (chlorinated) ×1
        - Creates: 5 gallon bucket of dechlorinated tap water ×1
    - [assemble-walstad-tank](/processes/assemble-walstad-tank)
        - Requires: aquarium (150 L) ×1, aquarium stand (80 L) ×1, aquarium gravel (1 kg) ×3, aquarium LED light (20 W) ×1, Guppy grass starter ×1, Duckweed portion ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Consumes: aquarium gravel (1 kg) ×3, Guppy grass starter ×1, Duckweed portion ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Creates: Walstad aquarium (80 L) ×1

## 2) Attach Aquarium Thermometer (`aquaria/thermometer`)

- Quest link: [/quests/aquaria/thermometer](/quests/aquaria/thermometer)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/walstad`
- Dialogue `requiresItems` gates:
    - `start` → "Glass is clean and dry" — Walstad aquarium (80 L) ×1, aquarium thermometer (0–50°C) ×1, paper towel ×1
    - `attach` → "Adhesive wrinkled or trapped bubbles formed; reset before taking a reading." — Walstad aquarium with thermometer (80 L) ×1
    - `attach` → "Strip is attached and seated" — Walstad aquarium with thermometer (80 L) ×1
    - `check` → "Reading recorded" — Aquarium temperature reading ×1
    - `interpret` → "Reading is inside 24-28°C and logged." — Aquarium temperature reading ×1
    - `interpret` → "Reading is out of range; pause and stabilize before rechecking." — Aquarium temperature reading ×1
    - `stabilize` → "Fresh reading logged; re-evaluate range." — Aquarium temperature reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [attach-aquarium-thermometer](/processes/attach-aquarium-thermometer)
        - Requires: Walstad aquarium (80 L) ×1, aquarium thermometer (0–50°C) ×1, paper towel ×1
        - Consumes: aquarium thermometer (0–50°C) ×1, paper towel ×1
        - Creates: Walstad aquarium with thermometer (80 L) ×1
    - [log-walstad-temperature](/processes/log-walstad-temperature)
        - Requires: none
        - Consumes: none
        - Creates: Aquarium temperature reading ×1

## 3) Move the Walstad tank (`aquaria/position-tank`)

- Quest link: [/quests/aquaria/position-tank](/quests/aquaria/position-tank)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/walstad`, `aquaria/thermometer`
- Dialogue `requiresItems` gates:
    - `start` → "Direct path is clear; let's lift and place in one move." — Walstad aquarium with thermometer (80 L) ×1, aquarium stand (80 L) ×1
    - `start` → "Let's use a staged route with a rest stop to protect the glass." — Walstad aquarium with thermometer (80 L) ×1, aquarium stand (80 L) ×1
    - `heat` → "Install the heater and set it to 26°C" — aquarium heater (150 W) ×1, Walstad aquarium with thermometer (80 L) ×1
    - `heat` → "Heater installed and indicator is stable." — Heated Walstad aquarium (80 L, 26°C) ×1
    - `verify` → "Lift complete, heater verified, and safety checks passed." — Aquarium temperature reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Heated Walstad aquarium (80 L, 26°C) ×1
- Processes used:
    - [heat-walstad](/processes/heat-walstad)
        - Requires: none
        - Consumes: Walstad aquarium with thermometer (80 L) ×1, aquarium heater (150 W) ×1
        - Creates: Heated Walstad aquarium (80 L, 26°C) ×1
    - [log-walstad-temperature](/processes/log-walstad-temperature)
        - Requires: none
        - Consumes: none
        - Creates: Aquarium temperature reading ×1

## 4) Install a sponge filter (`aquaria/sponge-filter`)

- Quest link: [/quests/aquaria/sponge-filter](/quests/aquaria/sponge-filter)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/position-tank`
- Dialogue `requiresItems` gates:
    - `start` → "Gear staged and PPE on." — Sponge filter ×1, Airline tubing ×1, aquarium air pump ×1, 5 gallon bucket ×1, Water conditioner ×1, nitrile gloves (pair) ×1
    - `prep` → "Bucket is already dechlorinated and ready." — 5 gallon bucket of dechlorinated tap water ×1
    - `rinse` → "Core is rinsed and still wet." — Rinsed sponge filter core ×1
    - `contamination` → "Fresh bucket staged and livestock behavior is stable." — 5 gallon bucket of dechlorinated tap water ×1
    - `restart` → "Flow is restored without splashing." — Restored sponge filter flow ×1
    - `verify` → "Restored-flow proof captured and livestock behavior is normal." — Restored sponge filter flow ×1
    - `verify` → "Flow is still weak; repeat rinse and restart loop." — none
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [condition-bucket-water](/processes/condition-bucket-water)
        - Requires: 5 gallon bucket ×1, Water conditioner ×1
        - Consumes: Water conditioner ×0.1, 5 gallon bucket of tap water (chlorinated) ×1
        - Creates: 5 gallon bucket of dechlorinated tap water ×1
    - [rinse-aquarium-filter](/processes/rinse-aquarium-filter)
        - Requires: Sponge filter ×1, 5 gallon bucket of dechlorinated tap water ×1, nitrile gloves (pair) ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×1
        - Creates: Rinsed sponge filter core ×1
    - [restart-sponge-filter](/processes/restart-sponge-filter)
        - Requires: Rinsed sponge filter core ×1, aquarium air pump ×1, Airline tubing ×1
        - Consumes: Rinsed sponge filter core ×1
        - Creates: Restored sponge filter flow ×1

## 5) Install an aquarium light (`aquaria/aquarium-light`)

- Quest link: [/quests/aquaria/aquarium-light](/quests/aquaria/aquarium-light)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/sponge-filter`
- Dialogue `requiresItems` gates:
    - `mount` → "Light secured." — aquarium LED light (20 W) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Duckweed portion ×1
- Processes used:
    - None

## 6) Rinse Sponge Filter (`aquaria/filter-rinse`)

- Quest link: [/quests/aquaria/filter-rinse](/quests/aquaria/filter-rinse)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/sponge-filter`
- Dialogue `requiresItems` gates:
    - `start` → "Bucket staged, pump unplugged, and PPE on." — 5 gallon bucket of dechlorinated tap water ×1, Sponge filter ×1, aquarium air pump ×1, nitrile gloves (pair) ×1
    - `baseline` → "Pre-rinse flow is visibly weak and recorded." — none
    - `prep` → "Run normal rinse cycle." — Sponge filter ×1, 5 gallon bucket of dechlorinated tap water ×1, nitrile gloves (pair) ×1
    - `prep` → "Water still runs dark or smells off." — none
    - `contamination` → "Fresh bucket is staged; continue the rinse loop." — none
    - `prep` → "Core is rinsed and still wet." — Rinsed sponge filter core ×1
    - `restart` → "Restart and tune airflow." — Rinsed sponge filter core ×1, Airline tubing ×1, aquarium air pump ×1
    - `restart` → "Flow is restored and livestock behavior looks normal." — Restored sponge filter flow ×1
    - `verify` → "Pre/post evidence confirms flow recovery." — Restored sponge filter flow ×1
    - `verify` → "Still weak; repeat rinse loop before closing and return with restored-flow proof." — none
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
        - Requires: none
        - Consumes: 5 gallon bucket of tap water (chlorinated) ×1
        - Creates: 5 gallon bucket of dechlorinated tap water ×1
    - [rinse-aquarium-filter](/processes/rinse-aquarium-filter)
        - Requires: Sponge filter ×1, 5 gallon bucket of dechlorinated tap water ×1, nitrile gloves (pair) ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×1
        - Creates: Rinsed sponge filter core ×1
    - [restart-sponge-filter](/processes/restart-sponge-filter)
        - Requires: Rinsed sponge filter core ×1, aquarium air pump ×1, Airline tubing ×1
        - Consumes: Rinsed sponge filter core ×1
        - Creates: Restored sponge filter flow ×1

## 7) Install an aquarium heater (`aquaria/heater-install`)

- Quest link: [/quests/aquaria/heater-install](/quests/aquaria/heater-install)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/sponge-filter`, `aquaria/thermometer`, `aquaria/walstad`
- Dialogue `requiresItems` gates:
    - `start` → "Tank is ready for heat" — Walstad aquarium with thermometer (80 L) ×1, aquarium heater (150 W) ×1, Restored sponge filter flow ×1
    - `mount` → "Heater installed and powered on" — Heated Walstad aquarium (80 L, 26°C) ×1
    - `verify` → "Reading recorded" — Aquarium temperature reading ×1
    - `interpret` → "Range held at 25–27°C for two checks" — Aquarium temperature reading ×1
    - `interpret` → "Temperature overshot or dropped outside safe range" — Aquarium temperature reading ×1
    - `rollback` → "Apply rollback and capture a fresh verification reading" — none
    - `rollback` → "Fresh post-rollback reading is logged" — Aquarium temperature reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [heat-walstad](/processes/heat-walstad)
        - Requires: none
        - Consumes: Walstad aquarium with thermometer (80 L) ×1, aquarium heater (150 W) ×1
        - Creates: Heated Walstad aquarium (80 L, 26°C) ×1
    - [log-walstad-temperature](/processes/log-walstad-temperature)
        - Requires: none
        - Consumes: none
        - Creates: Aquarium temperature reading ×1

## 8) Test water parameters (`aquaria/water-testing`)

- Quest link: [/quests/aquaria/water-testing](/quests/aquaria/water-testing)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/thermometer`
- Dialogue `requiresItems` gates:
    - `start` → "Bench is clear, PPE is on, and the kit is ready." — Aquarium liquid test kit ×1, nitrile gloves (pair) ×1, safety goggles ×1, water test logbook ×1
    - `measure` → "Panel run complete and readings are ready to log." — Liquid test readings ×1
    - `log` → "Readings are logged and ready for interpretation." — Logged water parameters ×1
    - `interpret` → "All values are in range; shrimp-safe window confirmed." — Logged water parameters ×1
    - `interpret` → "At least one value is out of range; start corrective response." — Logged water parameters ×1
    - `corrective` → "Run corrective partial water change." — Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
    - `corrective` → "Water change is complete and conditions are stable." — Freshly changed aquarium (80 L) ×1
    - `retest` → "Run the retest panel now." — Freshly changed aquarium (80 L) ×1
    - `retest` → "Retest still out of range; run another corrective cycle." — Freshly changed aquarium (80 L) ×1
    - `retest` → "Retest passed and fresh readings confirm safe ranges." — Liquid test readings ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Duckweed portion ×1
- Processes used:
    - [measure-liquid-parameters](/processes/measure-liquid-parameters)
        - Requires: Aquarium liquid test kit ×1, nitrile gloves (pair) ×1
        - Consumes: Aquarium liquid test kit ×0.05
        - Creates: Liquid test readings ×1
    - [log-aquarium-test-results](/processes/log-aquarium-test-results)
        - Requires: Aquarium liquid test kit ×1, Liquid test readings ×1, water test logbook ×1, nitrile gloves (pair) ×1
        - Consumes: Liquid test readings ×1
        - Creates: Logged water parameters ×1
    - [partial-water-change](/processes/partial-water-change)
        - Requires: Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×0.25
        - Creates: Freshly changed aquarium (80 L) ×1

## 9) Add guppies (`aquaria/guppy`)

- Quest link: [/quests/aquaria/guppy](/quests/aquaria/guppy)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/water-testing`, `aquaria/heater-install`
- Dialogue `requiresItems` gates:
    - `start` → "Tank is already at guppy-safe temperature." — Heated Walstad aquarium (80 L, 26°C) ×1
    - `stress-response` → "Recovery check logged; retry acclimation." — Aquarium temperature reading ×1
    - `release` → "Guppies are in the tank without store water." — Heated Walstad aquarium with guppies (80 L, 26°C) ×1
    - `verify` → "Guppies are active and a post-release reading is logged." — Heated Walstad aquarium with guppies (80 L, 26°C) ×1, Aquarium temperature reading ×1
    - `verify` → "Fish are flashing or gasping; pause and recover before closure." — Heated Walstad aquarium with guppies (80 L, 26°C) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Heated Walstad aquarium with guppies (80 L, 26°C) ×1
- Processes used:
    - [heat-walstad](/processes/heat-walstad)
        - Requires: none
        - Consumes: Walstad aquarium with thermometer (80 L) ×1, aquarium heater (150 W) ×1
        - Creates: Heated Walstad aquarium (80 L, 26°C) ×1
    - [stock-guppies](/processes/stock-guppies)
        - Requires: none
        - Consumes: Heated Walstad aquarium (80 L, 26°C) ×1, Guppy group ×1
        - Creates: Heated Walstad aquarium with guppies (80 L, 26°C) ×1

## 10) Log Water Parameters (`aquaria/log-water-parameters`)

- Quest link: [/quests/aquaria/log-water-parameters](/quests/aquaria/log-water-parameters)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/water-testing`
- Dialogue `requiresItems` gates:
    - `start` → "Bench is clear and kit is open." — Aquarium liquid test kit ×1, nitrile gloves (pair) ×1
    - `measure` → "Run the liquid tests." — Aquarium liquid test kit ×1, nitrile gloves (pair) ×1
    - `measure` → "Readings are ready to log." — Liquid test readings ×1
    - `log` → "Record the results in the logbook." — Aquarium liquid test kit ×1, Liquid test readings ×1, water test logbook ×1, nitrile gloves (pair) ×1
    - `log` → "Entry logged with today's readings." — Logged water parameters ×1
    - `interpret` → "All readings are within guardrails" — Logged water parameters ×1
    - `interpret` → "At least one value is out of range" — Logged water parameters ×1
    - `corrective` → "Correction complete, re-measure the panel" — Freshly changed aquarium (80 L) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [measure-liquid-parameters](/processes/measure-liquid-parameters)
        - Requires: Aquarium liquid test kit ×1, nitrile gloves (pair) ×1
        - Consumes: Aquarium liquid test kit ×0.05
        - Creates: Liquid test readings ×1
    - [log-aquarium-test-results](/processes/log-aquarium-test-results)
        - Requires: Aquarium liquid test kit ×1, Liquid test readings ×1, water test logbook ×1, nitrile gloves (pair) ×1
        - Consumes: Liquid test readings ×1
        - Creates: Logged water parameters ×1
    - [partial-water-change](/processes/partial-water-change)
        - Requires: Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×0.25
        - Creates: Freshly changed aquarium (80 L) ×1

## 11) Check aquarium pH (`aquaria/ph-strip-test`)

- Quest link: [/quests/aquaria/ph-strip-test](/quests/aquaria/ph-strip-test)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/water-testing`
- Dialogue `requiresItems` gates:
    - `start` → "Strip and gloves ready." — pH strip ×1, nitrile gloves (pair) ×1
    - `dip` → "Dip and read the strip." — pH strip ×1, nitrile gloves (pair) ×1
    - `dip` → "Reading recorded from the strip." — Aquarium pH reading ×1
    - `interpret` → "Reading is within 6.8–7.6" — Aquarium pH reading ×1
    - `interpret` → "Reading is out of range" — Aquarium pH reading ×1
    - `corrective` → "Correction staged; run a mandatory re-test" — pH strip ×1, nitrile gloves (pair) ×1
    - `log` → "Write it in the logbook." — Aquarium pH reading ×1, water test logbook ×1
    - `log` → "Entry logged and dated." — Logged pH entry ×1
- Grants:
    - `start` → "I need a strip." — pH strip ×1
    - `corrective` (node grant) — pH strip ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [measure-aquarium-ph](/processes/measure-aquarium-ph)
        - Requires: pH strip ×1, nitrile gloves (pair) ×1
        - Consumes: pH strip ×1
        - Creates: Aquarium pH reading ×1
    - [log-aquarium-ph-reading](/processes/log-aquarium-ph-reading)
        - Requires: Aquarium pH reading ×1, water test logbook ×1, nitrile gloves (pair) ×1
        - Consumes: Aquarium pH reading ×1
        - Creates: Logged pH entry ×1

## 12) Balance aquarium pH (`aquaria/balance-ph`)

- Quest link: [/quests/aquaria/balance-ph](/quests/aquaria/balance-ph)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/ph-strip-test`
- Dialogue `requiresItems` gates:
    - `start` → "Safety gear and logbook are ready." — nitrile gloves (pair) ×1, safety goggles ×1, water test logbook ×1
    - `start` → "Start baseline capture checklist." — none
    - `baseline` → "Take baseline pH reading." — pH strip ×1, nitrile gloves (pair) ×1
    - `baseline` → "Baseline strip reading is captured." — Aquarium pH reading ×1
    - `baseline-log` → "Record baseline in the logbook." — Aquarium pH reading ×1, water test logbook ×1, nitrile gloves (pair) ×1
    - `baseline-log` → "Baseline entry is logged with date/time." — Logged pH entry ×1
    - `adjust` → "Dose and circulate buffer safely." — nitrile gloves (pair) ×1, safety goggles ×1
    - `adjust` → "Dose complete; ready to re-test." — Logged pH entry ×1
    - `retest` → "Capture post-dose reading." — pH strip ×1, nitrile gloves (pair) ×1
    - `retest` → "Post-dose reading captured." — Aquarium pH reading ×1
    - `interpret` → "Log stable result (6.8–7.6) and close." — Aquarium pH reading ×1, water test logbook ×1
    - `interpret` → "Reading still out of range or livestock looks stressed." — Aquarium pH reading ×1
    - `interpret` → "Result logged; close remediation cycle." — none
    - `troubleshoot` → "Apply a smaller corrective dose." — nitrile gloves (pair) ×1, safety goggles ×1
    - `troubleshoot` → "Correction step staged; proceed to re-test." — none
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [adjust-ph](/processes/adjust-ph)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1, pH down solution (500 mL) ×1, pH up solution (potassium carbonate) ×1
        - Consumes: pH down solution (500 mL) ×0.05, pH up solution (potassium carbonate) ×0.05
        - Creates: none

## 13) Add dwarf shrimp (`aquaria/shrimp`)

- Quest link: [/quests/aquaria/shrimp](/quests/aquaria/shrimp)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/ph-strip-test`, `aquaria/heater-install`, `aquaria/log-water-parameters`
- Dialogue `requiresItems` gates:
    - `start` → "Tank checks passed and I'm ready to stage acclimation gear." — Aquarium liquid test kit ×1
    - `acclimate` → "Start drip acclimation" — Airline tubing ×1, 5 gallon bucket ×1
    - `stress-response` → "Reading logged and behavior recovered; resume controlled acclimation." — Aquarium temperature reading ×1
    - `release` → "Shrimp released without adding store water." — aquarium net ×1
    - `verify` → "Shrimp are active, temperature is logged, and transfer is stable." — Aquarium temperature reading ×1, aquarium net ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Dwarf shrimp ×3
- Processes used:
    - [drip-acclimate-shrimp](/processes/drip-acclimate-shrimp)
        - Requires: Airline tubing ×1, 5 gallon bucket ×1, Dwarf shrimp ×1, Walstad aquarium (80 L) ×1
        - Consumes: none
        - Creates: none
    - [log-walstad-temperature](/processes/log-walstad-temperature)
        - Requires: none
        - Consumes: none
        - Creates: Aquarium temperature reading ×1

## 14) Add Floating Plants (`aquaria/floating-plants`)

- Quest link: [/quests/aquaria/floating-plants](/quests/aquaria/floating-plants)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/shrimp`
- Dialogue `requiresItems` gates:
    - `start` → "Bucket, net, and guppy grass ready." — Guppy grass starter ×1, 5 gallon bucket of dechlorinated tap water ×1, aquarium net ×1, nitrile gloves (pair) ×1
    - `rinse` → "Rinse and inspect the plants." — Guppy grass starter ×1, 5 gallon bucket of dechlorinated tap water ×1, aquarium net ×1, nitrile gloves (pair) ×1
    - `rinse` → "Rinsed bundle ready for the tank." — Rinsed guppy grass ×1
    - `place` → "Float and spread the guppy grass." — Rinsed guppy grass ×1, aquarium LED light (20 W) ×1
    - `place` → "Mat is floating and clear of the intake." — Floating plant mat ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
        - Requires: none
        - Consumes: 5 gallon bucket of tap water (chlorinated) ×1
        - Creates: 5 gallon bucket of dechlorinated tap water ×1
    - [rinse-floating-plants](/processes/rinse-floating-plants)
        - Requires: Guppy grass starter ×1, 5 gallon bucket of dechlorinated tap water ×1, aquarium net ×1, nitrile gloves (pair) ×1
        - Consumes: Guppy grass starter ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Creates: Rinsed guppy grass ×1
    - [place-floating-plants](/processes/place-floating-plants)
        - Requires: Rinsed guppy grass ×1, aquarium LED light (20 W) ×1
        - Consumes: Rinsed guppy grass ×1
        - Creates: Floating plant mat ×1

## 15) Breed your guppies (`aquaria/breeding`)

- Quest link: [/quests/aquaria/breeding](/quests/aquaria/breeding)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/guppy`, `aquaria/floating-plants`
- Dialogue `requiresItems` gates:
    - `start` → "Floating mat and warm tank are ready." — Heated Walstad aquarium with guppies (80 L, 26°C) ×1, Floating plant mat ×1
    - `start` → "Begin fry-cover setup walkthrough." — none
    - `cover` → "Thicken the floating cover." — Heated Walstad aquarium with guppies (80 L, 26°C) ×1, Floating plant mat ×1, Hornwort cuttings ×1
    - `cover` → "Cover is dense and sheltering fry lanes." — Dense fry cover ×1
    - `cover` → "Shelter lanes are confirmed; move to feed planning." — none
    - `feed` → "Powder a week's fry-food reserve." — goldfish food ×1
    - `feed` → "Fry food is portioned and dosing plan is set." — Fry food pinch ×1
    - `feed` → "Feeding plan drafted; continue to monitoring." — none
    - `monitor` → "Log water parameters before graduation." — Aquarium liquid test kit ×1, Liquid test readings ×1, water test logbook ×1, nitrile gloves (pair) ×1
    - `monitor` → "Fry are gasping or losses are appearing." — Dense fry cover ×1
    - `monitor` → "Monitoring checklist complete; review outcomes." — none
    - `stress` → "Run emergency partial water change." — Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
    - `stress` → "Emergency response complete; return to monitoring." — none
    - `outcome` → "Advance fry to juvenile stage." — Dense fry cover ×1, Fry food pinch ×1, Heated Walstad aquarium with guppies (80 L, 26°C) ×1, aquarium thermometer (0–50°C) ×1, Logged water parameters ×1
    - `outcome` → "Juveniles are ready to rehome with stable log evidence." — Juvenile guppy brood ×1, Logged water parameters ×1
    - `outcome` → "Graduation review complete; close breeding cycle." — none
- Grants:
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [prepare-guppy-fry-cover](/processes/prepare-guppy-fry-cover)
        - Requires: Heated Walstad aquarium with guppies (80 L, 26°C) ×1, Floating plant mat ×1, Hornwort cuttings ×1
        - Consumes: Floating plant mat ×1, Hornwort cuttings ×1
        - Creates: Dense fry cover ×1
    - [portion-fry-food](/processes/portion-fry-food)
        - Requires: goldfish food ×1
        - Consumes: goldfish food ×0.5
        - Creates: Fry food pinch ×1
    - [raise-guppy-fry](/processes/raise-guppy-fry)
        - Requires: Dense fry cover ×1, Fry food pinch ×1, Heated Walstad aquarium with guppies (80 L, 26°C) ×1, aquarium thermometer (0–50°C) ×1
        - Consumes: Fry food pinch ×1
        - Creates: Juvenile guppy brood ×1
    - [log-aquarium-test-results](/processes/log-aquarium-test-results)
        - Requires: Aquarium liquid test kit ×1, Liquid test readings ×1, water test logbook ×1, nitrile gloves (pair) ×1
        - Consumes: Liquid test readings ×1
        - Creates: Logged water parameters ×1
    - [partial-water-change](/processes/partial-water-change)
        - Requires: Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×0.25
        - Creates: Freshly changed aquarium (80 L) ×1

## 16) Set up an aquarium for a goldfish (`aquaria/goldfish`)

- Quest link: [/quests/aquaria/goldfish](/quests/aquaria/goldfish)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`, `aquaria/breeding`
- Dialogue `requiresItems` gates:
    - `stage` → "Habitat assembled and filled." — 7 pH freshwater aquarium (150 L) ×1
    - `verify` → "Habitat checks pass and water looks stable." — 7 pH freshwater aquarium (150 L) ×1
    - `troubleshoot` → "System stabilized; return to pre-stock verification." — 7 pH freshwater aquarium (150 L) ×1
    - `troubleshoot` → "Stocked tank stabilized; continue post-stock observation." — aquarium (goldfish) (150 L) ×1
    - `stock` → "Goldfish is in the tank and swimming." — aquarium (goldfish) (150 L) ×1
    - `observe` → "Fish behavior is normal after feed and setup is stable." — aquarium (goldfish) (150 L) ×1
    - `observe` → "Stress signs detected; troubleshoot before proceeding." — none
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Fish Friend Award ×1
- Processes used:
    - [prepare-aquarium](/processes/prepare-aquarium)
        - Requires: none
        - Consumes: aquarium (150 L) ×1, 5 gallon bucket of dechlorinated tap water ×1, Sponge filter ×1, aquarium heater (150 W) ×1, aquarium LED light (20 W) ×1, aquarium thermometer (0–50°C) ×1, aquarium gravel (1 kg) ×20
        - Creates: 5 gallon bucket ×1, 7 pH freshwater aquarium (150 L) ×1
    - [add-goldfish](/processes/add-goldfish)
        - Requires: aquarium net ×1
        - Consumes: 7 pH freshwater aquarium (150 L) ×1, goldfish ×1
        - Creates: aquarium (goldfish) (150 L) ×1
    - [feed-goldfish](/processes/feed-goldfish)
        - Requires: aquarium (goldfish) (150 L) ×1
        - Consumes: goldfish food ×0.1
        - Creates: dGoldfish ×1
    - [check-aquarium-temperature](/processes/check-aquarium-temperature)
        - Requires: 7 pH freshwater aquarium (150 L) ×1, aquarium thermometer (0–50°C) ×1
        - Consumes: none
        - Creates: none

## 17) Perform a partial water change (`aquaria/water-change`)

- Quest link: [/quests/aquaria/water-change](/quests/aquaria/water-change)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/guppy`
- Dialogue `requiresItems` gates:
    - `start` → "Gear gathered and tank is safe to work" — Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, Water conditioner ×1, nitrile gloves (pair) ×1, utility cart ×1
    - `prep` → "Replacement water is conditioned and matched" — 5 gallon bucket of dechlorinated tap water ×1
    - `remove` → "Water swapped and heater restarted" — Freshly changed aquarium (80 L) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [condition-bucket-water](/processes/condition-bucket-water)
        - Requires: 5 gallon bucket ×1, Water conditioner ×1
        - Consumes: Water conditioner ×0.1, 5 gallon bucket of tap water (chlorinated) ×1
        - Creates: 5 gallon bucket of dechlorinated tap water ×1
    - [partial-water-change](/processes/partial-water-change)
        - Requires: Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×0.25
        - Creates: Freshly changed aquarium (80 L) ×1

## 18) Catch a fish with a net (`aquaria/net-fish`)

- Quest link: [/quests/aquaria/net-fish](/quests/aquaria/net-fish)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/water-change`
- Dialogue `requiresItems` gates:
    - `start` → "I'll stage a calm transfer lane and prep checks." — aquarium net ×1
    - `start` → "Fish are skittish; let's run a slower alternate approach." — aquarium net ×1
    - `baseline` → "Baseline is logged and fish are calm enough to net." — Aquarium temperature reading ×1, aquarium net ×1
    - `catch` → "Fish transferred cleanly with minimal stress." — aquarium net ×1
    - `recovery` → "Recovery reading is logged and fish behavior normalized." — Aquarium temperature reading ×1
    - `release` → "Transfer complete, fish recovered, and verification logged." — Aquarium temperature reading ×1, aquarium net ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [log-walstad-temperature](/processes/log-walstad-temperature)
        - Requires: none
        - Consumes: none
        - Creates: Aquarium temperature reading ×1

## 19) Top Off Evaporated Water (`aquaria/top-off`)

- Quest link: [/quests/aquaria/top-off](/quests/aquaria/top-off)
- Unlock prerequisite:
    - `requiresQuests`: `aquaria/water-change`
- Dialogue `requiresItems` gates:
    - `start` → "Tools staged and power cords are clear of splash zones." — gravel vacuum ×1, 5 gallon bucket ×2
    - `prep-water` → "Conditioned water is ready." — 5 gallon bucket of dechlorinated tap water ×1
    - `topoff` → "Waterline restored and fish remain calm." — 5 gallon bucket of dechlorinated tap water ×1
    - `topoff` → "Flow stalled or water clouded; run recovery before finishing." — 5 gallon bucket of dechlorinated tap water ×1
    - `verify` → "Reading logged and backup bucket is aging." — Aquarium temperature reading ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
        - Requires: none
        - Consumes: 5 gallon bucket of tap water (chlorinated) ×1
        - Creates: 5 gallon bucket of dechlorinated tap water ×1
    - [partial-water-change](/processes/partial-water-change)
        - Requires: Heated Walstad aquarium (80 L, 26°C) ×1, gravel vacuum ×1, 5 gallon bucket ×1, 5 gallon bucket of dechlorinated tap water ×1
        - Consumes: 5 gallon bucket of dechlorinated tap water ×0.25
        - Creates: Freshly changed aquarium (80 L) ×1
    - [log-walstad-temperature](/processes/log-walstad-temperature)
        - Requires: Walstad aquarium with thermometer (80 L) ×1
        - Consumes: none
        - Creates: Aquarium temperature reading ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
