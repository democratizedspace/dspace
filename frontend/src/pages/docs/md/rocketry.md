---
title: 'Rocketry'
slug: 'rocketry'
---

Rocketry quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [First rocket launch!](/quests/rocketry/firstlaunch) (`rocketry/firstlaunch`)
2. [Fuel Mixture Calibration](/quests/rocketry/fuel-mixture) (`rocketry/fuel-mixture`)
3. [Add a parachute](/quests/rocketry/parachute) (`rocketry/parachute`)
4. [Preflight Checklist](/quests/rocketry/preflight-check) (`rocketry/preflight-check`)
5. [Build a Guided Model Rocket](/quests/rocketry/guided-rocket-build) (`rocketry/guided-rocket-build`)
6. [Practice Rocket Recovery](/quests/rocketry/recovery-run) (`rocketry/recovery-run`)
7. [Night Launch](/quests/rocketry/night-launch) (`rocketry/night-launch`)
8. [Perform a Static Engine Test](/quests/rocketry/static-test) (`rocketry/static-test`)
9. [Guided Model Rocket Hop](/quests/rocketry/suborbital-hop) (`rocketry/suborbital-hop`)
10. [Check the Launch Winds](/quests/rocketry/wind-check) (`rocketry/wind-check`)

---

## 1) First rocket launch! (`rocketry/firstlaunch`)

- Quest link: [/quests/rocketry/firstlaunch](/quests/rocketry/firstlaunch)
- Unlock prerequisite:
  - `3dprinter/start`
- Dialogue `requiresItems` gates:
  - `components` → "Alright, all 4 components are now printed! What's next?"
    - 7ca9cad5-4bc2-420b-9733-24d1e38c2324 ×1
    - 1eac8955-bb70-474b-b6b0-4002ff3aa09a ×1
    - 563956c2-17d1-4b82-8fce-48b07dc8a71b ×1
    - 05c339ee-f50b-419a-804a-341f850b85e9 ×1
  - `assemble` → "The rocket's assembled! Are we ready for launch?"
    - aaa5fbca-54a1-40a5-8461-24dc2ef81d4d ×1
  - `launch` → "We are go for launch!!! Right?"
    - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
    - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
  - `go` → "Whoa! I can't believe I launched a rocket!! It didn't survive the landing, though, unfortunately."
    - 63362e5c-9897-4710-8ef6-26540fabd0ca ×1
- Grants:
  - Option/step `grantsItems`:
    - `launch` → "Oh cool, I'll never turn down free stuff!"
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - c754c1e7-244c-41ec-96d4-ad468b6b3e52 ×1
- Processes used:
  - [3dprint-rocket-body-tube](/processes/3dprint-rocket-body-tube)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×18.48
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×266.67
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 1eac8955-bb70-474b-b6b0-4002ff3aa09a ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×18.48
  - [3dprint-rocket-fincan](/processes/3dprint-rocket-fincan)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×52.3
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1006.70139
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 563956c2-17d1-4b82-8fce-48b07dc8a71b ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×52.3
  - [3dprint-rocket-nosecone](/processes/3dprint-rocket-nosecone)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×13.9
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×223.4375
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 7ca9cad5-4bc2-420b-9733-24d1e38c2324 ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×13.9
  - [3dprint-rocket-nosecone-coupler](/processes/3dprint-rocket-nosecone-coupler)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×6.32
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×112.92
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 05c339ee-f50b-419a-804a-341f850b85e9 ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×6.32
  - [assemble-rocket](/processes/assemble-rocket)
    - Requires:
      - None
    - Consumes:
      - 7ca9cad5-4bc2-420b-9733-24d1e38c2324 ×1
      - 1eac8955-bb70-474b-b6b0-4002ff3aa09a ×1
      - 563956c2-17d1-4b82-8fce-48b07dc8a71b ×1
      - 05c339ee-f50b-419a-804a-341f850b85e9 ×1
      - 4d817f1c-d78d-4fac-a514-402bce330693 ×1
      - 0484a3ab-92e7-42fa-a5e6-25a4afe841d6 ×1
      - 7bc8b73f-6e66-469d-865f-12d0cb36677a ×0.1
    - Creates:
      - aaa5fbca-54a1-40a5-8461-24dc2ef81d4d ×1
  - [launch-rocket](/processes/launch-rocket)
    - Requires:
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - 99c0472d-0d95-4030-a529-df3e8e8349f4 ×1
    - Consumes:
      - aaa5fbca-54a1-40a5-8461-24dc2ef81d4d ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - Creates:
      - 63362e5c-9897-4710-8ef6-26540fabd0ca ×1
      - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1

