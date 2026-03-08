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
    - dChat ×1, dUSD ×1000
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
    - `stage`/`haul` → inspection handoff — ten-bucket water haul ×1
    - `recover` → inspection retry — ten-bucket water haul ×1
    - `check` → "Claim the Hydro Award." — ten-bucket water haul ×1
    - `check` → "Award in hand." — Hydro Award ×1
- Recovery/troubleshooting branches:
    - `inspect` routes unstable stacks to `recover`, then loops back to verification
- Safety/ops checks:
    - Explicit lifting, spill-control, and aisle-clearance checks before award exchange
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
- Processes used:
    - [stage-ten-buckets](/processes/stage-ten-buckets)
        - Requires: 5 gallon bucket of dechlorinated tap water ×10
        - Consumes: none
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
    - `prep`/`install`/`staged-verify` → verification handoff — hydroponic grow lamp ×1, smart plug ×1, mechanical outlet timer ×1
    - `verify` → "Cycle transitions cleanly; no heat or routing issues." — hydroponic grow lamp ×1
- Recovery/troubleshooting branches:
    - `verify` routes flicker/heat/moisture failures to `recover` and loops back through install + verification
- Safety/ops checks:
    - Dry-hands + unplugged setup gate before installation
    - Drip-loop and thermal-risk checks before completion
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
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
    - `kit` → "Seeds and plugs are ready." — Lettuce Seeds ×10, hydroponic starter plug ×10
    - `soak` → "Setup artifact ready: soaked plugs." — soaked hydroponic starter plug ×10
    - `germinate` → "Seedlings are healthy and uniform." — lettuce seedling ×10
    - `transfer` → "Outcome artifact ready: mature heads." — harvestable lettuce head ×10
    - `harvest` → "Harvest quality passes and leaves are packed." — harvested lettuce leaves ×10
- Recovery/troubleshooting branches:
    - `germinate` → `stress` for damping-off/stretching; loops to `germinate` or full restart at `kit`
    - `harvest` routes to `stress` when heads are underdeveloped before restarting the next grow cycle
- Grants:
    - `kit` → "Stock me up." — Lettuce Seeds ×10, hydroponic starter plug ×10
    - Quest-level `grantsItems`: None
- Rewards:
    - Green Thumb Award ×1
- Processes used:
    - [rockwool-soak](/processes/rockwool-soak)
    - [germinate-lettuce](/processes/germinate-lettuce)
    - [grow-lettuce](/processes/grow-lettuce)
    - [harvest-lettuce](/processes/harvest-lettuce)

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
    - Green Thumb Award ×1
- Processes used:
    - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
        - Requires: EC meter ×1, 50 mL measuring syringe ×1
        - Consumes: hydroponics tub (nutrient deficient) ×1, 5 gallon bucket of dechlorinated tap water ×1, hydroponic nutrient concentrate (1 L) ×0.1
        - Creates: hydroponics tub (ready) ×1
    - [measure-ec-solution](/processes/measure-ec-solution)
        - Requires: EC meter ×1, hydroponics tub (ready) ×1
        - Consumes: none
        - Creates: hydroponic nutrient solution EC log ×1

## 6) Check Solution pH (`hydroponics/ph-check`)

- Quest link: [/quests/hydroponics/ph-check](/quests/hydroponics/ph-check)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
    - `prep` → "Gloves, goggles, and clean sample cylinder are ready." — nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
    - `measure` → "Reading captured." — hydroponic pH reading ×1
    - `interpret` → both interpretation choices require hydroponic pH reading ×1
    - `log` → "Stable reading logged and reviewed." — hydroponic pH log ×1
- Recovery/troubleshooting branches:
    - `troubleshoot` branch handles strip/reagent/circulation failures and loops back through `prep`/`measure`
- Safety/ops checks:
    - PPE gate before measurement and PPE requirements on correction step
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
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
    - `prep` → baseline handoff — EC meter ×1, EC calibration solution (1000 ppm) ×1
    - `verify`/`interpret` → interpretation handoff — hydroponic nutrient solution EC log ×1 (post-calibration capture)
    - `calibrate` → calibration run — EC meter ×1, EC calibration solution (1000 ppm) ×1
