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
- Dialogue `requiresItems` gates:
    - `components` → "Alright, all 4 components are now printed! What's next?" — 3D printed nosecone ×1, 3D printed body tube ×1, 3D printed fincan ×1, 3D printed nosecone coupler ×1
    - `assemble` → "The rocket's assembled! Are we ready for launch?" — launch-capable model rocket ×1
    - `launch` → "Kit is staged. Run the range safety checklist." — launch controller ×1, rocket igniter ×1, Model rocket launchpad ×1
    - `go` → "Launch successful and recovery complete." — damaged model rocket ×1
- Troubleshooting/safety branches:
    - `range-safety` and `range-hold` enforce go/no-go stop conditions (weather, exclusion zone, recovery path) with mandatory re-checks.
    - `troubleshoot-ignition` adds an abort-and-recover route that returns through safety gating before retry.
- Grants:
    - `launch` → "Thanks for the spare launch kit." — launch controller ×1, rocket igniter ×1, Model rocket launchpad ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used:
    - [3dprint-rocket-nosecone](/processes/3dprint-rocket-nosecone)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×13.9, dWatt ×223.4375
        - Creates: entry-level FDM 3D printer ×1, 3D printed nosecone ×1, dPrint ×13.9
    - [3dprint-rocket-body-tube](/processes/3dprint-rocket-body-tube)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×18.48, dWatt ×266.67
        - Creates: entry-level FDM 3D printer ×1, 3D printed body tube ×1, dPrint ×18.48
    - [3dprint-rocket-fincan](/processes/3dprint-rocket-fincan)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×52.3, dWatt ×1006.70139
        - Creates: entry-level FDM 3D printer ×1, 3D printed fincan ×1, dPrint ×52.3
    - [3dprint-rocket-nosecone-coupler](/processes/3dprint-rocket-nosecone-coupler)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×6.32, dWatt ×112.92
        - Creates: entry-level FDM 3D printer ×1, 3D printed nosecone coupler ×1, dPrint ×6.32
    - [assemble-rocket](/processes/assemble-rocket)
        - Requires: none
        - Consumes: 3D printed nosecone ×1, 3D printed body tube ×1, 3D printed fincan ×1, 3D printed nosecone coupler ×1, hobbyist solid rocket motor ×1, kevlar shock cord ×1, superglue ×0.1
        - Creates: launch-capable model rocket ×1
    - [launch-rocket](/processes/launch-rocket)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket ×1, rocket igniter ×1
        - Creates: damaged model rocket ×1, dLaunch ×1

## 2) Fuel Mixture Calibration (`rocketry/fuel-mixture`)

- Quest link: [/quests/rocketry/fuel-mixture](/quests/rocketry/fuel-mixture)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
    - `measure` → "Scale ready, mixture measured to the first ratio target." — parachute ×1
    - `verify-ratio` → "Ratio verified in tolerance and test hardware is staged." — launch-capable model rocket (parachute) ×1
- Troubleshooting/safety branches:
    - `safety-brief` and `safety-reset` add an explicit bench/PPE/ventilation hold before measurement.
    - `verify-ratio` and `correction` enforce out-of-band correction with a mandatory re-measure loop.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used:
    - [run-static-engine-test](/processes/run-static-engine-test)
        - Requires: launch-capable model rocket (parachute) ×1
        - Consumes: None
        - Creates: 4d5d0f2e-77e7-44c2-a0d7-ef0f9f8a9b2d ×1 ("static engine thrust log")

## 3) Add a parachute (`rocketry/parachute`)

