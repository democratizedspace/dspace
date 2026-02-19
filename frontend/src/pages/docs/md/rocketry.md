---
title: 'Rocketry'
slug: 'rocketry'
---

Rocketry quests build practical progression through the rocketry skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [First rocket launch!](/quests/rocketry/firstlaunch)
2. [Fuel Mixture Calibration](/quests/rocketry/fuel-mixture)
3. [Add a parachute](/quests/rocketry/parachute)
4. [Preflight Checklist](/quests/rocketry/preflight-check)
5. [Build a Guided Model Rocket](/quests/rocketry/guided-rocket-build)
6. [Practice Rocket Recovery](/quests/rocketry/recovery-run)
7. [Night Launch](/quests/rocketry/night-launch)
8. [Perform a Static Engine Test](/quests/rocketry/static-test)
9. [Guided Model Rocket Hop](/quests/rocketry/suborbital-hop)
10. [Check the Launch Winds](/quests/rocketry/wind-check)

## 1) First rocket launch! (`rocketry/firstlaunch`)

- Quest link: [/quests/rocketry/firstlaunch](/quests/rocketry/firstlaunch)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinter/start`
- Structural notes:
    - Adds a non-linear early split: `paperwork` can route to `print-plan` (full build) or directly to `safety-brief` (already stocked path).
    - Adds troubleshooting loop: `safety-brief` can route to `troubleshoot` and return to safety verification before arming.
    - Adds post-launch recovery decision: `recovery` can either finish or route back through troubleshooting when damage is high.
- Dialogue `requiresItems` gates:
    - `print-plan` → "All four printed parts are complete." — 3D printed nosecone ×1, 3D printed body tube ×1, 3D printed fincan ×1, 3D printed nosecone coupler ×1
    - `assemble` → "Rocket assembled and inspected." — launch-capable model rocket ×1
    - `launch-gear` → "Pad, igniter, and controller are staged." — Model rocket launchpad ×1, rocket igniter ×1, launch controller ×1
    - `arm` → "Launch complete. Move to recovery review." — damaged model rocket ×1
- Grants:
    - `launch-gear` → "Thanks for the launch kit spares." — Model rocket launchpad ×1, rocket igniter ×3, launch controller ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used:
    - [3dprint-rocket-nosecone](/processes/3dprint-rocket-nosecone)
    - [3dprint-rocket-body-tube](/processes/3dprint-rocket-body-tube)
    - [3dprint-rocket-fincan](/processes/3dprint-rocket-fincan)
    - [3dprint-rocket-nosecone-coupler](/processes/3dprint-rocket-nosecone-coupler)
    - [assemble-rocket](/processes/assemble-rocket)
    - [launch-rocket](/processes/launch-rocket)

## 2) Fuel Mixture Calibration (`rocketry/fuel-mixture`)

- Quest link: [/quests/rocketry/fuel-mixture](/quests/rocketry/fuel-mixture)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
    - `measure` → "Scale ready, mixture measured." — parachute ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used: - Requires: TBD (known gap; process IO not yet specified) - Consumes: TBD (known gap; process IO not yet specified) - Creates: TBD (known gap; process IO not yet specified)

## 3) Add a parachute (`rocketry/parachute`)

- Quest link: [/quests/rocketry/parachute](/quests/rocketry/parachute)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
    - `parachute` → "Let's assemble the parachute system!" — launch-capable model rocket ×1, parachute ×1, kevlar shock cord ×1, flame-resistant recovery wadding ×1, parachute harness kit ×1
    - `parachute` → "Great! Once the parachute system is ready, are we good to go for another launch?" — launch-capable model rocket (parachute) ×1
    - `launch` → "Congratulations on another successful launch! How did the rocket fare with the parachute?" — dLaunch ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - rocket igniter ×10, hobbyist solid rocket motor ×5, Rocket Descent (animated) ×1
- Processes used:
    - [assemble-rocket-parachute](/processes/assemble-rocket-parachute)
        - Requires: none
        - Consumes: launch-capable model rocket ×1, parachute ×1, kevlar shock cord ×1, parachute harness kit ×1, flame-resistant recovery wadding ×1
        - Creates: launch-capable model rocket (parachute) ×1
    - [launch-rocket-parachute](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 4) Preflight Checklist (`rocketry/preflight-check`)

- Quest link: [/quests/rocketry/preflight-check](/quests/rocketry/preflight-check)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/parachute`
- Structural notes:
    - Measurement rubric hardening: adds `measure` evidence capture, `interpret` bounds check, and mandatory `retest` loop after corrective actions.
    - Safety stop logic is explicit: NO-GO when sustained wind > 8 m/s or gust spread > 3 m/s.
