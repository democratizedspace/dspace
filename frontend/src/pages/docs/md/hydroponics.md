---
title: 'Hydroponics'
slug: 'hydroponics'
---

Hydroponics quests build practical progression through the hydroponics skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Grow basil hydroponically](/quests/hydroponics/basil)
2. [Bucket, we'll do it live!](/quests/hydroponics/bucket_10)
3. [Install a Grow Light](/quests/hydroponics/grow-light)
4. [Grow Lettuce Hydroponically](/quests/hydroponics/lettuce)
5. [Refresh Nutrient Solution](/quests/hydroponics/nutrient-check)
6. [Check Solution pH](/quests/hydroponics/ph-check)
7. [Calibrate EC Meter](/quests/hydroponics/ec-calibrate)
8. [Check Solution EC](/quests/hydroponics/ec-check)
9. [Test Hydroponic pH](/quests/hydroponics/ph-test)
10. [Refresh the Reservoir](/quests/hydroponics/reservoir-refresh)
11. [Install Submersible Pump](/quests/hydroponics/pump-install)
12. [Prime Water Pump](/quests/hydroponics/pump-prime)
13. [Grow Stevia Hydroponically](/quests/hydroponics/stevia)
14. [Regrow Your Stevia](/quests/hydroponics/regrow-stevia)
15. [Check Water Temperature](/quests/hydroponics/temp-check)
16. [Top Off the Reservoir](/quests/hydroponics/top-off)
17. [Rinse Grow Bed Filter](/quests/hydroponics/filter-clean)
18. [Soak Air Stone](/quests/hydroponics/air-stone-soak)
19. [Soak Starter Plugs](/quests/hydroponics/plug-soak)
20. [Clone Mint Cutting](/quests/hydroponics/mint-cutting)
21. [Rinse the Roots](/quests/hydroponics/root-rinse)
22. [Scrub the Grow Tub](/quests/hydroponics/tub-scrub)
23. [Clean Net Cups](/quests/hydroponics/netcup-clean)

## 1) Grow basil hydroponically (`hydroponics/basil`)

- Quest link: [/quests/hydroponics/basil](/quests/hydroponics/basil)
- Unlock prerequisite:
  - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `accept` → "I've got the hydroponics tub, what's next?" — Beginner hydroponics tub ×1
  - `water` → "Kind of weird that I didn't have one of those already." — sink ×1
  - `bucket` → "Alright, I've completed the challenging task of filling a bucket with water. What's next?" — 5 gallon bucket of tap water (chlorinated) ×1
  - `dechlorinate` → "My water should be good to go now, right?" — 5 gallon bucket of dechlorinated tap water ×1
  - `fill` → "I can add the seeds now, right?" — soaked hydroponic starter plug ×10
  - `germinate` → "Alright, I can see a healthy batch of basil seedlings. Looks like it worked!" — basil seedling ×10
  - `transfer` → "Ok, I've filled the tub with water and nutrients. What's next?" — hydroponics tub (ready) ×1
  - `lighting` → "A month older and a month wiser. I've got a bunch of basil now! Is it time to harvest?" — harvestable basil plant ×10
  - `harvest` → "I've got these fresh bundles of basil! How do they look?" — harvested basil plant ×10
- Grants:
  - `accept` → "Ooh, fancy!" — Beginner hydroponics tub ×1
  - `water` → "Let that sink in!" — sink ×1
  - `transfer` → "Nutrients, eh? I'll take 'em!" — hydroponic nutrient concentrate (1 L) ×1
  - `lighting` → "Cool grow lamp! This'll add a nice pink hue to my room." — hydroponic grow lamp ×1
  - Quest-level `grantsItems`: None
- Rewards:
  - Green Thumb Award ×1
- Processes used:
  - [bucket-water-chlorinated](/processes/bucket-water-chlorinated)
    - Requires: sink ×1
    - Consumes: 5 gallon bucket ×1
    - Creates: 5 gallon bucket of tap water (chlorinated) ×1
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires: none
    - Consumes: 5 gallon bucket of tap water (chlorinated) ×1
    - Creates: 5 gallon bucket of dechlorinated tap water ×1
  - [rockwool-soak](/processes/rockwool-soak)
    - Requires: 5 gallon bucket of dechlorinated tap water ×1
    - Consumes: hydroponic starter plug ×10
    - Creates: soaked hydroponic starter plug ×10
  - [germinate-basil](/processes/germinate-basil)
    - Requires: hydroponic grow lamp ×1
    - Consumes: basil seeds ×10, soaked hydroponic starter plug ×10
    - Creates: basil seedling ×10
  - [prepare-hydroponic-tub](/processes/prepare-hydroponic-tub)
    - Requires: none
    - Consumes: Beginner hydroponics tub ×1, 5 gallon bucket of dechlorinated tap water ×1, hydroponic nutrient concentrate (1 L) ×1
    - Creates: hydroponics tub (ready) ×1
  - [grow-basil](/processes/grow-basil)
    - Requires: hydroponic grow lamp ×1
    - Consumes: basil seedling ×10, hydroponics tub (ready) ×1, dWatt ×24192
    - Creates: harvestable basil plant ×10, hydroponics tub (nutrient deficient) ×1
  - [harvest-basil](/processes/harvest-basil)
    - Requires: none
    - Consumes: harvestable basil plant ×10
    - Creates: bundle of basil leaves ×10, harvested basil plant ×10
  - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
    - Requires: EC meter ×1, 50 mL measuring syringe ×1
    - Consumes: hydroponics tub (nutrient deficient) ×1, 5 gallon bucket of dechlorinated tap water ×1, hydroponic nutrient concentrate (1 L) ×0.1
    - Creates: hydroponics tub (ready) ×1
  - [regrow-basil](/processes/regrow-basil)
    - Requires: none
    - Consumes: harvested basil plant ×10, hydroponics tub (ready) ×1, dWatt ×8064
    - Creates: harvestable basil plant ×10, hydroponics tub (nutrient deficient) ×1

## 2) Bucket, we'll do it live! (`hydroponics/bucket_10`)

- Quest link: [/quests/hydroponics/bucket_10](/quests/hydroponics/bucket_10)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/basil`, `3dprinter/start`
- Dialogue `requiresItems` gates:
  - `haul` → "I stacked ten buckets!" — ten-bucket water haul ×1
  - `check` → "Claim the Hydro Award" — ten-bucket water haul ×1
  - `check` → "Award in hand!" — Hydro Award ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [stage-ten-buckets](/processes/stage-ten-buckets)
    - Requires: 5 gallon bucket of dechlorinated tap water ×10
    - Consumes: 5 gallon bucket of dechlorinated tap water ×10
    - Creates: ten-bucket water haul ×1
  - [award-hydro-haul](/processes/award-hydro-haul)
    - Requires: ten-bucket water haul ×1
    - Consumes: ten-bucket water haul ×1
    - Creates: Hydro Award ×1

## 3) Install a Grow Light (`hydroponics/grow-light`)

- Quest link: [/quests/hydroponics/grow-light](/quests/hydroponics/grow-light)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/bucket_10`
- Dialogue `requiresItems` gates:
  - `install` → "Light installed." — hydroponic grow lamp ×1, smart plug ×1, mechanical outlet timer ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [smart-plug-schedule-12h](/processes/smart-plug-schedule-12h)
    - Requires: smart plug ×1
    - Consumes: none
    - Creates: none

## 4) Grow Lettuce Hydroponically (`hydroponics/lettuce`)

- Quest link: [/quests/hydroponics/lettuce](/quests/hydroponics/lettuce)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - `plant` → "Seedlings look great!" — Lettuce Seeds ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - Lettuce Seeds ×1
- Processes used:
  - None

## 5) Refresh Nutrient Solution (`hydroponics/nutrient-check`)

- Quest link: [/quests/hydroponics/nutrient-check](/quests/hydroponics/nutrient-check)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - `add` → "Mix and circulate." — hydroponic nutrient concentrate (1 L) ×1, nitrile gloves (pair) ×1, safety goggles ×1, submersible water pump ×1, 50 mL measuring syringe ×1, pH test strip pack ×1
  - `add` → "Check EC levels." — EC meter ×1, hydroponics tub (ready) ×1
  - `add` → "Reservoir topped off!" — hydroponics tub (ready) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
    - Requires: EC meter ×1, 50 mL measuring syringe ×1
    - Consumes: hydroponics tub (nutrient deficient) ×1, 5 gallon bucket of dechlorinated tap water ×1, hydroponic nutrient concentrate (1 L) ×0.1
    - Creates: hydroponics tub (ready) ×1
  - [measure-ec-solution](/processes/measure-ec-solution)
    - Requires: EC meter ×1, hydroponics tub (ready) ×1
    - Consumes: none
    - Creates: none

## 6) Check Solution pH (`hydroponics/ph-check`)

- Quest link: [/quests/hydroponics/ph-check](/quests/hydroponics/ph-check)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `measure` → "Reading looks good" — hydroponic pH reading ×1
  - `log` → "Logged and synced" — hydroponic pH log ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [measure-ph](/processes/measure-ph)
    - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
    - Consumes: pH strip ×1
    - Creates: hydroponic pH reading ×1
  - [log-stable-ph](/processes/log-stable-ph)
    - Requires: hydroponics tub (ready) ×1, hydroponic pH reading ×1
    - Consumes: hydroponic pH reading ×1
    - Creates: hydroponic pH log ×1
  - [adjust-ph](/processes/adjust-ph)
    - Requires: nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1, pH down solution (500 mL) ×1, pH up solution (potassium carbonate) ×1
    - Consumes: pH down solution (500 mL) ×0.05, pH up solution (potassium carbonate) ×0.05
    - Creates: none

## 7) Calibrate EC Meter (`hydroponics/ec-calibrate`)

- Quest link: [/quests/hydroponics/ec-calibrate](/quests/hydroponics/ec-calibrate)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/ph-check`
- Dialogue `requiresItems` gates:
  - `calibrate` → "Calibration complete" — EC meter ×1, EC calibration solution (1000 ppm) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [calibrate-ec-meter](/processes/calibrate-ec-meter)
    - Requires: EC meter ×1, EC calibration solution (1000 ppm) ×1
    - Consumes: EC calibration solution (1000 ppm) ×1
    - Creates: none

## 8) Check Solution EC (`hydroponics/ec-check`)

- Quest link: [/quests/hydroponics/ec-check](/quests/hydroponics/ec-check)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/ec-calibrate`
- Dialogue `requiresItems` gates:
  - `measure` → "Meter reading looks good." — EC meter ×1, hydroponics tub (ready) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [measure-ec-solution](/processes/measure-ec-solution)
    - Requires: EC meter ×1, hydroponics tub (ready) ×1
    - Consumes: none
    - Creates: none

## 9) Test Hydroponic pH (`hydroponics/ph-test`)

- Quest link: [/quests/hydroponics/ph-test](/quests/hydroponics/ph-test)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `measure` → "pH adjusted" — digital pH meter ×1, pH down solution (500 mL) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [measure-ph](/processes/measure-ph)
    - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
    - Consumes: pH strip ×1
    - Creates: hydroponic pH reading ×1

## 10) Refresh the Reservoir (`hydroponics/reservoir-refresh`)

- Quest link: [/quests/hydroponics/reservoir-refresh](/quests/hydroponics/reservoir-refresh)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `drain` → "All filled up!" — hydroponics tub (ready) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
    - Requires: EC meter ×1, 50 mL measuring syringe ×1
    - Consumes: hydroponics tub (nutrient deficient) ×1, 5 gallon bucket of dechlorinated tap water ×1, hydroponic nutrient concentrate (1 L) ×0.1
    - Creates: hydroponics tub (ready) ×1

## 11) Install Submersible Pump (`hydroponics/pump-install`)

- Quest link: [/quests/hydroponics/pump-install](/quests/hydroponics/pump-install)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/reservoir-refresh`
- Dialogue `requiresItems` gates:
  - `place` → "Pump installed!" — submersible water pump ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 12) Prime Water Pump (`hydroponics/pump-prime`)

- Quest link: [/quests/hydroponics/pump-prime](/quests/hydroponics/pump-prime)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
  - `prime` → "Pump is primed" — submersible water pump ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [prime-pump](/processes/prime-pump)
    - Requires: TBD — process IO not yet specified (known gap)
    - Consumes: TBD — process IO not yet specified (known gap)
    - Creates: TBD — process IO not yet specified (known gap)

## 13) Grow Stevia Hydroponically (`hydroponics/stevia`)

- Quest link: [/quests/hydroponics/stevia](/quests/hydroponics/stevia)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/lettuce`
- Dialogue `requiresItems` gates:
  - `plant` → "Seedlings look healthy!" — stevia seedling ×10
  - `grow` → "They're full grown and smell sweet!" — harvestable stevia plant ×10
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [germinate-stevia](/processes/germinate-stevia)
    - Requires: hydroponic grow lamp ×1
    - Consumes: stevia seeds ×10, soaked hydroponic starter plug ×10
    - Creates: stevia seedling ×10
  - [grow-stevia](/processes/grow-stevia)
    - Requires: hydroponic grow lamp ×1
    - Consumes: stevia seedling ×6, hydroponics tub (ready) ×1, dWatt ×16128
    - Creates: harvestable stevia plant ×6, hydroponics tub (nutrient deficient) ×1
  - [harvest-stevia](/processes/harvest-stevia)
    - Requires: none
    - Consumes: harvestable stevia plant ×1
    - Creates: bundle of stevia leaves ×10, harvested stevia plant ×1

## 14) Regrow Your Stevia (`hydroponics/regrow-stevia`)

- Quest link: [/quests/hydroponics/regrow-stevia](/quests/hydroponics/regrow-stevia)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/stevia`
- Dialogue `requiresItems` gates:
  - `regrow` → "New leaves sprouting!" — harvestable stevia plant ×10
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [regrow-stevia](/processes/regrow-stevia)
    - Requires: none
    - Consumes: harvested stevia plant ×10, hydroponics tub (ready) ×1, dWatt ×8064
    - Creates: harvestable stevia plant ×10, hydroponics tub (nutrient deficient) ×1

## 15) Check Water Temperature (`hydroponics/temp-check`)

- Quest link: [/quests/hydroponics/temp-check](/quests/hydroponics/temp-check)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `measure` → "Measure temperature" — 7 pH freshwater aquarium (150 L) ×1, aquarium thermometer (0–50°C) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [check-aquarium-temperature](/processes/check-aquarium-temperature)
    - Requires: 7 pH freshwater aquarium (150 L) ×1, aquarium thermometer (0–50°C) ×1
    - Consumes: none
    - Creates: none

## 16) Top Off the Reservoir (`hydroponics/top-off`)

- Quest link: [/quests/hydroponics/top-off](/quests/hydroponics/top-off)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
  - `fill` → "Water added!" — 5 gallon bucket of dechlorinated tap water ×1
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

## 17) Rinse Grow Bed Filter (`hydroponics/filter-clean`)

- Quest link: [/quests/hydroponics/filter-clean](/quests/hydroponics/filter-clean)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/top-off`
- Dialogue `requiresItems` gates:
  - `rinse` → "Filter's all clean!" — 5 gallon bucket of dechlorinated tap water ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 18) Soak Air Stone (`hydroponics/air-stone-soak`)