---

## 2) Fuel Mixture Calibration (`rocketry/fuel-mixture`)

- Quest link: [/quests/rocketry/fuel-mixture](/quests/rocketry/fuel-mixture)
- Unlock prerequisite:
  - `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
  - `measure` → "Scale ready, mixture measured."
    - 80a83ecc-bcd2-400e-a469-8488a6453bb8 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - c754c1e7-244c-41ec-96d4-ad468b6b3e52 ×1
- Processes used:
  - None

---

## 3) Add a parachute (`rocketry/parachute`)

- Quest link: [/quests/rocketry/parachute](/quests/rocketry/parachute)
- Unlock prerequisite:
  - `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
  - `parachute` → "Let's assemble the parachute system!"
    - aaa5fbca-54a1-40a5-8461-24dc2ef81d4d ×1
    - 80a83ecc-bcd2-400e-a469-8488a6453bb8 ×1
    - 0484a3ab-92e7-42fa-a5e6-25a4afe841d6 ×1
    - 9477a618-591b-45e0-9d81-18d60b848490 ×1
    - 84324403-0bd8-411a-b575-a3c966c8a73e ×1
  - `parachute` → "Great! Once the parachute system is ready, are we good to go for another launch?"
    - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
  - `launch` → "Congratulations on another successful launch! How did the rocket fare with the parachute?"
    - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d2f3e684-84e2-41f9-b39d-51ee224608ac ×10
  - 4d817f1c-d78d-4fac-a514-402bce330693 ×5
  - d660dc50-7afb-4a2f-9508-a42490aae5e4 ×1
- Processes used:
  - [assemble-rocket-parachute](/processes/assemble-rocket-parachute)
    - Requires:
      - None
    - Consumes:
      - aaa5fbca-54a1-40a5-8461-24dc2ef81d4d ×1
      - 80a83ecc-bcd2-400e-a469-8488a6453bb8 ×1
      - 0484a3ab-92e7-42fa-a5e6-25a4afe841d6 ×1
      - 84324403-0bd8-411a-b575-a3c966c8a73e ×1
      - 9477a618-591b-45e0-9d81-18d60b848490 ×1
    - Creates:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
  - [launch-rocket-parachute](/processes/launch-rocket-parachute)
    - Requires:
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - 99c0472d-0d95-4030-a529-df3e8e8349f4 ×1
    - Consumes:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - Creates:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1

---

## 4) Preflight Checklist (`rocketry/preflight-check`)

- Quest link: [/quests/rocketry/preflight-check](/quests/rocketry/preflight-check)
- Unlock prerequisite:
  - `rocketry/parachute`
- Dialogue `requiresItems` gates:
  - `supplies` → "All set, gear in hand."
    - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
    - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
  - `arm` → "Launch successful!"
    - 63362e5c-9897-4710-8ef6-26540fabd0ca ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - c754c1e7-244c-41ec-96d4-ad468b6b3e52 ×1
- Processes used:
  - [launch-rocket](/processes/launch-rocket)
    - Requires:
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - 99c0472d-0d95-4030-a529-df3e8e8349f4 ×1
    - Consumes:
      - aaa5fbca-54a1-40a5-8461-24dc2ef81d4d ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - Creates:
      - 63362e5c-9897-4710-8ef6-26540fabd0ca ×1
      - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1

---

## 5) Build a Guided Model Rocket (`rocketry/guided-rocket-build`)

- Quest link: [/quests/rocketry/guided-rocket-build](/quests/rocketry/guided-rocket-build)
- Unlock prerequisite:
  - `rocketry/firstlaunch`
  - `rocketry/parachute`
  - `rocketry/preflight-check`
