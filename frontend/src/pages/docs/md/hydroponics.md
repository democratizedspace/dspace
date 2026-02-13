---
title: 'Hydroponics'
slug: 'hydroponics'
---

Hydroponics quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Grow basil hydroponically (`hydroponics/basil`)

- Quest link: [/quests/hydroponics/basil](/quests/hydroponics/basil)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `accept` → "I've got the hydroponics tub, what's next?"
    - 11aa585c-fdeb-41ba-9191-be4bcdaa23c4 ×1
  - `water` → "Kind of weird that I didn't have one of those already."
    - 799ace33-1336-46c0-904a-9f16778230f1 ×1
  - `bucket` → "Alright, I've completed the challenging task of filling a bucket with water. What's next?"
    - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
  - `dechlorinate` → "My water should be good to go now, right?"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - `fill` → "I can add the seeds now, right?"
    - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10
  - `germinate` → "Alright, I can see a healthy batch of basil seedlings. Looks like it worked!"
    - 5712947f-716c-4f71-b28d-fcb811631080 ×10
  - `transfer` → "Ok, I've filled the tub with water and nutrients. What's next?"
    - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
  - `lighting` → "A month older and a month wiser. I've got a bunch of basil now! Is it time to harvest?"
    - 79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be ×10
  - `harvest` → "I've got these fresh bundles of basil! How do they look?"
    - 29190faf-8581-4769-b871-f0ee283840e1 ×10
- Grants:
  - Option/step `grantsItems`:
    - `accept` → "Ooh, fancy!"
      - 11aa585c-fdeb-41ba-9191-be4bcdaa23c4 ×1
    - `water` → "Let that sink in!"
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - `transfer` → "Nutrients, eh? I'll take 'em!"
      - ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 ×1
    - `lighting` → "Cool grow lamp! This'll add a nice pink hue to my room."
      - c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5599c466-91e9-46fb-8d8b-11388e4f8f9c ×1
- Processes used:
  - [bucket-water-chlorinated](/processes/bucket-water-chlorinated)
    - Requires:
      - 799ace33-1336-46c0-904a-9f16778230f1 ×1
    - Consumes:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
    - Creates:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [germinate-basil](/processes/germinate-basil)
    - Requires:
      - c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 ×1
    - Consumes:
      - affa2f80-28f1-422e-a0c8-49e51ce65a1e ×10
      - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10
    - Creates:
      - 5712947f-716c-4f71-b28d-fcb811631080 ×10
  - [grow-basil](/processes/grow-basil)
    - Requires:
      - c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 ×1
    - Consumes:
      - 5712947f-716c-4f71-b28d-fcb811631080 ×10
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×24192
    - Creates:
      - 79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be ×10
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1
  - [harvest-basil](/processes/harvest-basil)
    - Requires:
      - None
    - Consumes:
      - 79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be ×10
    - Creates:
      - 5d48cefb-fc1f-4962-b2c6-9b014151d0ae ×10
      - 29190faf-8581-4769-b871-f0ee283840e1 ×10
  - [prepare-hydroponic-tub](/processes/prepare-hydroponic-tub)
    - Requires:
      - None
    - Consumes:
      - 11aa585c-fdeb-41ba-9191-be4bcdaa23c4 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 ×1
    - Creates:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
  - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
    - Requires:
      - 71655665-4a59-41f4-9084-dad4d976df91 ×1
      - f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62 ×1
    - Consumes:
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 ×0.1
    - Creates:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
  - [regrow-basil](/processes/regrow-basil)
    - Requires:
      - None
    - Consumes:
      - 29190faf-8581-4769-b871-f0ee283840e1 ×10
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×8064
    - Creates:
      - 79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be ×10
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1
  - [rockwool-soak](/processes/rockwool-soak)
    - Requires:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Consumes:
      - 78a45c1f-a791-44f1-88f4-dc5059c66c89 ×10
    - Creates:
      - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10

---

## 2) Bucket, we'll do it live! (`hydroponics/bucket_10`)

- Quest link: [/quests/hydroponics/bucket_10](/quests/hydroponics/bucket_10)
- Unlock prerequisite:
  - `hydroponics/basil`
  - `3dprinter/start`
