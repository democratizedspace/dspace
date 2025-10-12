---
title: 'Rockets'
slug: 'rockets'
---

DSPACE aims to make the creation and launches of rockets so easy that anyone can do it.

These quests focus on hobbyist-grade model rockets; commercial or
high-powered launches are out of scope.

You'll eventually be able to build a fully functioning virtual rocket and launch it into space. This will be a major milestone for the game, as everything leading up to that seems very loosely related. The first person to launch a rocket into orbit in DSPACE will be able to claim a unique title for their account.

The ultimate goal is to make the creation of a functioning orbital rocket achievable in the real-world, too! There's no fundamental reason why this shouldn't be possible, but it will require a lot of work. It will also require complying with ITAR, which will be a challenge. This is a long-term goal, and it will take many years, if not decades.

## Guided model rocket upgrade plan

We're still years away from orbit, but DSPACE now ships the tooling to build a
servo-stabilized model rocket that improves on our parachute recoveries. Follow
this plan to print the right parts, wire the guidance controller, and launch with
confidence.

### Fabrication

1. **Print the new fincan** – Use `3dprint-servo-fincan-shell` to produce a
   fincan with servo pockets and control-horn slots. It consumes the same
   entry-level printer and PLA you used for the baseline rocket.
2. **Print a camera sled** – Run `3dprint-camera-sled` so the payload bay can
   capture onboard footage without rattling around during boost.

### Guidance electronics

-   **Install the servo hardware** – `assemble-servo-fincan` adds the micro servo
    and linkage kit to your printed fincan. Keep a spare tube of superglue handy
    for the control horn screws.
-   **Build the controller** – `assemble-guidance-controller` combines an Arduino
    Uno, the 9-axis IMU breakout, and jumper harness into a single prototype. Run
    `arduino-servo-sweep` afterward to confirm the firmware sweeps the servo cleanly.

### Airframe integration

1. **Stack the rocket** – `assemble-guided-rocket` walks through installing the
   guided fincan, parachute harness kit, action camera, and B6-4 motor into a
   single guided-airframe inventory item.
2. **Pack data storage** – The recipe installs a 64 GB microSD card so your
   footage and telemetry survive the landing.

### Field operations

-   **Pad checks** – Before arming, run `field-check-guided-rocket` to insert the
    igniter, verify launch controller continuity, and capture the range safety
    clearance item. The quest blocks launch without that clearance.
-   **Launch** – `launch-rocket-guided` performs the countdown and awards a
    `guided flight log` plus a `dLaunch` credit when everything returns safely.

Collecting the log unlocks the "Guided Model Flight" quest finale and earns a
replacement servo-actuated fincan so you can iterate on camera angles or servo
tuning without rebuilding every component from scratch.