- Dialogue `requiresItems` gates:
    - `supplies` → "Gear staged. Proceed to measurement evidence." — Model rocket launchpad ×1, rocket igniter ×1, launch controller ×1
    - `measure` → "Measurement card captured. Interpret go/no-go." — placeholder reward item ×1
    - `interpret` → "GO: values are inside limits. Arm for launch." — placeholder reward item ×1
    - `retest` → "Re-test captured. Re-check go/no-go bounds." — placeholder reward item ×1
    - `arm` → "Launch complete with evidence captured." — damaged model rocket ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used:
    - [launch-rocket](/processes/launch-rocket)

## 5) Build a Guided Model Rocket (`rocketry/guided-rocket-build`)

- Quest link: [/quests/rocketry/guided-rocket-build](/quests/rocketry/guided-rocket-build)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/firstlaunch`, `rocketry/parachute`, `rocketry/preflight-check`
- Dialogue `requiresItems` gates:
    - `print-fincan` → "Fincan cooled and off the bed." — servo-ready fincan ×1
    - `print-sled` → "Sled fits cleanly into the fincan." — servo-ready fincan ×1, avionics sled ×1
    - `assemble-stack` → "Servos move cleanly and wiring is tidy." — guided flight stack ×1
    - `calibrate` → "Firmware passes the bench tilt test." — guided flight stack ×1, stability firmware ×1
    - `camera` → "Camera wiring is tucked and hatch secured." — nosecone camera module ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - guided flight stack ×1, nosecone camera module ×1
- Processes used:
    - [3dprint-guided-fincan](/processes/3dprint-guided-fincan)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×58.4, dWatt ×1125
        - Creates: entry-level FDM 3D printer ×1, servo-ready fincan ×1, dPrint ×58.4
    - [3dprint-guidance-sled](/processes/3dprint-guidance-sled)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×24.8, dWatt ×420
        - Creates: entry-level FDM 3D printer ×1, avionics sled ×1, dPrint ×24.8
    - [assemble-guided-flight-stack](/processes/assemble-guided-flight-stack)
        - Requires: none
        - Consumes: servo-ready fincan ×1, avionics sled ×1, Arduino Uno ×1, micro servo pair ×1, superglue ×0.2
        - Creates: guided flight stack ×1
    - [calibrate-guided-flight-stack](/processes/calibrate-guided-flight-stack)
        - Requires: none
        - Consumes: guided flight stack ×1
        - Creates: guided flight stack ×1, stability firmware ×1
    - [install-rocket-camera](/processes/install-rocket-camera)
        - Requires: guided flight stack ×1
        - Consumes: keychain camera kit ×1, superglue ×0.1
        - Creates: nosecone camera module ×1

## 6) Practice Rocket Recovery (`rocketry/recovery-run`)

- Quest link: [/quests/rocketry/recovery-run](/quests/rocketry/recovery-run)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/parachute`
- Dialogue `requiresItems` gates:
    - `prep` → "Parachute packed" — launch-capable model rocket (parachute) ×1, flame-resistant recovery wadding ×1
    - `launch` → "Rocket recovered!" — launch-capable model rocket (parachute) ×1, dLaunch ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [launch-rocket-parachute](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 7) Night Launch (`rocketry/night-launch`)

