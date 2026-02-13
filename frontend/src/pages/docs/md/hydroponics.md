---
title: 'Hydroponics'
slug: 'hydroponics'
---

This page documents the full **Hydroponics** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Grow basil hydroponically](/quests/hydroponics/basil) (`hydroponics/basil`)
2. [Bucket, we'll do it live!](/quests/hydroponics/bucket_10) (`hydroponics/bucket_10`)
3. [Install a Grow Light](/quests/hydroponics/grow-light) (`hydroponics/grow-light`)
4. [Grow Lettuce Hydroponically](/quests/hydroponics/lettuce) (`hydroponics/lettuce`)
5. [Refresh Nutrient Solution](/quests/hydroponics/nutrient-check) (`hydroponics/nutrient-check`)
6. [Check Solution pH](/quests/hydroponics/ph-check) (`hydroponics/ph-check`)
7. [Calibrate EC Meter](/quests/hydroponics/ec-calibrate) (`hydroponics/ec-calibrate`)
8. [Check Solution EC](/quests/hydroponics/ec-check) (`hydroponics/ec-check`)
9. [Test Hydroponic pH](/quests/hydroponics/ph-test) (`hydroponics/ph-test`)
10. [Refresh the Reservoir](/quests/hydroponics/reservoir-refresh) (`hydroponics/reservoir-refresh`)
11. [Install Submersible Pump](/quests/hydroponics/pump-install) (`hydroponics/pump-install`)
12. [Prime Water Pump](/quests/hydroponics/pump-prime) (`hydroponics/pump-prime`)
13. [Grow Stevia Hydroponically](/quests/hydroponics/stevia) (`hydroponics/stevia`)
14. [Regrow Your Stevia](/quests/hydroponics/regrow-stevia) (`hydroponics/regrow-stevia`)
15. [Check Water Temperature](/quests/hydroponics/temp-check) (`hydroponics/temp-check`)
16. [Top Off the Reservoir](/quests/hydroponics/top-off) (`hydroponics/top-off`)
17. [Rinse Grow Bed Filter](/quests/hydroponics/filter-clean) (`hydroponics/filter-clean`)
18. [Soak Air Stone](/quests/hydroponics/air-stone-soak) (`hydroponics/air-stone-soak`)
19. [Soak Starter Plugs](/quests/hydroponics/plug-soak) (`hydroponics/plug-soak`)
20. [Clone Mint Cutting](/quests/hydroponics/mint-cutting) (`hydroponics/mint-cutting`)
21. [Rinse the Roots](/quests/hydroponics/root-rinse) (`hydroponics/root-rinse`)
22. [Scrub the Grow Tub](/quests/hydroponics/tub-scrub) (`hydroponics/tub-scrub`)
23. [Clean Net Cups](/quests/hydroponics/netcup-clean) (`hydroponics/netcup-clean`)

## Quest details

### 1) Grow basil hydroponically (`hydroponics/basil`)
- Quest link: `/quests/hydroponics/basil`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `accept` / I've got the hydroponics tub, what's next?: Beginner hydroponics tub (`11aa585c-fdeb-41ba-9191-be4bcdaa23c4`) x1
  - Node `water` / Kind of weird that I didn't have one of those already.: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
  - Node `bucket` / Alright, I've completed the challenging task of filling a bucket with water. What's next?: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
  - Node `dechlorinate` / My water should be good to go now, right?: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - Node `fill` / I can add the seeds now, right?: soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x10
  - Node `germinate` / Alright, I can see a healthy batch of basil seedlings. Looks like it worked!: basil seedling (`5712947f-716c-4f71-b28d-fcb811631080`) x10
  - Node `transfer` / Ok, I've filled the tub with water and nutrients. What's next?: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
  - Node `lighting` / A month older and a month wiser. I've got a bunch of basil now! Is it time to harvest?: harvestable basil plant (`79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be`) x10
  - Node `harvest` / I've got these fresh bundles of basil! How do they look?: harvested basil plant (`29190faf-8581-4769-b871-f0ee283840e1`) x10
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `accept` / Ooh, fancy!: Beginner hydroponics tub (`11aa585c-fdeb-41ba-9191-be4bcdaa23c4`) x1
  - Node `water` / Let that sink in!: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
  - Node `transfer` / Nutrients, eh? I'll take 'em!: hydroponic nutrient concentrate (1 L) (`ef5a843f-0a9d-41e2-b2bc-81fc9f99a150`) x1
  - Node `lighting` / Cool grow lamp! This'll add a nice pink hue to my room.: hydroponic grow lamp (`c8946a5f-caff-4e6d-9b9b-4dbf02bcd000`) x1
- Quest-level `grantsItems`: None
- Rewards: Green Thumb Award (`5599c466-91e9-46fb-8d8b-11388e4f8f9c`) x1
- Processes used:
  - [`bucket-water-chlorinated`](/processes/bucket-water-chlorinated)
    - Requires: sink (`799ace33-1336-46c0-904a-9f16778230f1`) x1
    - Consumes: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1
    - Creates: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`germinate-basil`](/processes/germinate-basil)
    - Requires: hydroponic grow lamp (`c8946a5f-caff-4e6d-9b9b-4dbf02bcd000`) x1
    - Consumes: basil seeds (`affa2f80-28f1-422e-a0c8-49e51ce65a1e`) x10; soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x10
    - Creates: basil seedling (`5712947f-716c-4f71-b28d-fcb811631080`) x10
  - [`grow-basil`](/processes/grow-basil)
    - Requires: hydroponic grow lamp (`c8946a5f-caff-4e6d-9b9b-4dbf02bcd000`) x1
    - Consumes: basil seedling (`5712947f-716c-4f71-b28d-fcb811631080`) x10; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x24192
    - Creates: harvestable basil plant (`79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be`) x10; hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1
  - [`harvest-basil`](/processes/harvest-basil)
    - Requires: None
    - Consumes: harvestable basil plant (`79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be`) x10
    - Creates: bundle of basil leaves (`5d48cefb-fc1f-4962-b2c6-9b014151d0ae`) x10; harvested basil plant (`29190faf-8581-4769-b871-f0ee283840e1`) x10
  - [`prepare-hydroponic-tub`](/processes/prepare-hydroponic-tub)
    - Requires: None
    - Consumes: Beginner hydroponics tub (`11aa585c-fdeb-41ba-9191-be4bcdaa23c4`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydroponic nutrient concentrate (1 L) (`ef5a843f-0a9d-41e2-b2bc-81fc9f99a150`) x1
    - Creates: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
  - [`refresh-hydroponic-tub`](/processes/refresh-hydroponic-tub)
    - Requires: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; 50 mL measuring syringe (`f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62`) x1
    - Consumes: hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydroponic nutrient concentrate (1 L) (`ef5a843f-0a9d-41e2-b2bc-81fc9f99a150`) x0.1
    - Creates: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
  - [`regrow-basil`](/processes/regrow-basil)
    - Requires: None
    - Consumes: harvested basil plant (`29190faf-8581-4769-b871-f0ee283840e1`) x10; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x8064
    - Creates: harvestable basil plant (`79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be`) x10; hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1
  - [`rockwool-soak`](/processes/rockwool-soak)
    - Requires: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Consumes: hydroponic starter plug (`78a45c1f-a791-44f1-88f4-dc5059c66c89`) x10
    - Creates: soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x10

### 2) Bucket, we'll do it live! (`hydroponics/bucket_10`)
- Quest link: `/quests/hydroponics/bucket_10`
- Unlock prerequisite (`requiresQuests`): `hydroponics/basil`, `3dprinter/start`
- Dialogue `requiresItems` gates:
  - Node `haul` / I stacked ten buckets!: ten-bucket water haul (`86b5d874-a04e-426f-be77-0f7047789faf`) x1
  - Node `check` / Claim the Hydro Award: ten-bucket water haul (`86b5d874-a04e-426f-be77-0f7047789faf`) x1
  - Node `check` / Award in hand!: Hydro Award (`978ce094-f4fa-4b55-9e1a-2ea76531989d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`award-hydro-haul`](/processes/award-hydro-haul)
    - Requires: ten-bucket water haul (`86b5d874-a04e-426f-be77-0f7047789faf`) x1
    - Consumes: ten-bucket water haul (`86b5d874-a04e-426f-be77-0f7047789faf`) x1
    - Creates: Hydro Award (`978ce094-f4fa-4b55-9e1a-2ea76531989d`) x1
  - [`stage-ten-buckets`](/processes/stage-ten-buckets)
    - Requires: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x10
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x10
    - Creates: ten-bucket water haul (`86b5d874-a04e-426f-be77-0f7047789faf`) x1

### 3) Install a Grow Light (`hydroponics/grow-light`)
- Quest link: `/quests/hydroponics/grow-light`
- Unlock prerequisite (`requiresQuests`): `hydroponics/bucket_10`
- Dialogue `requiresItems` gates:
  - Node `install` / Light installed.: hydroponic grow lamp (`c8946a5f-caff-4e6d-9b9b-4dbf02bcd000`) x1; smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1; mechanical outlet timer (`8f7c2e83-285a-4b29-9a3a-312f0dce2745`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`smart-plug-schedule-12h`](/processes/smart-plug-schedule-12h)
    - Requires: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
    - Consumes: None
    - Creates: None

### 4) Grow Lettuce Hydroponically (`hydroponics/lettuce`)
- Quest link: `/quests/hydroponics/lettuce`
- Unlock prerequisite (`requiresQuests`): `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - Node `plant` / Seedlings look great!: Lettuce Seeds (`cfaa44c1-86b4-43ae-b15e-11e3ad75ba57`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Lettuce Seeds (`cfaa44c1-86b4-43ae-b15e-11e3ad75ba57`) x1
- Processes used:
  - None

### 5) Refresh Nutrient Solution (`hydroponics/nutrient-check`)
- Quest link: `/quests/hydroponics/nutrient-check`
- Unlock prerequisite (`requiresQuests`): `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - Node `add` / Mix and circulate.: hydroponic nutrient concentrate (1 L) (`ef5a843f-0a9d-41e2-b2bc-81fc9f99a150`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1; 50 mL measuring syringe (`f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62`) x1; pH test strip pack (`092dae11-237a-43cc-b342-246aabbba258`) x1
  - Node `add` / Check EC levels.: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
  - Node `add` / Reservoir topped off!: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-ec-solution`](/processes/measure-ec-solution)
    - Requires: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
    - Consumes: None
    - Creates: None
  - [`refresh-hydroponic-tub`](/processes/refresh-hydroponic-tub)
    - Requires: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; 50 mL measuring syringe (`f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62`) x1
    - Consumes: hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydroponic nutrient concentrate (1 L) (`ef5a843f-0a9d-41e2-b2bc-81fc9f99a150`) x0.1
    - Creates: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1

### 6) Check Solution pH (`hydroponics/ph-check`)
- Quest link: `/quests/hydroponics/ph-check`
- Unlock prerequisite (`requiresQuests`): `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - Node `measure` / Reading looks good: hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1
  - Node `log` / Logged and synced: hydroponic pH log (`cad7d051-e3fb-4f1c-9d72-358076ee732e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`adjust-ph`](/processes/adjust-ph)
    - Requires: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1; pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x1; pH up solution (potassium carbonate) (`9cdd41b1-392e-40c2-8072-0c1351b1a26b`) x1
    - Consumes: pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x0.05; pH up solution (potassium carbonate) (`9cdd41b1-392e-40c2-8072-0c1351b1a26b`) x0.05
    - Creates: None
  - [`log-stable-ph`](/processes/log-stable-ph)
    - Requires: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1
    - Consumes: hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1
    - Creates: hydroponic pH log (`cad7d051-e3fb-4f1c-9d72-358076ee732e`) x1
  - [`measure-ph`](/processes/measure-ph)
    - Requires: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; 100 mL graduated cylinder (`4d1a3894-e471-4483-8ae6-c6e12db1afae`) x1
    - Consumes: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
    - Creates: hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1

### 7) Calibrate EC Meter (`hydroponics/ec-calibrate`)
- Quest link: `/quests/hydroponics/ec-calibrate`
- Unlock prerequisite (`requiresQuests`): `hydroponics/ph-check`
- Dialogue `requiresItems` gates:
  - Node `calibrate` / Calibration complete: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; EC calibration solution (1000 ppm) (`d3d8bb59-8364-46b2-ad42-c5f56cc72b40`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`calibrate-ec-meter`](/processes/calibrate-ec-meter)
    - Requires: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; EC calibration solution (1000 ppm) (`d3d8bb59-8364-46b2-ad42-c5f56cc72b40`) x1
    - Consumes: EC calibration solution (1000 ppm) (`d3d8bb59-8364-46b2-ad42-c5f56cc72b40`) x1
    - Creates: None

### 8) Check Solution EC (`hydroponics/ec-check`)
- Quest link: `/quests/hydroponics/ec-check`
- Unlock prerequisite (`requiresQuests`): `hydroponics/ec-calibrate`
- Dialogue `requiresItems` gates:
  - Node `measure` / Meter reading looks good.: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-ec-solution`](/processes/measure-ec-solution)
    - Requires: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
    - Consumes: None
    - Creates: None

### 9) Test Hydroponic pH (`hydroponics/ph-test`)
- Quest link: `/quests/hydroponics/ph-test`
- Unlock prerequisite (`requiresQuests`): `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - Node `measure` / pH adjusted: digital pH meter (`6360b1e7-84d6-4256-b085-f36fc53ef299`) x1; pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-ph`](/processes/measure-ph)
    - Requires: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; 100 mL graduated cylinder (`4d1a3894-e471-4483-8ae6-c6e12db1afae`) x1
    - Consumes: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
    - Creates: hydroponic pH reading (`5456a6a5-5da9-46a0-aa4e-a74b6814404a`) x1

### 10) Refresh the Reservoir (`hydroponics/reservoir-refresh`)
- Quest link: `/quests/hydroponics/reservoir-refresh`
- Unlock prerequisite (`requiresQuests`): `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - Node `drain` / All filled up!: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`refresh-hydroponic-tub`](/processes/refresh-hydroponic-tub)
    - Requires: EC meter (`71655665-4a59-41f4-9084-dad4d976df91`) x1; 50 mL measuring syringe (`f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62`) x1
    - Consumes: hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydroponic nutrient concentrate (1 L) (`ef5a843f-0a9d-41e2-b2bc-81fc9f99a150`) x0.1
    - Creates: hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1