- Quest link: [/quests/hydroponics/air-stone-soak](/quests/hydroponics/air-stone-soak)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
  - `soak` → "Stone is hydrated." — soaked air stone ×1
  - `prime` → "Bubbles are even" — primed air stone ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [soak-air-stone](/processes/soak-air-stone)
    - Requires: porous air stone ×1, 5 gallon bucket of dechlorinated tap water ×1
    - Consumes: 5 gallon bucket of dechlorinated tap water ×0.5
    - Creates: soaked air stone ×1
  - [prime-air-stone](/processes/prime-air-stone)
    - Requires: soaked air stone ×1, aquarium air pump ×1, Airline tubing ×1
    - Consumes: soaked air stone ×1
    - Creates: primed air stone ×1

## 19) Soak Starter Plugs (`hydroponics/plug-soak`)

- Quest link: [/quests/hydroponics/plug-soak](/quests/hydroponics/plug-soak)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/top-off`
- Dialogue `requiresItems` gates:
  - `soak` → "They're fully soaked!" — soaked hydroponic starter plug ×10
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [rockwool-soak](/processes/rockwool-soak)
    - Requires: 5 gallon bucket of dechlorinated tap water ×1
    - Consumes: hydroponic starter plug ×10
    - Creates: soaked hydroponic starter plug ×10

## 20) Clone Mint Cutting (`hydroponics/mint-cutting`)

- Quest link: [/quests/hydroponics/mint-cutting](/quests/hydroponics/mint-cutting)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/plug-soak`
- Dialogue `requiresItems` gates:
  - `prep` → "Cut and plant" — 5 gallon bucket of dechlorinated tap water ×1, soaked hydroponic starter plug ×1
  - `prep` → "Cutting is nestled in" — 5 gallon bucket of dechlorinated tap water ×1, soaked hydroponic starter plug ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - [clone-mint-cutting](/processes/clone-mint-cutting)
    - Requires: 5 gallon bucket of dechlorinated tap water ×1, soaked hydroponic starter plug ×1
    - Consumes: none
    - Creates: none