- Dialogue `requiresItems` gates:
  - `haul` → "I stacked ten buckets!"
    - 86b5d874-a04e-426f-be77-0f7047789faf ×1
  - `check` → "Claim the Hydro Award"
    - 86b5d874-a04e-426f-be77-0f7047789faf ×1
  - `check` → "Award in hand!"
    - 978ce094-f4fa-4b55-9e1a-2ea76531989d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [award-hydro-haul](/processes/award-hydro-haul)
    - Requires:
      - 86b5d874-a04e-426f-be77-0f7047789faf ×1
    - Consumes:
      - 86b5d874-a04e-426f-be77-0f7047789faf ×1
    - Creates:
      - 978ce094-f4fa-4b55-9e1a-2ea76531989d ×1
  - [stage-ten-buckets](/processes/stage-ten-buckets)
    - Requires:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×10
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×10
    - Creates:
      - 86b5d874-a04e-426f-be77-0f7047789faf ×1

---

## 3) Install a Grow Light (`hydroponics/grow-light`)

- Quest link: [/quests/hydroponics/grow-light](/quests/hydroponics/grow-light)
- Unlock prerequisite:
  - `hydroponics/bucket_10`
- Dialogue `requiresItems` gates:
  - `install` → "Light installed."
    - c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 ×1
    - a5395e29-1862-4eb7-8517-5d161635e032 ×1
    - 8f7c2e83-285a-4b29-9a3a-312f0dce2745 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 4) Grow Lettuce Hydroponically (`hydroponics/lettuce`)

- Quest link: [/quests/hydroponics/lettuce](/quests/hydroponics/lettuce)
- Unlock prerequisite:
  - `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - `plant` → "Seedlings look great!"
    - cfaa44c1-86b4-43ae-b15e-11e3ad75ba57 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - cfaa44c1-86b4-43ae-b15e-11e3ad75ba57 ×1
- Processes used:
  - None

---

## 5) Refresh Nutrient Solution (`hydroponics/nutrient-check`)

- Quest link: [/quests/hydroponics/nutrient-check](/quests/hydroponics/nutrient-check)
- Unlock prerequisite:
  - `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - `add` → "Mix and circulate."
    - ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
    - f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62 ×1
    - 092dae11-237a-43cc-b342-246aabbba258 ×1
  - `add` → "Check EC levels."
    - 71655665-4a59-41f4-9084-dad4d976df91 ×1
    - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
  - `add` → "Reservoir topped off!"
    - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [measure-ec-solution](/processes/measure-ec-solution)
    - Requires:
      - 71655665-4a59-41f4-9084-dad4d976df91 ×1
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
    - Requires:
      - 71655665-4a59-41f4-9084-dad4d976df91 ×1
      - f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62 ×1
    - Consumes:
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 ×0.1
    - Creates:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1

---

## 6) Check Solution pH (`hydroponics/ph-check`)

- Quest link: [/quests/hydroponics/ph-check](/quests/hydroponics/ph-check)
- Unlock prerequisite:
  - `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `measure` → "Reading looks good"
    - 5456a6a5-5da9-46a0-aa4e-a74b6814404a ×1
  - `log` → "Logged and synced"
    - cad7d051-e3fb-4f1c-9d72-358076ee732e ×1
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
  - [log-stable-ph](/processes/log-stable-ph)
    - Requires:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 5456a6a5-5da9-46a0-aa4e-a74b6814404a ×1
    - Consumes:
      - 5456a6a5-5da9-46a0-aa4e-a74b6814404a ×1
    - Creates:
      - cad7d051-e3fb-4f1c-9d72-358076ee732e ×1
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

## 7) Calibrate EC Meter (`hydroponics/ec-calibrate`)

- Quest link: [/quests/hydroponics/ec-calibrate](/quests/hydroponics/ec-calibrate)
- Unlock prerequisite:
  - `hydroponics/ph-check`
- Dialogue `requiresItems` gates:
  - `calibrate` → "Calibration complete"
    - 71655665-4a59-41f4-9084-dad4d976df91 ×1
    - d3d8bb59-8364-46b2-ad42-c5f56cc72b40 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [calibrate-ec-meter](/processes/calibrate-ec-meter)
    - Requires:
      - 71655665-4a59-41f4-9084-dad4d976df91 ×1
      - d3d8bb59-8364-46b2-ad42-c5f56cc72b40 ×1
    - Consumes:
      - d3d8bb59-8364-46b2-ad42-c5f56cc72b40 ×1
    - Creates:
      - None

---

## 8) Check Solution EC (`hydroponics/ec-check`)

- Quest link: [/quests/hydroponics/ec-check](/quests/hydroponics/ec-check)
- Unlock prerequisite:
  - `hydroponics/ec-calibrate`
- Dialogue `requiresItems` gates:
  - `measure` → "Meter reading looks good."
    - 71655665-4a59-41f4-9084-dad4d976df91 ×1
    - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [measure-ec-solution](/processes/measure-ec-solution)
    - Requires:
      - 71655665-4a59-41f4-9084-dad4d976df91 ×1
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 9) Test Hydroponic pH (`hydroponics/ph-test`)

- Quest link: [/quests/hydroponics/ph-test](/quests/hydroponics/ph-test)
- Unlock prerequisite:
  - `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `measure` → "pH adjusted"
    - 6360b1e7-84d6-4256-b085-f36fc53ef299 ×1
    - d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04 ×1
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