### 11) Install Submersible Pump (`hydroponics/pump-install`)
- Quest link: `/quests/hydroponics/pump-install`
- Unlock prerequisite (`requiresQuests`): `hydroponics/reservoir-refresh`
- Dialogue `requiresItems` gates:
  - Node `place` / Pump installed!: submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 12) Prime Water Pump (`hydroponics/pump-prime`)
- Quest link: `/quests/hydroponics/pump-prime`
- Unlock prerequisite (`requiresQuests`): `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
  - Node `prime` / Pump is primed: submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - `prime-pump` (process definition not found)

### 13) Grow Stevia Hydroponically (`hydroponics/stevia`)
- Quest link: `/quests/hydroponics/stevia`
- Unlock prerequisite (`requiresQuests`): `hydroponics/lettuce`
- Dialogue `requiresItems` gates:
  - Node `plant` / Seedlings look healthy!: stevia seedling (`9b440191-a8be-497c-8b5a-7bbac559413b`) x10
  - Node `grow` / They're full grown and smell sweet!: harvestable stevia plant (`ec5013d0-0701-4ba2-8fcf-7a5797c718b4`) x10
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`germinate-stevia`](/processes/germinate-stevia)
    - Requires: hydroponic grow lamp (`c8946a5f-caff-4e6d-9b9b-4dbf02bcd000`) x1
    - Consumes: stevia seeds (`6dbb283e-b5b3-476c-a6aa-f89b91d30604`) x10; soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x10
    - Creates: stevia seedling (`9b440191-a8be-497c-8b5a-7bbac559413b`) x10
  - [`grow-stevia`](/processes/grow-stevia)
    - Requires: hydroponic grow lamp (`c8946a5f-caff-4e6d-9b9b-4dbf02bcd000`) x1
    - Consumes: stevia seedling (`9b440191-a8be-497c-8b5a-7bbac559413b`) x6; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x16128
    - Creates: harvestable stevia plant (`ec5013d0-0701-4ba2-8fcf-7a5797c718b4`) x6; hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1
  - [`harvest-stevia`](/processes/harvest-stevia)
    - Requires: None
    - Consumes: harvestable stevia plant (`ec5013d0-0701-4ba2-8fcf-7a5797c718b4`) x1
    - Creates: bundle of stevia leaves (`c5d9469f-9e86-40c7-8b98-14b8b4ae91ae`) x10; harvested stevia plant (`b2248af9-151b-4268-989d-4bb408a6147c`) x1

### 14) Regrow Your Stevia (`hydroponics/regrow-stevia`)
- Quest link: `/quests/hydroponics/regrow-stevia`
- Unlock prerequisite (`requiresQuests`): `hydroponics/stevia`
- Dialogue `requiresItems` gates:
  - Node `regrow` / New leaves sprouting!: harvestable stevia plant (`ec5013d0-0701-4ba2-8fcf-7a5797c718b4`) x10
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`regrow-stevia`](/processes/regrow-stevia)
    - Requires: None
    - Consumes: harvested stevia plant (`b2248af9-151b-4268-989d-4bb408a6147c`) x10; hydroponics tub (ready) (`fc2bb989-f192-4891-8bde-78ae631dae78`) x1; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x8064
    - Creates: harvestable stevia plant (`ec5013d0-0701-4ba2-8fcf-7a5797c718b4`) x10; hydroponics tub (nutrient deficient) (`dc765172-c2e4-40dd-bb5a-a399bf6d6d77`) x1

### 15) Check Water Temperature (`hydroponics/temp-check`)
- Quest link: `/quests/hydroponics/temp-check`
- Unlock prerequisite (`requiresQuests`): `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - Node `measure` / Measure temperature: 7 pH freshwater aquarium (150 L) (`ca7c1069-4ba3-4339-9a10-0b690a690e60`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`check-aquarium-temperature`](/processes/check-aquarium-temperature)
    - Requires: 7 pH freshwater aquarium (150 L) (`ca7c1069-4ba3-4339-9a10-0b690a690e60`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
    - Consumes: None
    - Creates: None

### 16) Top Off the Reservoir (`hydroponics/top-off`)
- Quest link: `/quests/hydroponics/top-off`
- Unlock prerequisite (`requiresQuests`): `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
  - Node `fill` / Water added!: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1

### 17) Rinse Grow Bed Filter (`hydroponics/filter-clean`)
- Quest link: `/quests/hydroponics/filter-clean`
- Unlock prerequisite (`requiresQuests`): `hydroponics/top-off`
- Dialogue `requiresItems` gates:
  - Node `rinse` / Filter's all clean!: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 18) Soak Air Stone (`hydroponics/air-stone-soak`)
- Quest link: `/quests/hydroponics/air-stone-soak`
- Unlock prerequisite (`requiresQuests`): `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
  - Node `soak` / Stone is hydrated.: soaked air stone (`3b094479-ed97-46d6-8cab-ea91752972dd`) x1
  - Node `prime` / Bubbles are even: primed air stone (`bd887124-605d-4268-8a6c-684cb48de1a6`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`prime-air-stone`](/processes/prime-air-stone)
    - Requires: soaked air stone (`3b094479-ed97-46d6-8cab-ea91752972dd`) x1; aquarium air pump (`5d5e4e29-94b7-4a03-b73d-7420841ae686`) x1; Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1
    - Consumes: soaked air stone (`3b094479-ed97-46d6-8cab-ea91752972dd`) x1
    - Creates: primed air stone (`bd887124-605d-4268-8a6c-684cb48de1a6`) x1
  - [`soak-air-stone`](/processes/soak-air-stone)
    - Requires: porous air stone (`9f91173d-2609-4127-896d-7578078135db`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x0.5
    - Creates: soaked air stone (`3b094479-ed97-46d6-8cab-ea91752972dd`) x1

### 19) Soak Starter Plugs (`hydroponics/plug-soak`)
- Quest link: `/quests/hydroponics/plug-soak`
- Unlock prerequisite (`requiresQuests`): `hydroponics/top-off`
- Dialogue `requiresItems` gates:
  - Node `soak` / They're fully soaked!: soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x10
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`rockwool-soak`](/processes/rockwool-soak)
    - Requires: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Consumes: hydroponic starter plug (`78a45c1f-a791-44f1-88f4-dc5059c66c89`) x10
    - Creates: soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x10

### 20) Clone Mint Cutting (`hydroponics/mint-cutting`)
- Quest link: `/quests/hydroponics/mint-cutting`
- Unlock prerequisite (`requiresQuests`): `hydroponics/plug-soak`
- Dialogue `requiresItems` gates:
  - Node `prep` / Cut and plant: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x1
  - Node `prep` / Cutting is nestled in: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`clone-mint-cutting`](/processes/clone-mint-cutting)
    - Requires: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; soaked hydroponic starter plug (`545aeb15-7e8b-489d-be4a-af2a59f447e1`) x1
    - Consumes: None
    - Creates: None

