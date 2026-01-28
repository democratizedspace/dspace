---
title: 'Rockets'
slug: 'rockets'
---

DSPACE aims to make rocket building approachable. The current questline focuses on
hobbyist-grade model rockets with a realistic path to guided hops. It blends fabrication,
electronics, and safe launch operations.

## What you will practice

- **Airframe assembly**: body tubes, nosecones, fins, and parachute integration.
- **Propulsion safety**: motor handling, igniter checks, and launch controller use.
- **Guidance upgrades**: 3D printed fincans, servo integration, and Arduino control.
- **Range discipline**: checklists, countdown scripts, and recovery planning.

## Quest flow highlights

The rocketry quests begin with a first launch, parachute installs, and recovery runs.
Advanced quests add guidance hardware, night launches, fuel mixture calibration, and
telemetry capture. The goal is a guided hop that is repeatable and well documented.

## Inventory highlights

- Model rocket airframes, hobbyist solid motors, igniters, and launch controllers.
- 3D printed nosecones, body tubes, and fincans for guidance builds.
- Arduino-based avionics, micro servos, and onboard camera modules.
- Checklists, telemetry logs, and recovery packs for safe operations.

## Guided model rocket hop playbook

Before aiming for orbit, follow this realistic step beyond the parachute-only build. These
processes add servo steering and onboard video to a 3D printed rocket.

### Fabrication and bench testing

1. **Print guidance hardware** – Run `3dprint-guided-fincan` for the servo-ready fincan and
   `3dprint-guidance-sled` for the avionics tray so the servos and Arduino seat cleanly inside
   the body tube.
2. **Wire the avionics** – Use `assemble-guided-flight-stack` to mount the Arduino, route
   servo leads, and secure connectors. Harden the build with a dab of superglue before
   buttoning it up.
3. **Tune stability firmware** – Flash the sketch and exercise the servos with
   `calibrate-guided-flight-stack`. Stop when the fins hold attitude without chattering.
4. **Add a camera** – Install the keychain module with `install-rocket-camera` so you can
   capture the hop from the nosecone.

### Simulation and launch day

1. **Rehearse the profile** – Run `suborbital-hop` to simulate the flight and confirm guided
   hop telemetry stays within drift limits before leaving the shop.
2. **Set up the range** – At the field, execute `range-setup-guided-hop` to log rod angle
   checks, igniter continuity, servo wiggle tests, and camera arming.
3. **Call the countdown** – Follow `countdown-guided-hop` to keep everyone in sync right up
   to key turn.
4. **Launch and recover** – Trigger `launch-guided-hop` and bring home the guided flight log
   capsule for replay.