- Quest link: [/quests/rocketry/night-launch](/quests/rocketry/night-launch)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/recovery-run`
- Dialogue `requiresItems` gates:
    - `prep` → "Gear's ready to go." — Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, launch-capable model rocket (parachute) ×1
    - `launch` → "Rocket recovered!" — launch-capable model rocket (parachute) ×1, dLaunch ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocket Descent (animated) ×1
- Processes used:
    - [launch-rocket-parachute](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 8) Perform a Static Engine Test (`rocketry/static-test`)

- Quest link: [/quests/rocketry/static-test](/quests/rocketry/static-test)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/parachute`
- Structural notes:
    - Measurement rubric hardening: introduces explicit interpretation node with pass/fail logic before finish unlocks.
    - Adds corrective + mandatory re-test branch: `corrective` routes to `retest`, which loops back to `burn` for fresh evidence.
    - Safety stop conditions are called out up front for mount slip, side plume, and ignition delay.
- Dialogue `requiresItems` gates:
    - `burn` → "Thrust log captured. Move to interpretation." — static thrust log item ×1
    - `interpret` → "PASS: stable burn in expected range." — static thrust log item ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 9) Guided Model Rocket Hop (`rocketry/suborbital-hop`)

- Quest link: [/quests/rocketry/suborbital-hop](/quests/rocketry/suborbital-hop)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/recovery-run`, `rocketry/preflight-check`, `rocketry/guided-rocket-build`
- Dialogue `requiresItems` gates:
    - `simulate` → "Simulator shows acceptable drift and apogee." — guided hop telemetry ×1
    - `range` → "Gear staged at the pad." — launch-capable model rocket (parachute) ×1, Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, flame-resistant recovery wadding ×1, guided flight stack ×1, stability firmware ×1, nosecone camera module ×1
    - `pad` → "Checklist complete and servos passed the wiggle test." — guided launch pad checklist ×1
    - `countdown` → "Countdown finished at T-0 without holds." — guided countdown card ×1
    - `launch` → "Rocket recovered with clean data capsule." — guided flight log capsule ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dLaunch ×2
- Processes used:
    - [suborbital-hop](/processes/suborbital-hop)
        - Requires: guided flight stack ×1, stability firmware ×1
        - Consumes: none
        - Creates: guided hop telemetry ×1
    - [range-setup-guided-hop](/processes/range-setup-guided-hop)
        - Requires: Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, guided flight stack ×1, nosecone camera module ×1
        - Consumes: guided flight stack ×1
        - Creates: guided flight stack ×1, guided launch pad checklist ×1
    - [countdown-guided-hop](/processes/countdown-guided-hop)
        - Requires: guided launch pad checklist ×1, launch controller ×1
        - Consumes: none
        - Creates: guided countdown card ×1
    - [launch-guided-hop](/processes/launch-guided-hop)
        - Requires: launch controller ×1, Model rocket launchpad ×1, guided flight stack ×1, stability firmware ×1, nosecone camera module ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1, guided countdown card ×1
        - Creates: launch-capable model rocket (parachute) ×1, guided flight stack ×1, nosecone camera module ×1, guided flight log capsule ×1, dLaunch ×1

## 10) Check the Launch Winds (`rocketry/wind-check`)

- Quest link: [/quests/rocketry/wind-check](/quests/rocketry/wind-check)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/preflight-check`
- Structural notes:
    - Measurement rubric hardening: requires measurement artifact capture (`measure`) and interpretation (`interpret`) before finish.
    - Adds out-of-range corrective branch with required re-test loop (`corrective` -> `retest` -> `interpret`).
    - Safety stop conditions are explicit: sustained wind <= 8 m/s and gust spread <= 3 m/s to proceed.
- Dialogue `requiresItems` gates:
    - `measure` → "Wind card logged. Let's interpret the results." — placeholder reward item ×1
    - `interpret` → "PASS: both values are inside limits." — placeholder reward item ×1
    - `retest` → "Re-test recorded. Return to interpretation." — placeholder reward item ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - placeholder reward item (canonical ID: 15e3dd7e-374b-4233-b8c9-117e3057f009) ×1
- Processes used:

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