### 21) Rinse the Roots (`hydroponics/root-rinse`)
- Quest link: `/quests/hydroponics/root-rinse`
- Unlock prerequisite (`requiresQuests`): `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
  - Node `water` / Water is ready: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - Node `rinse` / Flush the roots: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - Node `rinse` / Runoff is clear and roots look relieved.: rinsed hydroponic root zone (`15ff1896-7a19-4060-bfb3-77b62ec4fd5a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`flush-root-zone`](/processes/flush-root-zone)
    - Requires: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; Beginner hydroponics tub (`11aa585c-fdeb-41ba-9191-be4bcdaa23c4`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Creates: rinsed hydroponic root zone (`15ff1896-7a19-4060-bfb3-77b62ec4fd5a`) x1

### 22) Scrub the Grow Tub (`hydroponics/tub-scrub`)
- Quest link: `/quests/hydroponics/tub-scrub`
- Unlock prerequisite (`requiresQuests`): `hydroponics/reservoir-refresh`
- Dialogue `requiresItems` gates:
  - Node `scrub` / Walls are spotless!: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1

### 23) Clean Net Cups (`hydroponics/netcup-clean`)
- Quest link: `/quests/hydroponics/netcup-clean`
- Unlock prerequisite (`requiresQuests`): `hydroponics/tub-scrub`
- Dialogue `requiresItems` gates:
  - Node `mix` / Water is ready: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydrogen peroxide (3%) (`50f2080e-7dd5-4c8d-a764-dfaa02ca59c3`) x1
  - Node `soak` / Bath is mixed: peroxide rinse bath (`68e50400-fa25-4459-9633-2304a67096c9`) x1
  - Node `scrub` / Cups look clean: sanitized net cups (`6498967e-284e-46ff-bee7-10e3907f60fd`) x1
  - Node `dry` / Bone dry and ready: dried net cups (`d4a73557-e5a8-458a-80d9-6c1b46667428`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`dry-net-cups`](/processes/dry-net-cups)
    - Requires: sanitized net cups (`6498967e-284e-46ff-bee7-10e3907f60fd`) x1
    - Consumes: sanitized net cups (`6498967e-284e-46ff-bee7-10e3907f60fd`) x1
    - Creates: dried net cups (`d4a73557-e5a8-458a-80d9-6c1b46667428`) x1
  - [`mix-peroxide-bath`](/processes/mix-peroxide-bath)
    - Requires: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydrogen peroxide (3%) (`50f2080e-7dd5-4c8d-a764-dfaa02ca59c3`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; hydrogen peroxide (3%) (`50f2080e-7dd5-4c8d-a764-dfaa02ca59c3`) x0.02
    - Creates: peroxide rinse bath (`68e50400-fa25-4459-9633-2304a67096c9`) x1
  - [`sanitize-net-cups`](/processes/sanitize-net-cups)
    - Requires: peroxide rinse bath (`68e50400-fa25-4459-9633-2304a67096c9`) x1; Beginner hydroponics tub (`11aa585c-fdeb-41ba-9191-be4bcdaa23c4`) x1
    - Consumes: peroxide rinse bath (`68e50400-fa25-4459-9633-2304a67096c9`) x1
    - Creates: sanitized net cups (`6498967e-284e-46ff-bee7-10e3907f60fd`) x1

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