## 21) Rinse the Roots (`hydroponics/root-rinse`)

- Quest link: [/quests/hydroponics/root-rinse](/quests/hydroponics/root-rinse)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
  - `water` → "Water is ready" — 5 gallon bucket of dechlorinated tap water ×1
  - `rinse` → "Flush the roots" — 5 gallon bucket of dechlorinated tap water ×1
  - `rinse` → "Runoff is clear and roots look relieved." — rinsed hydroponic root zone ×1
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
  - [flush-root-zone](/processes/flush-root-zone)
    - Requires: 5 gallon bucket of dechlorinated tap water ×1, Beginner hydroponics tub ×1
    - Consumes: 5 gallon bucket of dechlorinated tap water ×1
    - Creates: rinsed hydroponic root zone ×1

## 22) Scrub the Grow Tub (`hydroponics/tub-scrub`)

- Quest link: [/quests/hydroponics/tub-scrub](/quests/hydroponics/tub-scrub)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/reservoir-refresh`
- Dialogue `requiresItems` gates:
  - `scrub` → "Walls are spotless!" — 5 gallon bucket of dechlorinated tap water ×1
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

## 23) Clean Net Cups (`hydroponics/netcup-clean`)

- Quest link: [/quests/hydroponics/netcup-clean](/quests/hydroponics/netcup-clean)
- Unlock prerequisite:
  - `requiresQuests`: `hydroponics/tub-scrub`
- Dialogue `requiresItems` gates:
  - `mix` → "Water is ready" — 5 gallon bucket of dechlorinated tap water ×1, hydrogen peroxide (3%) ×1
  - `soak` → "Bath is mixed" — peroxide rinse bath ×1
  - `scrub` → "Cups look clean" — sanitized net cups ×1
  - `dry` → "Bone dry and ready" — dried net cups ×1
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
  - [mix-peroxide-bath](/processes/mix-peroxide-bath)
    - Requires: 5 gallon bucket of dechlorinated tap water ×1, hydrogen peroxide (3%) ×1, nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1
    - Consumes: 5 gallon bucket of dechlorinated tap water ×1, hydrogen peroxide (3%) ×0.02
    - Creates: peroxide rinse bath ×1
  - [sanitize-net-cups](/processes/sanitize-net-cups)
    - Requires: peroxide rinse bath ×1, Beginner hydroponics tub ×1
    - Consumes: peroxide rinse bath ×1
    - Creates: sanitized net cups ×1
  - [dry-net-cups](/processes/dry-net-cups)
    - Requires: sanitized net cups ×1
    - Consumes: sanitized net cups ×1
    - Creates: dried net cups ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