- Recovery/troubleshooting branches:
    - `interpret` routes drift failures to `corrective`, then loops through recalibration + re-test
- Pass/fail bounds:
    - Post-calibration reading must be within 950-1050 ppm (1000 ppm ±5%) before `finish` unlocks
- Safety/ops checks:
    - Probe rinsing and fresh-solution handling gate before calibration
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Lettuce Seeds ×1
- Processes used:
    - [measure-ec](/processes/measure-ec)
    - [measure-ec-solution](/processes/measure-ec-solution)
    - [calibrate-ec-meter](/processes/calibrate-ec-meter)
        - Requires: EC meter ×1, EC calibration solution (1000 ppm) ×1
        - Consumes: EC calibration solution (1000 ppm) ×1
        - Creates: none

## 8) Check Solution EC (`hydroponics/ec-check`)

- Quest link: [/quests/hydroponics/ec-check](/quests/hydroponics/ec-check)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/ec-calibrate`
- Dialogue `requiresItems` gates:
    - `measure` → "Capture EC reading." — EC meter ×1, hydroponics tub (ready) ×1
    - `measure` → "Reading logged; let's interpret it." — hydroponic nutrient solution EC log ×1
    - `interpret` → "In range (1.2-1.8). Close and record cadence." — hydroponic nutrient solution EC log ×1
    - `adjust` → "Apply correction and circulate." — hydroponic nutrient concentrate (1 L) ×1, nitrile gloves (pair) ×1, safety goggles ×1, submersible water pump ×1, hydroponics tub (ready) ×1
- Recovery/troubleshooting branches:
    - Out-of-range/caution path routes through `adjust` and loops back to `measure`
- Safety/ops checks:
    - Explicit PPE and small-step correction before retesting
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
- Processes used:
    - [measure-ec-solution](/processes/measure-ec-solution)
    - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)

## 9) Test Hydroponic pH (`hydroponics/ph-test`)

- Quest link: [/quests/hydroponics/ph-test](/quests/hydroponics/ph-test)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
    - `prep` → "PPE and meter are staged." — digital pH meter ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `measure` → "Reading captured; interpret against target band." — hydroponic pH reading ×1
    - `interpret` → "Reading is within 5.5-6.5; proceed to logging." — hydroponic pH reading ×1
    - `interpret` → "Reading is out of range; start correction cycle." — hydroponic pH reading ×1, hydroponics tub (ready) ×1
    - `retest` → "Post-adjustment reading captured; re-interpret latest state." — hydroponic pH reading ×2
    - `retest-interpret` → "Retest is within 5.5-6.5; proceed to logging." — hydroponic pH reading ×2, hydroponics tub (ready) ×1
    - `retest-interpret` → "Retest is still out of range; run another correction cycle." — hydroponic pH reading ×2, hydroponics tub (ready) ×1
    - `log` → "Stable reading logged and reviewed." — hydroponic pH log ×1
- Recovery/troubleshooting branches:
    - `adjust` routes to `retest` and `retest-interpret`, requiring a post-adjustment measurement before interpretation can continue
    - `recover` handles strip/meter/circulation faults, then returns to `prep` or `measure`
- Safety/ops checks:
    - PPE gate before measurement and before chemical correction
    - Explicit out-of-range threshold handling (target pH 5.5-6.5)
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
- Processes used:
    - [measure-ph](/processes/measure-ph)
        - Requires: hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1, 100 mL graduated cylinder ×1
        - Consumes: pH strip ×1
        - Creates: hydroponic pH reading ×1
    - [adjust-ph](/processes/adjust-ph)
        - Requires: nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1, pH down solution (500 mL) ×1, pH up solution (potassium carbonate) ×1
        - Consumes: pH down solution (500 mL) ×0.05, pH up solution (potassium carbonate) ×0.05
        - Creates: None
    - [log-stable-ph](/processes/log-stable-ph)
        - Requires: hydroponics tub (ready) ×1, hydroponic pH reading ×1
        - Consumes: hydroponic pH reading ×1
        - Creates: hydroponic pH log ×1

## 10) Refresh the Reservoir (`hydroponics/reservoir-refresh`)

- Quest link: [/quests/hydroponics/reservoir-refresh](/quests/hydroponics/reservoir-refresh)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
    - `isolate` → "System isolated with PPE in place." — hydroponics tub (nutrient deficient) ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `mix` → "Fresh solution is mixed; verify reservoir state." — hydroponics tub (ready) ×1
    - `verify` → "Reservoir is clear and stable after refresh." — hydroponics tub (ready) ×1, nitrile gloves (pair) ×1
    - `troubleshoot` → "Corrective mix complete; verify stability again." — hydroponics tub (ready) ×2
- Recovery/troubleshooting branches:
    - `verify` routes to `troubleshoot` for clouding/residue/drift, then loops back through re-mix and re-verification
- Safety/ops checks:
    - Explicit PPE + power-isolation gate before refresh and before final closure
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
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
    - `kit` → "Kit is assembled and power is isolated." — submersible water pump ×1, hydroponics tub (ready) ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `install` → "Pump is physically installed." — installed submersible pump loop ×1
    - `verify` → "Flow is stable and documented." — verified hydroponic circulation loop ×1
    - `rollback` → "Re-verify after corrective changes." — installed submersible pump loop ×1
- Recovery/troubleshooting branches:
    - `rollback` branch enforces power-down, reseat, seal checks, then loops back to verification with installed hardware
- Safety/ops checks:
    - Electrical isolation + PPE before install, with explicit rollback before retry
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Lettuce Seeds ×1
- Processes used:
    - [install-submersible-pump](/processes/install-submersible-pump)
        - Requires: submersible water pump ×1, hydroponics tub (ready) ×1, nitrile gloves (pair) ×1
        - Consumes: submersible water pump ×1, hydroponics tub (ready) ×1, nitrile gloves (pair) ×1
        - Creates: installed submersible pump loop ×1
    - [verify-hydroponic-flow](/processes/verify-hydroponic-flow)
        - Requires: installed submersible pump loop ×1
        - Consumes: installed submersible pump loop ×1
        - Creates: verified hydroponic circulation loop ×1

## 12) Prime Water Pump (`hydroponics/pump-prime`)

- Quest link: [/quests/hydroponics/pump-prime](/quests/hydroponics/pump-prime)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
    - `precheck` → "Installed loop, submerged intake, and PPE confirmed." — installed submersible pump loop ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `precheck` → "Verified loop, submerged intake, and PPE confirmed." — verified hydroponic circulation loop ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `prime` → "Run controlled prime cycle with wet intake." — submersible water pump ×1, hydroponics tub (ready) ×1, nitrile gloves (pair) ×1
    - `prime` → "Prime cycle done; verify circulation artifact." — installed submersible pump loop ×1
    - `prime` → "Prime cycle done; use existing verification artifact." — verified hydroponic circulation loop ×1
    - `verify` → "Flow is stable after priming." — verified hydroponic circulation loop ×1
    - `recover` → "Hardware is reseated; re-verify now." — installed submersible pump loop ×1
    - `recover` → "Hardware is reseated; use verified loop to continue checks." — verified hydroponic circulation loop ×1
- Recovery/troubleshooting branches:
    - `precheck` can route to `recover` when cavitation/air ingress is observed
    - `verify` routes to `recover` for reseat/top-off retry before re-verification
- Safety/ops checks:
    - Pre-energize PPE and submerged-intake checks; power-down recovery loop before retry
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Lettuce Seeds ×1
- Processes used:
    - [install-submersible-pump](/processes/install-submersible-pump)
        - Requires: submersible water pump ×1, hydroponics tub (ready) ×1, nitrile gloves (pair) ×1
        - Consumes: submersible water pump ×1, hydroponics tub (ready) ×1, nitrile gloves (pair) ×1
        - Creates: installed submersible pump loop ×1
    - [verify-hydroponic-flow](/processes/verify-hydroponic-flow)
        - Requires: installed submersible pump loop ×1
        - Consumes: installed submersible pump loop ×1
        - Creates: verified hydroponic circulation loop ×1

## 13) Grow Stevia Hydroponically (`hydroponics/stevia`)

- Quest link: [/quests/hydroponics/stevia](/quests/hydroponics/stevia)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/lettuce`
- Dialogue `requiresItems` gates:
    - `setup` → "Seedlings are established and ready for transplant." — stevia seedling ×10
    - `grow` → "Start controlled grow cycle." — hydroponic grow lamp ×1
    - `grow` → "Mature plants are ready for harvest." — harvestable stevia plant ×10
    - `recover` → "Stabilize reservoir before retrying." — EC meter ×1, 50 mL measuring syringe ×1
    - `harvest` → "Harvest completed with staged evidence." — bundle of stevia leaves ×1
