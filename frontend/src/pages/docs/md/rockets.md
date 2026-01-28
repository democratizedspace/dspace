---
title: 'Rocketry'
slug: 'rockets'
---

DSPACE rocketry focuses on hobbyist-grade model rockets. The questline guides you from basic
preflight checks to guided model hops with onboard telemetry.

## What you learn

- How to assemble and test 3D-printed rocket hardware
- How to run safe launch procedures and recovery drills
- How to calibrate guidance systems before the first hop

## Quest trailheads

- [Build a Guided Model Rocket](/quests/rocketry/guided-rocket-build)
- [Preflight Checklist](/quests/rocketry/preflight-check)
- [Check the Launch Winds](/quests/rocketry/wind-check)
- [Perform a Static Engine Test](/quests/rocketry/static-test)
- [Guided Model Rocket Hop](/quests/rocketry/suborbital-hop)
- [Practice Rocket Recovery](/quests/rocketry/recovery-run)

## Guided model rocket hop playbook

### Fabrication and bench testing

1. **Print guidance hardware** – Run `3dprint-guided-fincan` for the servo-ready fincan and
   `3dprint-guidance-sled` for the avionics tray so the servos and controller seat cleanly.
2. **Wire the avionics** – Use `assemble-guided-flight-stack` to mount the controller, route servo
   leads, and secure connectors. Harden the build with a dab of adhesive before closing the tube.
3. **Tune stability firmware** – Flash the sketch and exercise the servos with
   `calibrate-guided-flight-stack`. Stop when the fins hold attitude without chattering.
4. **Add a camera** – Install the keychain module with `install-rocket-camera` to capture the hop.

### Simulation and launch day

1. **Rehearse the profile** – Run `suborbital-hop` to simulate the flight and confirm telemetry is
   inside drift limits before leaving the shop.
2. **Set up the range** – Execute `range-setup-guided-hop` to log rod angle checks, igniter
   continuity, servo wiggle tests, and camera arming.
3. **Call the countdown** – Follow `countdown-guided-hop` to keep everyone in sync.
4. **Launch and recover** – Trigger `launch-guided-hop` and bring home the guided flight log.

## Key gear

- 3D printed rocket body and guidance sled components
- Launch controller, safety key, and an open field for recovery