## 10) Refresh the Reservoir (`hydroponics/reservoir-refresh`)

- Quest link: [/quests/hydroponics/reservoir-refresh](/quests/hydroponics/reservoir-refresh)
- Unlock prerequisite:
  - `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `drain` → "All filled up!"
    - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [refresh-hydroponic-tub](/processes/refresh-hydroponic-tub)
    - Requires:
      - 71655665-4a59-41f4-9084-dad4d976df91 ×1
      - f1d1b5ad-ef3b-4ba7-9e69-4b8c97043d62 ×1
    - Consumes:
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - ef5a843f-0a9d-41e2-b2bc-81fc9f99a150 ×0.1
    - Creates:
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1

---

## 11) Install Submersible Pump (`hydroponics/pump-install`)

- Quest link: [/quests/hydroponics/pump-install](/quests/hydroponics/pump-install)
- Unlock prerequisite:
  - `hydroponics/reservoir-refresh`
- Dialogue `requiresItems` gates:
  - `place` → "Pump installed!"
    - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 12) Prime Water Pump (`hydroponics/pump-prime`)

- Quest link: [/quests/hydroponics/pump-prime](/quests/hydroponics/pump-prime)
- Unlock prerequisite:
  - `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
  - `prime` → "Pump is primed"
    - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [prime-pump](/processes/prime-pump)
    - Requires: Unknown process id in canonical process list

---

## 13) Grow Stevia Hydroponically (`hydroponics/stevia`)

- Quest link: [/quests/hydroponics/stevia](/quests/hydroponics/stevia)
- Unlock prerequisite:
  - `hydroponics/lettuce`
- Dialogue `requiresItems` gates:
  - `plant` → "Seedlings look healthy!"
    - 9b440191-a8be-497c-8b5a-7bbac559413b ×10
  - `grow` → "They're full grown and smell sweet!"
    - ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×10
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [germinate-stevia](/processes/germinate-stevia)
    - Requires:
      - c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 ×1
    - Consumes:
      - 6dbb283e-b5b3-476c-a6aa-f89b91d30604 ×10
      - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10
    - Creates:
      - 9b440191-a8be-497c-8b5a-7bbac559413b ×10
  - [grow-stevia](/processes/grow-stevia)
    - Requires:
      - c8946a5f-caff-4e6d-9b9b-4dbf02bcd000 ×1
    - Consumes:
      - 9b440191-a8be-497c-8b5a-7bbac559413b ×6
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×16128
    - Creates:
      - ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×6
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1
  - [harvest-stevia](/processes/harvest-stevia)
    - Requires:
      - None
    - Consumes:
      - ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×1
    - Creates:
      - c5d9469f-9e86-40c7-8b98-14b8b4ae91ae ×10
      - b2248af9-151b-4268-989d-4bb408a6147c ×1

---

## 14) Regrow Your Stevia (`hydroponics/regrow-stevia`)

- Quest link: [/quests/hydroponics/regrow-stevia](/quests/hydroponics/regrow-stevia)
- Unlock prerequisite:
  - `hydroponics/stevia`
- Dialogue `requiresItems` gates:
  - `regrow` → "New leaves sprouting!"
    - ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×10
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [regrow-stevia](/processes/regrow-stevia)
    - Requires:
      - None
    - Consumes:
      - b2248af9-151b-4268-989d-4bb408a6147c ×10
      - fc2bb989-f192-4891-8bde-78ae631dae78 ×1
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×8064
    - Creates:
      - ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×10
      - dc765172-c2e4-40dd-bb5a-a399bf6d6d77 ×1

---

## 15) Check Water Temperature (`hydroponics/temp-check`)

- Quest link: [/quests/hydroponics/temp-check](/quests/hydroponics/temp-check)
- Unlock prerequisite:
  - `hydroponics/nutrient-check`
