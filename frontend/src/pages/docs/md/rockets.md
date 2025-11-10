---
title: 'Rockets'
slug: 'rockets'
---

DSPACE aims to make the creation and launches of rockets so easy that anyone can do it.

These quests focus on hobbyist-grade model rockets; commercial or
high-powered launches are out of scope.

You can now build a fully functioning guided model rocket, complete with
servo steering and onboard video, and launch it through the in-game questline.
The playbook below covers everything from printing the hardware to rehearsing
the countdown so the hop succeeds on the first real attempt.

Orbit remains a long-term aspiration that will require significant iteration
and regulatory diligence. For now, the guided hop serves as the shipped
milestone while DSPACE researches what it would take to graduate to orbital
launches in the future.

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
