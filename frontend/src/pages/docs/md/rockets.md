---
title: 'Rockets'
slug: 'rockets'
---

DSPACE aims to make the creation and launches of rockets so easy that anyone can do it. The
quests focus on hobbyist-grade model rockets; commercial or high-powered launches are out of
scope for now.

You can now build a guided model rocket, complete with servo steering and onboard video, and
launch it through the in-game questline. Orbit remains a long-term aspiration that will require
significant iteration and regulatory diligence. For now, the guided hop is the shipped milestone.

## Quest path highlights

- First launches: [First launch](/quests/rocketry/firstlaunch),
  [Preflight check](/quests/rocketry/preflight-check),
  [Static test](/quests/rocketry/static-test)
- Recovery skills: [Parachute build](/quests/rocketry/parachute),
  [Recovery run](/quests/rocketry/recovery-run)
- Guided hop: [Guided rocket build](/quests/rocketry/guided-rocket-build),
  [Wind check](/quests/rocketry/wind-check)

## Inventory and tools to expect

Rocketry inventory supports both basic and guided builds:

- Launch controllers, igniters, and safety keys
- Servo-ready fincans and micro servos for guidance
- Logbooks and checklists for repeatable launches

## Guided model rocket hop playbook

Before aiming for orbit, DSPACE documents a realistic step beyond the parachute-only build.
Follow these quests and processes to add servo steering and onboard video to your 3D printed
rocket.

### Fabrication and bench testing

1. **Print guidance hardware** – Run `3dprint-guided-fincan` for the servo-ready
   fincan and `3dprint-guidance-sled` for the avionics tray so the servos and Arduino
   seat cleanly inside the body tube.
2. **Wire the avionics** – Use `assemble-guided-flight-stack` to mount the Arduino,
   route servo leads, and secure connectors. Harden the build with a dab of superglue
   before buttoning it up.
3. **Tune stability firmware** – Flash the sketch and exercise the servos with
   `calibrate-guided-flight-stack`. Stop when the fins hold attitude without
   chattering through the tilt test.
4. **Add a camera** – Install the keychain module with `install-rocket-camera`
   so you can capture the hop from the nosecone.

### Simulation and launch day

1. **Rehearse the profile** – Run `suborbital-hop` to simulate the flight and
   confirm guided hop telemetry stays within drift limits before leaving the shop.
2. **Set up the range** – At the field, execute `range-setup-guided-hop` to log
   rod angle checks, igniter continuity, servo wiggle tests, and camera arming.
3. **Call the countdown** – Follow `countdown-guided-hop` to keep everyone in sync
   right up to key turn.
4. **Launch and recover** – Trigger `launch-guided-hop` and bring home the guided
   flight log capsule for replay.
