---
title: 'Rocketry'
slug: 'rocketry'
---

Rocketry quests cover the `rocketry` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [First rocket launch!](/quests/rocketry/firstlaunch)
2. [Fuel Mixture Calibration](/quests/rocketry/fuel-mixture)
3. [Add a parachute](/quests/rocketry/parachute)
4. [Preflight Checklist](/quests/rocketry/preflight-check)
5. [Practice Rocket Recovery](/quests/rocketry/recovery-run)
6. [Perform a Static Engine Test](/quests/rocketry/static-test)
7. [Build a Guided Model Rocket](/quests/rocketry/guided-rocket-build)
8. [Check the Launch Winds](/quests/rocketry/wind-check)
9. [Night Launch](/quests/rocketry/night-launch)
10. [Guided Model Rocket Hop](/quests/rocketry/suborbital-hop)

## 1) First rocket launch! (`rocketry/firstlaunch`)

- Quest link: `/quests/rocketry/firstlaunch`
- Unlock prerequisite: `requiresQuests`: ['3dprinter/start']
- Dialogue `requiresItems` gates:
    - `components` → “Alright, all 4 components are now printed! What's next?”: 3D printed nosecone ×1, 3D printed body tube ×1, 3D printed fincan ×1, 3D printed nosecone coupler ×1
    - `assemble` → “The rocket's assembled! Are we ready for launch?”: launch-capable model rocket ×1
    - `launch` → “We are go for launch!!! Right?”: launch controller ×1, rocket igniter ×1, Model rocket launchpad ×1
    - `go` → “Whoa! I can't believe I launched a rocket!! It didn't survive the landing, though, unfortunately.”: damaged model rocket ×1
- Grants:
    - `launch` → “Oh cool, I'll never turn down free stuff!”: launch controller ×1, rocket igniter ×1, Model rocket launchpad ×1
    - Quest-level `grantsItems`: None
- Rewards: Rocketeer Award ×1
- Processes used:
    - [`3dprint-rocket-body-tube`](/processes/3dprint-rocket-body-tube)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×18.48, dWatt ×266.67
        - Creates: entry-level FDM 3D printer ×1, 3D printed body tube ×1, dPrint ×18.48
    - [`3dprint-rocket-fincan`](/processes/3dprint-rocket-fincan)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×52.3, dWatt ×1006.70139
        - Creates: entry-level FDM 3D printer ×1, 3D printed fincan ×1, dPrint ×52.3
    - [`3dprint-rocket-nosecone`](/processes/3dprint-rocket-nosecone)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×13.9, dWatt ×223.4375
        - Creates: entry-level FDM 3D printer ×1, 3D printed nosecone ×1, dPrint ×13.9
    - [`3dprint-rocket-nosecone-coupler`](/processes/3dprint-rocket-nosecone-coupler)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×6.32, dWatt ×112.92
        - Creates: entry-level FDM 3D printer ×1, 3D printed nosecone coupler ×1, dPrint ×6.32
    - [`assemble-rocket`](/processes/assemble-rocket)
        - Requires: none
        - Consumes: 3D printed nosecone ×1, 3D printed body tube ×1, 3D printed fincan ×1, 3D printed nosecone coupler ×1, hobbyist solid rocket motor ×1, kevlar shock cord ×1, superglue ×0.1
        - Creates: launch-capable model rocket ×1
    - [`launch-rocket`](/processes/launch-rocket)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket ×1, rocket igniter ×1
        - Creates: damaged model rocket ×1, dLaunch ×1

## 2) Fuel Mixture Calibration (`rocketry/fuel-mixture`)

- Quest link: `/quests/rocketry/fuel-mixture`
- Unlock prerequisite: `requiresQuests`: ['rocketry/firstlaunch']
- Dialogue `requiresItems` gates:
    - `measure` → “Scale ready, mixture measured.”: parachute ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Rocketeer Award ×1
- Processes used:
    - None

## 3) Add a parachute (`rocketry/parachute`)