- Recovery/troubleshooting branches:
    - `setup` and `grow` both branch to `recover` for mold, yellowing, or stalled growth before returning to staged setup
- Safety/ops checks:
    - Recovery path enforces chemistry stabilization before restarting staged lifecycle gates
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Lettuce Seeds ×10
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
    - `setup` → "Mother plants and ready tub are staged." — harvested stevia plant ×10, hydroponics tub (ready) ×1
    - `regrow` → "New growth appears; verify outcome evidence." — harvestable stevia plant ×10, hydroponics tub (nutrient deficient) ×1
    - `verify` → "Outcome verified; regrow cycle is healthy." — harvestable stevia plant ×10
- Recovery/troubleshooting branches:
    - `recover` refreshes nutrient chemistry and loops back to `setup`
- Safety/ops checks:
    - Explicit pause/resume criteria when wilting or yellowing appears
    - Requires chemistry restabilization before re-entry
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
- Processes used:
    - [regrow-stevia](/processes/regrow-stevia)
        - Requires: none
        - Consumes: harvested stevia plant ×10, hydroponics tub (ready) ×1, dWatt ×8064
        - Creates: harvestable stevia plant ×10, hydroponics tub (nutrient deficient) ×1
    - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
        - Requires: EC meter ×1, 50 mL measuring syringe ×1
        - Consumes: hydroponics tub (nutrient deficient) ×1, 5 gallon bucket of dechlorinated tap water ×1, hydroponic nutrient concentrate (1 L) ×0.1
        - Creates: hydroponics tub (ready) ×1