- Quest link: [/quests/rocketry/parachute](/quests/rocketry/parachute)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/firstlaunch`
- Dialogue `requiresItems` gates:
    - `inventory-check` → "All parts staged and motor removed." — launch-capable model rocket ×1, parachute ×1, kevlar shock cord ×1, flame-resistant recovery wadding ×1, parachute harness kit ×1
    - `install` → "Install complete. Verify continuity and packing." — launch-capable model rocket (parachute) ×1
    - `launch` → "Flight complete. Assess recovery outcome." — dLaunch ×2
- Troubleshooting/safety branches:
    - `verify-install` and `assess` force explicit pass/fail checks with a `troubleshoot-install` rework loop.
    - `safety-brief` and `hold` enforce a no-ignite range safety hold before launch is allowed.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
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
- Dialogue `requiresItems` gates:
    - `supplies` → "All core gear is staged." — launch controller ×1, rocket igniter ×1, Model rocket launchpad ×1, rocket launch checklist ×1
    - `wind-evidence` → "Both readings are documented. Time to interpret." — wind log ×1
    - `arm` → "Launch complete and post-flight check passed." — damaged model rocket ×1
- Troubleshooting/safety branches:
    - `range-walk` and `scrub` paths can halt unsafe range conditions before arming.
    - `troubleshoot` enforces corrective actions and a mandatory re-test loop through `wind-readings`.
- Grants:
    - Dialogue options/steps grantsItems:
        - `wind-readings` → "Record both readings in the pad log." grants wind log ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - rocket igniter ×10, hobbyist solid rocket motor ×5, Rocket Descent (animated) ×1
- Processes used:
    - [launch-rocket](/processes/launch-rocket)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket ×1, rocket igniter ×1
        - Creates: damaged model rocket ×1, dLaunch ×1

## 5) Build a Guided Model Rocket (`rocketry/guided-rocket-build`)

- Quest link: [/quests/rocketry/guided-rocket-build](/quests/rocketry/guided-rocket-build)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/firstlaunch`, `rocketry/parachute`, `rocketry/preflight-check`
- Dialogue `requiresItems` gates:
    - `print-fincan`/`print-fincan-quality` → fincan completion confirmations — servo-ready fincan ×1
    - `print-sled` → "Sled fits cleanly into the fincan." — servo-ready fincan ×1, avionics sled ×1
    - `assemble-stack` → "Servos move cleanly and wiring is tidy." — guided flight stack ×1
    - `calibrate` → firmware stability confirmation — guided flight stack ×1, stability firmware ×1
    - `camera` → "Camera wiring is tucked and hatch secured." — nosecone camera module ×1
- Troubleshooting/safety branches:
    - `print-plan` provides non-linear print strategy branches (fast vs quality profile).
    - `print-recovery` handles warp/adhesion failures before resuming the build path.
    - `assemble-safety` + `bench-troubleshoot` add anti-static and servo diagnostic loops before closure.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
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
    - `prep` → "Recovery stack prepped and motor is still out." — launch-capable model rocket (parachute) ×1, flame-resistant recovery wadding ×1
    - `launch` → "Rocket recovered. Begin post-flight inspection." — launch-capable model rocket (parachute) ×1, dLaunch ×1
    - `inspect` → "Inspection passed. Rocket is reusable for next iteration." — launch-capable model rocket (parachute) ×1
- Troubleshooting/safety branches:
    - `range-check` + `hold` add an operational hold loop before launch when perimeter/abort setup is unsafe.
    - `launch` and `inspect` can route into `troubleshoot` for repack and re-run before completion.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - rocket igniter ×10, hobbyist solid rocket motor ×5, Rocket Descent (animated) ×1
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
    - `prep` → "Gear's ready and double-checked for night ops." — Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, launch-capable model rocket (parachute) ×1
    - `launch` → "Flight complete. Move to post-flight recovery checks." — launch-capable model rocket (parachute) ×1, dLaunch ×1
    - `recovery-check` → "Rocket recovered with safe descent and clear visual tracking." — launch-capable model rocket (parachute) ×1, dLaunch ×1
- Troubleshooting/safety branches:
    - `range-safety` and `hold` enforce visibility/perimeter checks and a no-go hold before launch.
    - `misfire` handles failed ignition/unsafe trajectory and loops back through full restaging.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used:
    - [launch-rocket-parachute](/processes/launch-rocket-parachute)
        - Requires: launch controller ×1, Model rocket launchpad ×1, rocket launch checklist ×1
        - Consumes: launch-capable model rocket (parachute) ×1, rocket igniter ×1
        - Creates: launch-capable model rocket (parachute) ×1, dLaunch ×1