- Quest link: `/quests/rocketry/parachute`
- Unlock prerequisite: `requiresQuests`: ['rocketry/firstlaunch']
- Dialogue `requiresItems` gates:
    - `parachute` → “Let's assemble the parachute system!”: launch-capable model rocket ×1, parachute ×1, kevlar shock cord ×1, flame-resistant recovery wadding ×1, parachute harness kit ×1
    - `parachute` → “Great! Once the parachute system is ready, are we good to go for another launch?”: launch-capable model rocket (parachute) ×1
    - `launch` → “Congratulations on another successful launch! How did the rocket fare with the parachute?”: dLaunch ×2
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: rocket igniter ×10, hobbyist solid rocket motor ×5, Rocket Descent (animated) ×1
- Processes used:
    - [`assemble-rocket-parachute`](/processes/assemble-rocket-parachute)
        - Requires: none
        - Consumes: launch-capable model rocket ×1, parachute ×1, kevlar shock cord ×1, parachute harness kit ×1, flame-resistant recovery wadding ×1
        - Creates: launch-capable model rocket (parachute) ×1
    - [`launch-rocket-parachute`](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 4) Preflight Checklist (`rocketry/preflight-check`)

- Quest link: `/quests/rocketry/preflight-check`
- Unlock prerequisite: `requiresQuests`: ['rocketry/parachute']
- Dialogue `requiresItems` gates:
    - `supplies` → “All set, gear in hand.”: launch controller ×1, rocket igniter ×1, Model rocket launchpad ×1
    - `arm` → “Launch successful!”: damaged model rocket ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Rocketeer Award ×1
- Processes used:
    - [`launch-rocket`](/processes/launch-rocket)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket ×1, rocket igniter ×1
        - Creates: damaged model rocket ×1, dLaunch ×1

## 5) Practice Rocket Recovery (`rocketry/recovery-run`)

- Quest link: `/quests/rocketry/recovery-run`
- Unlock prerequisite: `requiresQuests`: ['rocketry/parachute']
- Dialogue `requiresItems` gates:
    - `prep` → “Parachute packed”: launch-capable model rocket (parachute) ×1, flame-resistant recovery wadding ×1
    - `launch` → “Rocket recovered!”: launch-capable model rocket (parachute) ×1, dLaunch ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`launch-rocket-parachute`](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 6) Perform a Static Engine Test (`rocketry/static-test`)

- Quest link: `/quests/rocketry/static-test`
- Unlock prerequisite: `requiresQuests`: ['rocketry/parachute']
- Dialogue `requiresItems` gates:
    - `burn` → “Data captured”: parachute ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 7) Build a Guided Model Rocket (`rocketry/guided-rocket-build`)

- Quest link: `/quests/rocketry/guided-rocket-build`
- Unlock prerequisite: `requiresQuests`: ['rocketry/firstlaunch', 'rocketry/parachute', 'rocketry/preflight-check']
- Dialogue `requiresItems` gates:
    - `print-fincan` → “Fincan cooled and off the bed.”: servo-ready fincan ×1
    - `print-sled` → “Sled fits cleanly into the fincan.”: servo-ready fincan ×1, avionics sled ×1
    - `assemble-stack` → “Servos move cleanly and wiring is tidy.”: guided flight stack ×1
    - `calibrate` → “Firmware passes the bench tilt test.”: guided flight stack ×1, stability firmware ×1
    - `camera` → “Camera wiring is tucked and hatch secured.”: nosecone camera module ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: guided flight stack ×1, nosecone camera module ×1
- Processes used:
    - [`3dprint-guidance-sled`](/processes/3dprint-guidance-sled)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×24.8, dWatt ×420
        - Creates: entry-level FDM 3D printer ×1, avionics sled ×1, dPrint ×24.8
    - [`3dprint-guided-fincan`](/processes/3dprint-guided-fincan)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×58.4, dWatt ×1125
        - Creates: entry-level FDM 3D printer ×1, servo-ready fincan ×1, dPrint ×58.4
    - [`assemble-guided-flight-stack`](/processes/assemble-guided-flight-stack)
        - Requires: none
        - Consumes: servo-ready fincan ×1, avionics sled ×1, Arduino Uno ×1, micro servo pair ×1, superglue ×0.2
        - Creates: guided flight stack ×1
    - [`calibrate-guided-flight-stack`](/processes/calibrate-guided-flight-stack)
        - Requires: none
        - Consumes: guided flight stack ×1
        - Creates: guided flight stack ×1, stability firmware ×1
    - [`install-rocket-camera`](/processes/install-rocket-camera)
        - Requires: guided flight stack ×1
        - Consumes: keychain camera kit ×1, superglue ×0.1
        - Creates: nosecone camera module ×1