## 15) Check Water Temperature (`hydroponics/temp-check`)

- Quest link: [/quests/hydroponics/temp-check](/quests/hydroponics/temp-check)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
    - `attach` → "Attach thermometer for a stable reading." — hydroponics tub (ready) ×1, hydroponic strip thermometer (0–50°C) ×1, paper towel ×1
    - `attach` → "Thermometer mounted; capture temperature log." — hydroponic reservoir with mounted thermometer strip ×1
    - `measure` → "Record temperature log artifact." — hydroponic reservoir with mounted thermometer strip ×1
    - `measure` → "Temperature log captured." — hydroponic reservoir temperature reading ×1
    - `interpret` → "In range and stable; close this check." — hydroponic reservoir temperature reading ×1
    - `correct` → "Stabilize reservoir before retest." — EC meter ×1, 50 mL measuring syringe ×1
- Recovery/troubleshooting branches:
    - `interpret` branches to `correct` for caution/fail thresholds, then loops to `measure` for mandatory re-log
- Safety/ops checks:
    - Correction node requires gradual changes to avoid thermal shock before retesting
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
- Processes used:
    - [attach-hydroponic-reservoir-thermometer](/processes/attach-hydroponic-reservoir-thermometer)
        - Requires: hydroponics tub (ready) ×1, hydroponic strip thermometer (0–50°C) ×1, paper towel ×1
        - Consumes: hydroponic strip thermometer (0–50°C) ×1, paper towel ×1
        - Creates: hydroponic reservoir with mounted thermometer strip ×1
    - [log-hydroponic-reservoir-temperature](/processes/log-hydroponic-reservoir-temperature)
        - Requires: hydroponic reservoir with mounted thermometer strip ×1
        - Consumes: none
        - Creates: hydroponic reservoir temperature reading ×1
    - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)

## 16) Top Off the Reservoir (`hydroponics/top-off`)