- Dialogue `requiresItems` gates:
  - `measure` → "Measure temperature"
    - ca7c1069-4ba3-4339-9a10-0b690a690e60 ×1
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [check-aquarium-temperature](/processes/check-aquarium-temperature)
    - Requires:
      - ca7c1069-4ba3-4339-9a10-0b690a690e60 ×1
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 16) Top Off the Reservoir (`hydroponics/top-off`)

- Quest link: [/quests/hydroponics/top-off](/quests/hydroponics/top-off)
- Unlock prerequisite:
  - `hydroponics/pump-install`
- Dialogue `requiresItems` gates:
  - `fill` → "Water added!"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1

---

## 17) Rinse Grow Bed Filter (`hydroponics/filter-clean`)

- Quest link: [/quests/hydroponics/filter-clean](/quests/hydroponics/filter-clean)
- Unlock prerequisite:
  - `hydroponics/top-off`
- Dialogue `requiresItems` gates:
  - `rinse` → "Filter's all clean!"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 18) Soak Air Stone (`hydroponics/air-stone-soak`)

- Quest link: [/quests/hydroponics/air-stone-soak](/quests/hydroponics/air-stone-soak)
- Unlock prerequisite:
  - `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
  - `soak` → "Stone is hydrated."
    - 3b094479-ed97-46d6-8cab-ea91752972dd ×1
  - `prime` → "Bubbles are even"
    - bd887124-605d-4268-8a6c-684cb48de1a6 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [prime-air-stone](/processes/prime-air-stone)
    - Requires:
      - 3b094479-ed97-46d6-8cab-ea91752972dd ×1
      - 5d5e4e29-94b7-4a03-b73d-7420841ae686 ×1
      - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
    - Consumes:
      - 3b094479-ed97-46d6-8cab-ea91752972dd ×1
    - Creates:
      - bd887124-605d-4268-8a6c-684cb48de1a6 ×1
  - [soak-air-stone](/processes/soak-air-stone)
    - Requires:
      - 9f91173d-2609-4127-896d-7578078135db ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×0.5
    - Creates:
      - 3b094479-ed97-46d6-8cab-ea91752972dd ×1

---

## 19) Soak Starter Plugs (`hydroponics/plug-soak`)

- Quest link: [/quests/hydroponics/plug-soak](/quests/hydroponics/plug-soak)
- Unlock prerequisite:
  - `hydroponics/top-off`
- Dialogue `requiresItems` gates:
  - `soak` → "They're fully soaked!"
    - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [rockwool-soak](/processes/rockwool-soak)
    - Requires:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Consumes:
      - 78a45c1f-a791-44f1-88f4-dc5059c66c89 ×10
    - Creates:
      - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10

---

## 20) Clone Mint Cutting (`hydroponics/mint-cutting`)

- Quest link: [/quests/hydroponics/mint-cutting](/quests/hydroponics/mint-cutting)
- Unlock prerequisite:
  - `hydroponics/plug-soak`
- Dialogue `requiresItems` gates:
  - `prep` → "Cut and plant"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×1
  - `prep` → "Cutting is nestled in"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [clone-mint-cutting](/processes/clone-mint-cutting)
    - Requires:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 21) Rinse the Roots (`hydroponics/root-rinse`)

- Quest link: [/quests/hydroponics/root-rinse](/quests/hydroponics/root-rinse)
- Unlock prerequisite:
  - `hydroponics/filter-clean`
- Dialogue `requiresItems` gates:
  - `water` → "Water is ready"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - `rinse` → "Flush the roots"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - `rinse` → "Runoff is clear and roots look relieved."
    - 15ff1896-7a19-4060-bfb3-77b62ec4fd5a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [flush-root-zone](/processes/flush-root-zone)
    - Requires:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 11aa585c-fdeb-41ba-9191-be4bcdaa23c4 ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Creates:
      - 15ff1896-7a19-4060-bfb3-77b62ec4fd5a ×1

---

## 22) Scrub the Grow Tub (`hydroponics/tub-scrub`)

- Quest link: [/quests/hydroponics/tub-scrub](/quests/hydroponics/tub-scrub)
- Unlock prerequisite:
  - `hydroponics/reservoir-refresh`
- Dialogue `requiresItems` gates:
  - `scrub` → "Walls are spotless!"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1

---

## 23) Clean Net Cups (`hydroponics/netcup-clean`)

- Quest link: [/quests/hydroponics/netcup-clean](/quests/hydroponics/netcup-clean)
- Unlock prerequisite:
  - `hydroponics/tub-scrub`
- Dialogue `requiresItems` gates:
  - `mix` → "Water is ready"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - 50f2080e-7dd5-4c8d-a764-dfaa02ca59c3 ×1
  - `soak` → "Bath is mixed"
    - 68e50400-fa25-4459-9633-2304a67096c9 ×1
  - `scrub` → "Cups look clean"
    - 6498967e-284e-46ff-bee7-10e3907f60fd ×1
  - `dry` → "Bone dry and ready"
    - d4a73557-e5a8-458a-80d9-6c1b46667428 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [dry-net-cups](/processes/dry-net-cups)
    - Requires:
      - 6498967e-284e-46ff-bee7-10e3907f60fd ×1
    - Consumes:
      - 6498967e-284e-46ff-bee7-10e3907f60fd ×1
    - Creates:
      - d4a73557-e5a8-458a-80d9-6c1b46667428 ×1
  - [mix-peroxide-bath](/processes/mix-peroxide-bath)
    - Requires:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 50f2080e-7dd5-4c8d-a764-dfaa02ca59c3 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - c46e98b4-0c1a-478b-988c-8c9260dce434 ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 50f2080e-7dd5-4c8d-a764-dfaa02ca59c3 ×0.02
    - Creates:
      - 68e50400-fa25-4459-9633-2304a67096c9 ×1
  - [sanitize-net-cups](/processes/sanitize-net-cups)
    - Requires:
      - 68e50400-fa25-4459-9633-2304a67096c9 ×1
      - 11aa585c-fdeb-41ba-9191-be4bcdaa23c4 ×1
    - Consumes:
      - 68e50400-fa25-4459-9633-2304a67096c9 ×1
    - Creates:
      - 6498967e-284e-46ff-bee7-10e3907f60fd ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `hydroponics/basil` depends on external quests: `welcome/howtodoquests`.
  - `hydroponics/bucket_10` depends on external quests: `3dprinter/start`.
- Progression integrity checks:
  - `hydroponics/basil`: verify prerequisite completion and inventory gates (notable count gates: 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10, 5712947f-716c-4f71-b28d-fcb811631080 ×10, 79f1ea64-c58f-4f7a-8e7e-8dcca24fd1be ×10, 29190faf-8581-4769-b871-f0ee283840e1 ×10).
  - `hydroponics/bucket_10`: verify prerequisite completion and inventory gates.
  - `hydroponics/grow-light`: verify prerequisite completion and inventory gates.
  - `hydroponics/lettuce`: verify prerequisite completion and inventory gates.
  - `hydroponics/nutrient-check`: verify prerequisite completion and inventory gates.
  - `hydroponics/ph-check`: verify prerequisite completion and inventory gates.
  - `hydroponics/ec-calibrate`: verify prerequisite completion and inventory gates.
  - `hydroponics/ec-check`: verify prerequisite completion and inventory gates.
  - `hydroponics/ph-test`: verify prerequisite completion and inventory gates.
  - `hydroponics/reservoir-refresh`: verify prerequisite completion and inventory gates.
  - `hydroponics/pump-install`: verify prerequisite completion and inventory gates.
  - `hydroponics/pump-prime`: verify prerequisite completion and inventory gates.
  - `hydroponics/stevia`: verify prerequisite completion and inventory gates (notable count gates: 9b440191-a8be-497c-8b5a-7bbac559413b ×10, ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×10).
  - `hydroponics/regrow-stevia`: verify prerequisite completion and inventory gates (notable count gates: ec5013d0-0701-4ba2-8fcf-7a5797c718b4 ×10).
  - `hydroponics/temp-check`: verify prerequisite completion and inventory gates.
  - `hydroponics/top-off`: verify prerequisite completion and inventory gates.
  - `hydroponics/filter-clean`: verify prerequisite completion and inventory gates.
  - `hydroponics/air-stone-soak`: verify prerequisite completion and inventory gates.
  - `hydroponics/plug-soak`: verify prerequisite completion and inventory gates (notable count gates: 545aeb15-7e8b-489d-be4a-af2a59f447e1 ×10).
  - `hydroponics/mint-cutting`: verify prerequisite completion and inventory gates.
  - `hydroponics/root-rinse`: verify prerequisite completion and inventory gates.
  - `hydroponics/tub-scrub`: verify prerequisite completion and inventory gates.
  - `hydroponics/netcup-clean`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