## 8) Check the Launch Winds (`rocketry/wind-check`)

- Quest link: `/quests/rocketry/wind-check`
- Unlock prerequisite: `requiresQuests`: ['rocketry/preflight-check']
- Dialogue `requiresItems` gates:
    - `measure` → “Reading taken—winds are calm.”: 451d86d9-96e0-4829-af27-8a8b0be65ae4 ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: 15e3dd7e-374b-4233-b8c9-117e3057f009 ×1
- Processes used:
    - `measure-wind-speed` → `/processes/measure-wind-speed` (canonical data not found)

## 9) Night Launch (`rocketry/night-launch`)

- Quest link: `/quests/rocketry/night-launch`
- Unlock prerequisite: `requiresQuests`: ['rocketry/recovery-run']
- Dialogue `requiresItems` gates:
    - `prep` → “Gear's ready to go.”: Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, launch-capable model rocket (parachute) ×1
    - `launch` → “Rocket recovered!”: launch-capable model rocket (parachute) ×1, dLaunch ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Rocket Descent (animated) ×1
- Processes used:
    - [`launch-rocket-parachute`](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 10) Guided Model Rocket Hop (`rocketry/suborbital-hop`)

- Quest link: `/quests/rocketry/suborbital-hop`
- Unlock prerequisite: `requiresQuests`: ['rocketry/recovery-run', 'rocketry/preflight-check', 'rocketry/guided-rocket-build']
- Dialogue `requiresItems` gates:
    - `simulate` → “Simulator shows acceptable drift and apogee.”: guided hop telemetry ×1
    - `range` → “Gear staged at the pad.”: launch-capable model rocket (parachute) ×1, Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, flame-resistant recovery wadding ×1, guided flight stack ×1, stability firmware ×1, nosecone camera module ×1
    - `pad` → “Checklist complete and servos passed the wiggle test.”: guided launch pad checklist ×1
    - `countdown` → “Countdown finished at T-0 without holds.”: guided countdown card ×1
    - `launch` → “Rocket recovered with clean data capsule.”: guided flight log capsule ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: dLaunch ×2
- Processes used:
    - [`countdown-guided-hop`](/processes/countdown-guided-hop)
        - Requires: guided launch pad checklist ×1, launch controller ×1
        - Consumes: none
        - Creates: guided countdown card ×1
    - [`launch-guided-hop`](/processes/launch-guided-hop)
        - Requires: launch controller ×1, Model rocket launchpad ×1, guided flight stack ×1, stability firmware ×1, nosecone camera module ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1, guided countdown card ×1
        - Creates: launch-capable model rocket (parachute) ×1, guided flight stack ×1, nosecone camera module ×1, guided flight log capsule ×1, dLaunch ×1
    - [`range-setup-guided-hop`](/processes/range-setup-guided-hop)
        - Requires: Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, guided flight stack ×1, nosecone camera module ×1
        - Consumes: guided flight stack ×1
        - Creates: guided flight stack ×1, guided launch pad checklist ×1
    - [`suborbital-hop`](/processes/suborbital-hop)
        - Requires: guided flight stack ×1, stability firmware ×1
        - Consumes: none
        - Creates: guided hop telemetry ×1

## QA flow notes

- Cross-quest dependencies:
    - `rocketry/firstlaunch` unlocks after: 3dprinter/start
    - `rocketry/fuel-mixture` unlocks after: rocketry/firstlaunch
    - `rocketry/parachute` unlocks after: rocketry/firstlaunch
    - `rocketry/preflight-check` unlocks after: rocketry/parachute
    - `rocketry/recovery-run` unlocks after: rocketry/parachute
    - `rocketry/static-test` unlocks after: rocketry/parachute
    - `rocketry/guided-rocket-build` unlocks after: rocketry/firstlaunch, rocketry/parachute, rocketry/preflight-check
    - `rocketry/wind-check` unlocks after: rocketry/preflight-check
    - `rocketry/night-launch` unlocks after: rocketry/recovery-run
    - `rocketry/suborbital-hop` unlocks after: rocketry/recovery-run, rocketry/preflight-check, rocketry/guided-rocket-build
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `launch-rocket` is reused in 2 quests (rocketry/firstlaunch, rocketry/preflight-check)
    - Process `launch-rocket-parachute` is reused in 3 quests (rocketry/night-launch, rocketry/parachute, rocketry/recovery-run)