## 8) Perform a Static Engine Test (`rocketry/static-test`)

- Quest link: [/quests/rocketry/static-test](/quests/rocketry/static-test)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/parachute`
- Dialogue `requiresItems` gates:
    - `burn` → "Use the captured thrust log to continue analysis." — 4d5d0f2e-77e7-44c2-a0d7-ef0f9f8a9b2d ×1 ("static engine thrust log")
- Troubleshooting/safety branches:
    - `setup` and `safety-hold` add explicit abort/resume handling for unsafe static-test conditions.
    - `interpret` enforces pass/fail bounds and routes out-of-range outcomes into `corrective` re-test loops.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - rocket igniter ×10, hobbyist solid rocket motor ×5, Rocket Descent (animated) ×1
- Processes used:
    - [run-static-engine-test](/processes/run-static-engine-test)
        - Requires: launch-capable model rocket (parachute) ×1
        - Consumes: None
        - Creates: 4d5d0f2e-77e7-44c2-a0d7-ef0f9f8a9b2d ×1 ("static engine thrust log")

## 9) Guided Model Rocket Hop (`rocketry/suborbital-hop`)

- Quest link: [/quests/rocketry/suborbital-hop](/quests/rocketry/suborbital-hop)
- Unlock prerequisite:
    - `requiresQuests`: `rocketry/recovery-run`, `rocketry/preflight-check`, `rocketry/guided-rocket-build`
- Dialogue `requiresItems` gates:
    - `simulate` → "Simulator run complete. Review drift and apogee against bounds." — guided hop telemetry ×1
    - `simulate-recheck` → "Fresh telemetry logged. Re-review drift and apogee bounds." — guided hop telemetry ×2
    - `range` → "Gear staged at the pad." — launch-capable model rocket (parachute) ×1, Model rocket launchpad ×1, launch controller ×1, rocket igniter ×1, flame-resistant recovery wadding ×1, guided flight stack ×1, stability firmware ×1, nosecone camera module ×1
    - `pad` → "Checklist complete and servos passed the wiggle test." — guided launch pad checklist ×1
    - `countdown` → "Countdown finished at T-0 without holds." — guided countdown card ×1
    - `launch` → "Rocket recovered with clean data capsule." — guided flight log capsule ×1
    - `recovery-review` → "Logs are complete and within expected envelope." — guided flight log capsule ×1
- Troubleshooting/safety branches:
    - `sim-review` and `sim-tune` enforce drift/apogee thresholds with a mandatory tuning loop before range travel.
    - `range-safety` and `range-hold` add explicit no-go handling for perimeter/comms failures.
    - `anomaly` routes recovery through `simulate-recheck`, which enforces a fresh simulator run before returning to bounds review.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - guided flight stack ×1, nosecone camera module ×1
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
- Dialogue `requiresItems` gates:
    - `reading-one` → "Reading #1 logged. Capture the second sample now." — wind log ×1
    - `reading-two` → "Reading #2 logged and trend noted." — wind log ×1
    - `retest-window` → "Retest stayed stable. Launch conditions verified." — wind log ×1
- Troubleshooting/safety branches:
    - `setup` + `safety-hold` add a mandatory pad/perimeter safety hold before taking readings.
    - `interpret`, `corrective`, and `scrub` enforce out-of-range handling with retest and explicit no-launch outcomes.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Rocketeer Award ×1
- Processes used:
    - [run-static-engine-test](/processes/run-static-engine-test)
        - Requires: launch-capable model rocket (parachute) ×1
        - Consumes: None
        - Creates: 4d5d0f2e-77e7-44c2-a0d7-ef0f9f8a9b2d ×1 ("static engine thrust log")

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
