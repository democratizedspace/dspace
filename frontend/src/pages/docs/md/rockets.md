---
title: 'Rockets'
slug: 'rockets'
---

DSPACE aims to make the creation and launches of rockets so easy that anyone can do it.

These quests focus on hobbyist-grade model rockets; commercial or
high-powered launches are out of scope.

You'll eventually be able to build a fully functioning virtual rocket and launch it into space. This will be a major milestone for the game, as everything leading up to that seems very loosely related. The first person to launch a rocket into orbit in DSPACE will be able to claim a unique title for their account.

The ultimate goal is to make the creation of a functioning orbital rocket achievable in the real-world, too! There's no fundamental reason why this shouldn't be possible, but it will require a lot of work. It will also require complying with ITAR, which will be a challenge. This is a long-term goal, and it will take many years, if not decades.

## Guided model rocket hop playbook

Before aiming for orbit, DSPACE now documents a realistic step beyond the
parachute-only build. Follow these quests and processes to add servo steering
and onboard video to your 3D printed rocket.

### Fabrication and bench testing

1. **Print guidance hardware** – Run `3dprint-guided-fincan` for the servo-ready
   fincan and `3dprint-guidance-sled` for the avionics tray so the servos and
   Arduino seat cleanly inside the body tube.
2. **Wire the avionics** – Use `assemble-guided-flight-stack` to mount the
   Arduino, route servo leads, and secure connectors. Harden the build with a
   dab of superglue before buttoning it up.
3. **Tune stability firmware** – Flash the sketch and exercise the servos with
   `calibrate-guided-flight-stack`. Stop when the fins hold attitude without
   chattering through the tilt test.
4. **Add a camera** – Install the keychain module with `install-rocket-camera`
   so you can capture the hop from the nosecone.

### Simulation and launch day

1. **Rehearse the profile** – Run `suborbital-hop` to simulate the flight and
   confirm guided hop telemetry stays within drift limits before leaving the
   shop.
2. **Set up the range** – At the field, execute `range-setup-guided-hop` to log
   rod angle checks, igniter continuity, servo wiggle tests, and camera arming.
3. **Call the countdown** – Follow `countdown-guided-hop` to keep everyone in
   sync right up to key turn.
4. **Launch and recover** – Trigger `launch-guided-hop` and bring home the
   guided flight log capsule for replay.