- Quest link: [/quests/hydroponics/top-off](/quests/hydroponics/top-off)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
    - `start` → "Run the top-off checklist." — hydroponics tub (ready) ×1 (unlocked by the step's one-time sync claim)
    - `prep` → "Supplies ready and system looks stable." — 5 gallon bucket of dechlorinated tap water ×1, hydroponics tub (ready) ×1
    - `fill` → "Re-balance nutrients before measuring EC." — hydroponic nutrient concentrate (1 L) ×1, nitrile gloves (pair) ×1, safety goggles ×1, submersible water pump ×1, hydroponics tub (ready) ×1
    - `fill` → "Record post-top-off EC." — EC meter ×1, hydroponics tub (ready) ×1
    - `fill` → "Water added and EC measured." — hydroponic nutrient solution EC log ×1
- Recovery/troubleshooting branches:
    - `prep` can branch to `diagnose` and `pause` for leak/cavitation recovery before re-entry
    - `verify` loops back to `fill` for nutrient correction + EC re-check when off-target
- Grants:
    - `start` → "Sync the working reservoir state before top-off." — hydroponics tub (ready) ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Lettuce Seeds ×1
- Processes used:
    - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - [measure-ec-solution](/processes/measure-ec-solution)

## 17) Rinse Grow Bed Filter (`hydroponics/filter-clean`)

- Quest link: [/quests/hydroponics/filter-clean](/quests/hydroponics/filter-clean)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/top-off`
- Dialogue `requiresItems` gates:
    - `prep` → "Kit is staged." — Sponge filter ×1, 5 gallon bucket of dechlorinated tap water ×1, nitrile gloves (pair) ×1
    - `rinse` → "Core is rinsed and still wet." — Rinsed sponge filter core ×1
    - `restart` → "Flow restored; verify post-clean evidence." — Restored sponge filter flow ×1
- Recovery/troubleshooting branches:
    - `rinse` → `contamination` branch for black water/sulfur odor; loops back through second rinse
    - `verify` loops back to `rinse` if post-clean flow is unstable
- Safety/ops checks:
    - Explicit no-chlorine media handling and safe dirty-water disposal in contamination path
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Green Thumb Award ×1
- Processes used:
    - [rinse-aquarium-filter](/processes/rinse-aquarium-filter)
    - [restart-sponge-filter](/processes/restart-sponge-filter)

## 18) Soak Air Stone (`hydroponics/air-stone-soak`)

- Quest link: [/quests/hydroponics/air-stone-soak](/quests/hydroponics/air-stone-soak)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
    - `prep` → "Water, gloves, and goggles are ready." — 5 gallon bucket of dechlorinated tap water ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `soak` → "Soak artifact captured; move to prime test." — soaked air stone ×1
    - `prime` → "Prime completed; verify output artifact." — primed air stone ×1
    - `verify` → "Even airflow is stable; stone is production ready." — primed air stone ×1, nitrile gloves (pair) ×1, safety goggles ×1
- Recovery/troubleshooting branches:
    - `recover` handles cloudy soak water, residue shedding, and uneven bubble spread before looping to `soak`/`prep`
- Safety/ops checks:
    - PPE gate before soak and verification
    - One-minute stability verification before closure
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Green Thumb Award ×1
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
    - `prep` → "Bucket, gloves, and goggles are ready." — 5 gallon bucket of dechlorinated tap water ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `soak` → "Soak completed; verify tray moisture." — soaked hydroponic starter plug ×10
    - `verify` → "All sampled plugs passed moisture and integrity checks." — soaked hydroponic starter plug ×10, nitrile gloves (pair) ×1
    - `recover` → "Recovery soak completed; re-check moisture." — soaked hydroponic starter plug ×20
- Recovery/troubleshooting branches:
    - `verify` routes to `recover` for dry-core/crumbly-plug failures, then loops through a fresh soak before re-check
- Safety/ops checks:
    - PPE gate before soak and explicit "no seeding until verification passes" recovery instruction
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Green Thumb Award ×1
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
    - `stage-setup` → "Setup is ready for cutting." — 5 gallon bucket of dechlorinated tap water ×1, soaked hydroponic starter plug ×1, nitrile gloves (pair) ×1
    - `plant` → "Run mint cutting setup process." — 5 gallon bucket of dechlorinated tap water ×1, soaked hydroponic starter plug ×1
    - `plant` → "Cutting is set; move to root outcome checks." — soaked hydroponic starter plug ×1
    - `observe` → "Cutting is upright with visible root start." — soaked hydroponic starter plug ×1, 5 gallon bucket of dechlorinated tap water ×1
    - `stress-check` → "Pause complete; run a recovery recut and re-soak." — none
    - `recover` → "Run recovery cutting pass." — 5 gallon bucket of dechlorinated tap water ×1, soaked hydroponic starter plug ×1
    - `recover` → "Recovery complete; re-check root and leaf condition." — soaked hydroponic starter plug ×2
- Recovery/troubleshooting branches:
    - `observe` routes to `stress-check` for wilt/rot signs before any retry.
    - `stress-check` enforces a timed pause + sanitation checkpoint, then branches to recovery or full restart.
    - `recover` loops back to outcome verification after the contingency gate.
- Safety/ops checks:
    - Setup stage requires clean handling PPE before cloning and includes abort guidance if rot persists after retry
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
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
    - `water` → "Water ready and tray is isolated." — 5 gallon bucket of dechlorinated tap water ×1, Beginner hydroponics tub ×1
    - `baseline` → "Take initial runoff sample." — 5 gallon bucket of dechlorinated tap water ×1, Beginner hydroponics tub ×1
    - `baseline` → "Baseline captured; proceed to full rinse." — rinsed hydroponic root zone ×1
    - `rinse` → "Perform full root-zone flush." — 5 gallon bucket of dechlorinated tap water ×1
    - `verify` → "Runoff clear and roots look relieved." — rinsed hydroponic root zone ×2
- Recovery/troubleshooting branches:
    - `contam` branch pauses dosing, requires cleanup, and loops back to prep/flush
- Safety/ops checks:
    - Pump isolation check before flush and repeat-until-clear verification loop
    - Canonical gate item is **Beginner hydroponics tub** (`11aa585c-fdeb-41ba-9191-be4bcdaa23c4`)
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Green Thumb Award ×1
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
    - `mix` → peroxide prep + baseline handoff — 5 gallon bucket of dechlorinated tap water ×1, hydrogen peroxide (3%) ×1, nitrile gloves (pair) ×1, safety goggles ×1, glass stir rod ×1
    - `mix`/`baseline` → scrub handoff — peroxide rinse bath ×1
    - `scrub`/`verify` → finish handoff — sanitized net cups ×1
- Recovery/troubleshooting branches:
    - `baseline`/`verify` route contamination back to `recover`, which loops to `mix` for a fresh cycle
- Safety/ops checks:
    - PPE required before peroxide handling
    - Electrical no-spray reminder during scrub pass
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Lettuce Seeds ×1
- Processes used:
    - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - [mix-peroxide-bath](/processes/mix-peroxide-bath)
    - [sanitize-net-cups](/processes/sanitize-net-cups)

## 23) Clean Net Cups (`hydroponics/netcup-clean`)

- Quest link: [/quests/hydroponics/netcup-clean](/quests/hydroponics/netcup-clean)
- Unlock prerequisite:
    - `requiresQuests`: `hydroponics/tub-scrub`
- Dialogue `requiresItems` gates:
    - `mix` → "Water and peroxide are staged for bath mixing." — 5 gallon bucket of dechlorinated tap water ×1, hydrogen peroxide (3%) ×1, nitrile gloves (pair) ×1, safety goggles ×1
    - `soak` → "Bath artifact confirmed; begin scrub cycle." — peroxide rinse bath ×1
    - `scrub` → "Sanitized-cup artifact captured." — sanitized net cups ×1
    - `dry` → "Dry-ready artifact verified; cups safe for next planting." — dried net cups ×1
- Recovery/troubleshooting branches:
    - `recover` discards contaminated bath/remixes solution and loops back to `mix` or `soak`
- Safety/ops checks:
    - PPE enforced before peroxide handling
    - Contamination and residual moisture paths require re-entry before completion
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Hydro Award ×1
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