- Dialogue `requiresItems` gates:
  - `print-fincan` → "Fincan cooled and off the bed."
    - 125eaa46-48f1-4cef-adaa-c200892af437 ×1
  - `print-sled` → "Sled fits cleanly into the fincan."
    - 125eaa46-48f1-4cef-adaa-c200892af437 ×1
    - 84a6f736-bff8-4aa5-a2ce-c913e795c9cf ×1
  - `assemble-stack` → "Servos move cleanly and wiring is tidy."
    - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
  - `calibrate` → "Firmware passes the bench tilt test."
    - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
    - e37831d8-76d4-4ffc-9e75-7d5bc601cf64 ×1
  - `camera` → "Camera wiring is tucked and hatch secured."
    - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
  - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1
- Processes used:
  - [3dprint-guidance-sled](/processes/3dprint-guidance-sled)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×24.8
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×420
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 84a6f736-bff8-4aa5-a2ce-c913e795c9cf ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×24.8
  - [3dprint-guided-fincan](/processes/3dprint-guided-fincan)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×58.4
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1125
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 125eaa46-48f1-4cef-adaa-c200892af437 ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×58.4
  - [assemble-guided-flight-stack](/processes/assemble-guided-flight-stack)
    - Requires:
      - None
    - Consumes:
      - 125eaa46-48f1-4cef-adaa-c200892af437 ×1
      - 84a6f736-bff8-4aa5-a2ce-c913e795c9cf ×1
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - dc5897f0-acec-4c3b-ad4d-535054e768f6 ×1
      - 7bc8b73f-6e66-469d-865f-12d0cb36677a ×0.2
    - Creates:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
  - [calibrate-guided-flight-stack](/processes/calibrate-guided-flight-stack)
    - Requires:
      - None
    - Consumes:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
    - Creates:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
      - e37831d8-76d4-4ffc-9e75-7d5bc601cf64 ×1
  - [install-rocket-camera](/processes/install-rocket-camera)
    - Requires:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
    - Consumes:
      - bdc905f5-c36f-4608-9c7f-da7b0988572f ×1
      - 7bc8b73f-6e66-469d-865f-12d0cb36677a ×0.1
    - Creates:
      - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1

---

## 6) Practice Rocket Recovery (`rocketry/recovery-run`)

- Quest link: [/quests/rocketry/recovery-run](/quests/rocketry/recovery-run)
- Unlock prerequisite:
  - `rocketry/parachute`
- Dialogue `requiresItems` gates:
  - `prep` → "Parachute packed"
    - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
    - 9477a618-591b-45e0-9d81-18d60b848490 ×1
  - `launch` → "Rocket recovered!"
    - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
    - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [launch-rocket-parachute](/processes/launch-rocket-parachute)
    - Requires:
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - 99c0472d-0d95-4030-a529-df3e8e8349f4 ×1
    - Consumes:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - Creates:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1

---

## 7) Night Launch (`rocketry/night-launch`)

- Quest link: [/quests/rocketry/night-launch](/quests/rocketry/night-launch)
- Unlock prerequisite:
  - `rocketry/recovery-run`
- Dialogue `requiresItems` gates:
  - `prep` → "Gear's ready to go."
    - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
    - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
    - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
  - `launch` → "Rocket recovered!"
    - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
    - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d660dc50-7afb-4a2f-9508-a42490aae5e4 ×1
- Processes used:
  - [launch-rocket-parachute](/processes/launch-rocket-parachute)
    - Requires:
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - 99c0472d-0d95-4030-a529-df3e8e8349f4 ×1
    - Consumes:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - Creates:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1

---

## 8) Perform a Static Engine Test (`rocketry/static-test`)

- Quest link: [/quests/rocketry/static-test](/quests/rocketry/static-test)
- Unlock prerequisite:
  - `rocketry/parachute`
- Dialogue `requiresItems` gates:
  - `burn` → "Data captured"
    - 80a83ecc-bcd2-400e-a469-8488a6453bb8 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 9) Guided Model Rocket Hop (`rocketry/suborbital-hop`)

- Quest link: [/quests/rocketry/suborbital-hop](/quests/rocketry/suborbital-hop)
- Unlock prerequisite:
  - `rocketry/recovery-run`
  - `rocketry/preflight-check`
  - `rocketry/guided-rocket-build`
