---
title: 'Rocketry'
slug: 'rocketry'
---

This page documents the full **Rocketry** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

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

## Quest details

### 1) First rocket launch! (`rocketry/firstlaunch`)
- Quest link: `/quests/rocketry/firstlaunch`
- Unlock prerequisite (`requiresQuests`): `3dprinter/start`
- Dialogue `requiresItems` gates:
  - Node `components` / Alright, all 4 components are now printed! What's next?: 3D printed nosecone (`7ca9cad5-4bc2-420b-9733-24d1e38c2324`) x1; 3D printed body tube (`1eac8955-bb70-474b-b6b0-4002ff3aa09a`) x1; 3D printed fincan (`563956c2-17d1-4b82-8fce-48b07dc8a71b`) x1; 3D printed nosecone coupler (`05c339ee-f50b-419a-804a-341f850b85e9`) x1
  - Node `assemble` / The rocket's assembled! Are we ready for launch?: launch-capable model rocket (`aaa5fbca-54a1-40a5-8461-24dc2ef81d4d`) x1
  - Node `launch` / We are go for launch!!! Right?: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1
  - Node `go` / Whoa! I can't believe I launched a rocket!! It didn't survive the landing, though, unfortunately.: damaged model rocket (`63362e5c-9897-4710-8ef6-26540fabd0ca`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `launch` / Oh cool, I'll never turn down free stuff!: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1
- Quest-level `grantsItems`: None
- Rewards: Rocketeer Award (`c754c1e7-244c-41ec-96d4-ad468b6b3e52`) x1
- Processes used:
  - [`3dprint-rocket-body-tube`](/processes/3dprint-rocket-body-tube)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x18.48; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x266.67
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; 3D printed body tube (`1eac8955-bb70-474b-b6b0-4002ff3aa09a`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x18.48
  - [`3dprint-rocket-fincan`](/processes/3dprint-rocket-fincan)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x52.3; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1006.70139
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; 3D printed fincan (`563956c2-17d1-4b82-8fce-48b07dc8a71b`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x52.3
  - [`3dprint-rocket-nosecone`](/processes/3dprint-rocket-nosecone)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x13.9; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x223.4375
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; 3D printed nosecone (`7ca9cad5-4bc2-420b-9733-24d1e38c2324`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x13.9
  - [`3dprint-rocket-nosecone-coupler`](/processes/3dprint-rocket-nosecone-coupler)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x6.32; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x112.92
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; 3D printed nosecone coupler (`05c339ee-f50b-419a-804a-341f850b85e9`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x6.32
  - [`assemble-rocket`](/processes/assemble-rocket)
    - Requires: None
    - Consumes: 3D printed nosecone (`7ca9cad5-4bc2-420b-9733-24d1e38c2324`) x1; 3D printed body tube (`1eac8955-bb70-474b-b6b0-4002ff3aa09a`) x1; 3D printed fincan (`563956c2-17d1-4b82-8fce-48b07dc8a71b`) x1; 3D printed nosecone coupler (`05c339ee-f50b-419a-804a-341f850b85e9`) x1; hobbyist solid rocket motor (`4d817f1c-d78d-4fac-a514-402bce330693`) x1; kevlar shock cord (`0484a3ab-92e7-42fa-a5e6-25a4afe841d6`) x1; superglue (`7bc8b73f-6e66-469d-865f-12d0cb36677a`) x0.1
    - Creates: launch-capable model rocket (`aaa5fbca-54a1-40a5-8461-24dc2ef81d4d`) x1
  - [`launch-rocket`](/processes/launch-rocket)
    - Requires: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; rocket launch checklist (`99c0472d-0d95-4030-a529-df3e8e8349f4`) x1
    - Consumes: launch-capable model rocket (`aaa5fbca-54a1-40a5-8461-24dc2ef81d4d`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1
    - Creates: damaged model rocket (`63362e5c-9897-4710-8ef6-26540fabd0ca`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1

### 2) Fuel Mixture Calibration (`rocketry/fuel-mixture`)
- Quest link: `/quests/rocketry/fuel-mixture`
- Unlock prerequisite (`requiresQuests`): `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
  - Node `measure` / Scale ready, mixture measured.: parachute (`80a83ecc-bcd2-400e-a469-8488a6453bb8`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Rocketeer Award (`c754c1e7-244c-41ec-96d4-ad468b6b3e52`) x1
- Processes used:
  - None

### 3) Add a parachute (`rocketry/parachute`)
- Quest link: `/quests/rocketry/parachute`
- Unlock prerequisite (`requiresQuests`): `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
  - Node `parachute` / Let's assemble the parachute system!: launch-capable model rocket (`aaa5fbca-54a1-40a5-8461-24dc2ef81d4d`) x1; parachute (`80a83ecc-bcd2-400e-a469-8488a6453bb8`) x1; kevlar shock cord (`0484a3ab-92e7-42fa-a5e6-25a4afe841d6`) x1; flame-resistant recovery wadding (`9477a618-591b-45e0-9d81-18d60b848490`) x1; parachute harness kit (`84324403-0bd8-411a-b575-a3c966c8a73e`) x1
  - Node `parachute` / Great! Once the parachute system is ready, are we good to go for another launch?: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1
  - Node `launch` / Congratulations on another successful launch! How did the rocket fare with the parachute?: dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x10; hobbyist solid rocket motor (`4d817f1c-d78d-4fac-a514-402bce330693`) x5; Rocket Descent (animated) (`d660dc50-7afb-4a2f-9508-a42490aae5e4`) x1
- Processes used:
  - [`assemble-rocket-parachute`](/processes/assemble-rocket-parachute)
    - Requires: None
    - Consumes: launch-capable model rocket (`aaa5fbca-54a1-40a5-8461-24dc2ef81d4d`) x1; parachute (`80a83ecc-bcd2-400e-a469-8488a6453bb8`) x1; kevlar shock cord (`0484a3ab-92e7-42fa-a5e6-25a4afe841d6`) x1; parachute harness kit (`84324403-0bd8-411a-b575-a3c966c8a73e`) x1; flame-resistant recovery wadding (`9477a618-591b-45e0-9d81-18d60b848490`) x1
    - Creates: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1
  - [`launch-rocket-parachute`](/processes/launch-rocket-parachute)
    - Requires: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; rocket launch checklist (`99c0472d-0d95-4030-a529-df3e8e8349f4`) x1
    - Consumes: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1
    - Creates: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1

### 4) Preflight Checklist (`rocketry/preflight-check`)
- Quest link: `/quests/rocketry/preflight-check`
- Unlock prerequisite (`requiresQuests`): `rocketry/parachute`
- Dialogue `requiresItems` gates:
  - Node `supplies` / All set, gear in hand.: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1
  - Node `arm` / Launch successful!: damaged model rocket (`63362e5c-9897-4710-8ef6-26540fabd0ca`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Rocketeer Award (`c754c1e7-244c-41ec-96d4-ad468b6b3e52`) x1
- Processes used:
  - [`launch-rocket`](/processes/launch-rocket)
    - Requires: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; rocket launch checklist (`99c0472d-0d95-4030-a529-df3e8e8349f4`) x1
    - Consumes: launch-capable model rocket (`aaa5fbca-54a1-40a5-8461-24dc2ef81d4d`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1
    - Creates: damaged model rocket (`63362e5c-9897-4710-8ef6-26540fabd0ca`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1

### 5) Build a Guided Model Rocket (`rocketry/guided-rocket-build`)
- Quest link: `/quests/rocketry/guided-rocket-build`
- Unlock prerequisite (`requiresQuests`): `rocketry/firstlaunch`, `rocketry/parachute`, `rocketry/preflight-check`
- Dialogue `requiresItems` gates:
  - Node `print-fincan` / Fincan cooled and off the bed.: servo-ready fincan (`125eaa46-48f1-4cef-adaa-c200892af437`) x1
  - Node `print-sled` / Sled fits cleanly into the fincan.: servo-ready fincan (`125eaa46-48f1-4cef-adaa-c200892af437`) x1; avionics sled (`84a6f736-bff8-4aa5-a2ce-c913e795c9cf`) x1
  - Node `assemble-stack` / Servos move cleanly and wiring is tidy.: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1
  - Node `calibrate` / Firmware passes the bench tilt test.: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; stability firmware (`e37831d8-76d4-4ffc-9e75-7d5bc601cf64`) x1
  - Node `camera` / Camera wiring is tucked and hatch secured.: nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1
- Processes used:
  - [`3dprint-guidance-sled`](/processes/3dprint-guidance-sled)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x24.8; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x420
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; avionics sled (`84a6f736-bff8-4aa5-a2ce-c913e795c9cf`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x24.8
  - [`3dprint-guided-fincan`](/processes/3dprint-guided-fincan)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x58.4; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1125
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; servo-ready fincan (`125eaa46-48f1-4cef-adaa-c200892af437`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x58.4
  - [`assemble-guided-flight-stack`](/processes/assemble-guided-flight-stack)
    - Requires: None
    - Consumes: servo-ready fincan (`125eaa46-48f1-4cef-adaa-c200892af437`) x1; avionics sled (`84a6f736-bff8-4aa5-a2ce-c913e795c9cf`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; micro servo pair (`dc5897f0-acec-4c3b-ad4d-535054e768f6`) x1; superglue (`7bc8b73f-6e66-469d-865f-12d0cb36677a`) x0.2
    - Creates: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1
  - [`calibrate-guided-flight-stack`](/processes/calibrate-guided-flight-stack)
    - Requires: None
    - Consumes: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1
    - Creates: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; stability firmware (`e37831d8-76d4-4ffc-9e75-7d5bc601cf64`) x1
  - [`install-rocket-camera`](/processes/install-rocket-camera)
    - Requires: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1
    - Consumes: keychain camera kit (`bdc905f5-c36f-4608-9c7f-da7b0988572f`) x1; superglue (`7bc8b73f-6e66-469d-865f-12d0cb36677a`) x0.1
    - Creates: nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1

### 6) Practice Rocket Recovery (`rocketry/recovery-run`)
- Quest link: `/quests/rocketry/recovery-run`
- Unlock prerequisite (`requiresQuests`): `rocketry/parachute`
- Dialogue `requiresItems` gates:
  - Node `prep` / Parachute packed: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; flame-resistant recovery wadding (`9477a618-591b-45e0-9d81-18d60b848490`) x1
  - Node `launch` / Rocket recovered!: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`launch-rocket-parachute`](/processes/launch-rocket-parachute)
    - Requires: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; rocket launch checklist (`99c0472d-0d95-4030-a529-df3e8e8349f4`) x1
    - Consumes: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1
    - Creates: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1

### 7) Night Launch (`rocketry/night-launch`)
- Quest link: `/quests/rocketry/night-launch`
- Unlock prerequisite (`requiresQuests`): `rocketry/recovery-run`
- Dialogue `requiresItems` gates:
  - Node `prep` / Gear's ready to go.: Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1
  - Node `launch` / Rocket recovered!: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Rocket Descent (animated) (`d660dc50-7afb-4a2f-9508-a42490aae5e4`) x1
- Processes used:
  - [`launch-rocket-parachute`](/processes/launch-rocket-parachute)
    - Requires: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; rocket launch checklist (`99c0472d-0d95-4030-a529-df3e8e8349f4`) x1
    - Consumes: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1
    - Creates: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1

### 8) Perform a Static Engine Test (`rocketry/static-test`)
- Quest link: `/quests/rocketry/static-test`
- Unlock prerequisite (`requiresQuests`): `rocketry/parachute`
- Dialogue `requiresItems` gates:
  - Node `burn` / Data captured: parachute (`80a83ecc-bcd2-400e-a469-8488a6453bb8`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 9) Guided Model Rocket Hop (`rocketry/suborbital-hop`)
- Quest link: `/quests/rocketry/suborbital-hop`
- Unlock prerequisite (`requiresQuests`): `rocketry/recovery-run`, `rocketry/preflight-check`, `rocketry/guided-rocket-build`
- Dialogue `requiresItems` gates:
  - Node `simulate` / Simulator shows acceptable drift and apogee.: guided hop telemetry (`5873d7b0-dd0f-436f-b942-286aedd253d0`) x1
  - Node `range` / Gear staged at the pad.: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; flame-resistant recovery wadding (`9477a618-591b-45e0-9d81-18d60b848490`) x1; guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; stability firmware (`e37831d8-76d4-4ffc-9e75-7d5bc601cf64`) x1; nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1
  - Node `pad` / Checklist complete and servos passed the wiggle test.: guided launch pad checklist (`daf6573f-804c-46e6-aa70-d9a41c8c81da`) x1
  - Node `countdown` / Countdown finished at T-0 without holds.: guided countdown card (`b9df8f38-83ed-4b0f-80be-3bfaf7228dbe`) x1
  - Node `launch` / Rocket recovered with clean data capsule.: guided flight log capsule (`60a1e598-084e-4325-9c2c-fb5d95d19f41`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x2
- Processes used:
  - [`countdown-guided-hop`](/processes/countdown-guided-hop)
    - Requires: guided launch pad checklist (`daf6573f-804c-46e6-aa70-d9a41c8c81da`) x1; launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1
    - Consumes: None
    - Creates: guided countdown card (`b9df8f38-83ed-4b0f-80be-3bfaf7228dbe`) x1
  - [`launch-guided-hop`](/processes/launch-guided-hop)
    - Requires: launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; stability firmware (`e37831d8-76d4-4ffc-9e75-7d5bc601cf64`) x1; nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1
    - Consumes: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; guided countdown card (`b9df8f38-83ed-4b0f-80be-3bfaf7228dbe`) x1
    - Creates: launch-capable model rocket (parachute) (`e9123658-fb2b-4fb2-bfc4-9eaeebddf3ec`) x1; guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1; guided flight log capsule (`60a1e598-084e-4325-9c2c-fb5d95d19f41`) x1; dLaunch (`eb9c2a75-a87a-4171-8bc3-088e75936bcf`) x1
  - [`range-setup-guided-hop`](/processes/range-setup-guided-hop)
    - Requires: Model rocket launchpad (`11d73d3c-aa22-450f-aef2-d6163e34e90d`) x1; launch controller (`ae343640-c7c0-4f7e-907b-17bd87574d9b`) x1; rocket igniter (`d2f3e684-84e2-41f9-b39d-51ee224608ac`) x1; guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; nosecone camera module (`246a8dca-ed43-490d-8b28-5ab4ab47a792`) x1
    - Consumes: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1
    - Creates: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; guided launch pad checklist (`daf6573f-804c-46e6-aa70-d9a41c8c81da`) x1
  - [`suborbital-hop`](/processes/suborbital-hop)
    - Requires: guided flight stack (`c9ff3c3f-2e0b-49ad-9b0b-d24f85e1fde4`) x1; stability firmware (`e37831d8-76d4-4ffc-9e75-7d5bc601cf64`) x1
    - Consumes: None
    - Creates: guided hop telemetry (`5873d7b0-dd0f-436f-b942-286aedd253d0`) x1

### 10) Check the Launch Winds (`rocketry/wind-check`)
- Quest link: `/quests/rocketry/wind-check`
- Unlock prerequisite (`requiresQuests`): `rocketry/preflight-check`
- Dialogue `requiresItems` gates:
  - Node `measure` / Reading taken—winds are calm.: `451d86d9-96e0-4829-af27-8a8b0be65ae4` x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: `15e3dd7e-374b-4233-b8c9-117e3057f009` x1
- Processes used:
  - `measure-wind-speed` (process definition not found)

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