- Dialogue `requiresItems` gates:
  - `simulate` → "Simulator shows acceptable drift and apogee."
    - 5873d7b0-dd0f-436f-b942-286aedd253d0 ×1
  - `range` → "Gear staged at the pad."
    - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
    - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
    - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
    - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
    - 9477a618-591b-45e0-9d81-18d60b848490 ×1
    - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
    - e37831d8-76d4-4ffc-9e75-7d5bc601cf64 ×1
    - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1
  - `pad` → "Checklist complete and servos passed the wiggle test."
    - daf6573f-804c-46e6-aa70-d9a41c8c81da ×1
  - `countdown` → "Countdown finished at T-0 without holds."
    - b9df8f38-83ed-4b0f-80be-3bfaf7228dbe ×1
  - `launch` → "Rocket recovered with clean data capsule."
    - 60a1e598-084e-4325-9c2c-fb5d95d19f41 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×2
- Processes used:
  - [countdown-guided-hop](/processes/countdown-guided-hop)
    - Requires:
      - daf6573f-804c-46e6-aa70-d9a41c8c81da ×1
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
    - Consumes:
      - None
    - Creates:
      - b9df8f38-83ed-4b0f-80be-3bfaf7228dbe ×1
  - [launch-guided-hop](/processes/launch-guided-hop)
    - Requires:
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
      - e37831d8-76d4-4ffc-9e75-7d5bc601cf64 ×1
      - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1
    - Consumes:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
      - b9df8f38-83ed-4b0f-80be-3bfaf7228dbe ×1
    - Creates:
      - e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec ×1
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
      - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1
      - 60a1e598-084e-4325-9c2c-fb5d95d19f41 ×1
      - eb9c2a75-a87a-4171-8bc3-088e75936bcf ×1
  - [range-setup-guided-hop](/processes/range-setup-guided-hop)
    - Requires:
      - 11d73d3c-aa22-450f-aef2-d6163e34e90d ×1
      - ae343640-c7c0-4f7e-907b-17bd87574d9b ×1
      - d2f3e684-84e2-41f9-b39d-51ee224608ac ×1
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
      - 246a8dca-ed43-490d-8b28-5ab4ab47a792 ×1
    - Consumes:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
    - Creates:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
      - daf6573f-804c-46e6-aa70-d9a41c8c81da ×1
  - [suborbital-hop](/processes/suborbital-hop)
    - Requires:
      - c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4 ×1
      - e37831d8-76d4-4ffc-9e75-7d5bc601cf64 ×1
    - Consumes:
      - None
    - Creates:
      - 5873d7b0-dd0f-436f-b942-286aedd253d0 ×1

---

## 10) Check the Launch Winds (`rocketry/wind-check`)

- Quest link: [/quests/rocketry/wind-check](/quests/rocketry/wind-check)
- Unlock prerequisite:
  - `rocketry/preflight-check`
- Dialogue `requiresItems` gates:
  - `measure` → "Reading taken—winds are calm."
    - 451d86d9-96e0-4829-af27-8a8b0be65ae4 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 15e3dd7e-374b-4233-b8c9-117e3057f009 ×1
- Processes used:
  - [measure-wind-speed](/processes/measure-wind-speed)
    - Requires: Unknown process id in canonical process list

---

## QA flow notes

- Cross-quest dependencies:
  - `rocketry/firstlaunch` depends on external quests: `3dprinter/start`.
- Progression integrity checks:
  - `rocketry/firstlaunch`: verify prerequisite completion and inventory gates.
  - `rocketry/fuel-mixture`: verify prerequisite completion and inventory gates.
  - `rocketry/parachute`: verify prerequisite completion and inventory gates (notable count gates: eb9c2a75-a87a-4171-8bc3-088e75936bcf ×2).
  - `rocketry/preflight-check`: verify prerequisite completion and inventory gates.
  - `rocketry/guided-rocket-build`: verify prerequisite completion and inventory gates.
  - `rocketry/recovery-run`: verify prerequisite completion and inventory gates.
  - `rocketry/night-launch`: verify prerequisite completion and inventory gates.
  - `rocketry/static-test`: verify prerequisite completion and inventory gates.
  - `rocketry/suborbital-hop`: verify prerequisite completion and inventory gates.
  - `rocketry/wind-check`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
