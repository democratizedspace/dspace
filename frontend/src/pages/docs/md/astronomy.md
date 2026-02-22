---
title: 'Astronomy'
slug: 'astronomy'
---

Astronomy quests build practical progression through the astronomy skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Observe the Moon](/quests/astronomy/observe-moon)
2. [Assemble a Simple Telescope](/quests/astronomy/basic-telescope)
3. [Locate the Andromeda Galaxy](/quests/astronomy/andromeda)
4. [Spot the ISS](/quests/astronomy/iss-flyover)
5. [Photograph the ISS](/quests/astronomy/iss-photo)
6. [Track Jupiter's Moons](/quests/astronomy/jupiter-moons)
7. [Map the Constellations](/quests/astronomy/constellations)
8. [Split a Binary Star](/quests/astronomy/binary-star)
9. [Measure Light Pollution](/quests/astronomy/light-pollution)
10. [Watch the Aurora](/quests/astronomy/aurora-watch)
11. [Photograph a Lunar Eclipse](/quests/astronomy/lunar-eclipse)
12. [Document a Meteor Shower](/quests/astronomy/meteor-shower)
13. [Track a Visiting Comet](/quests/astronomy/comet-tracking)
14. [Locate the North Star](/quests/astronomy/north-star)
15. [Observe the Orion Nebula](/quests/astronomy/orion-nebula)
16. [Planetary Alignment](/quests/astronomy/planetary-alignment)
17. [Track a Satellite Pass](/quests/astronomy/satellite-pass)
18. [Spot Saturn's Rings](/quests/astronomy/saturn-rings)
19. [Capture Star Trails](/quests/astronomy/star-trails)
20. [Sketch Sunspots](/quests/astronomy/sunspot-sketch)
21. [Observe Venus's Phases](/quests/astronomy/venus-phases)

## 1) Observe the Moon (`astronomy/observe-moon`)

- Quest link: [/quests/astronomy/observe-moon](/quests/astronomy/observe-moon)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `record` → "Sketch completed" — basic telescope ×1, mission logbook ×1, feather quill ×1, bottle of black ink ×1, red flashlight ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 2) Assemble a Simple Telescope (`astronomy/basic-telescope`)

- Quest link: [/quests/astronomy/basic-telescope](/quests/astronomy/basic-telescope)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
    - `start` → "I'm ready." — 50 mm magnifying lens ×1, 20 mm magnifying lens ×1, cardboard mailing tube ×1, camera tripod ×1, masking tape ×1
    - `build`/`alternate-build` → "Assembly complete; verify image quality." / "Staged build done; start verification." — basic telescope ×1
    - `verify` → "Verified: stable tripod and clear moon points." — basic telescope ×1
- Troubleshooting and safety flow:
    - `build` now branches into a direct assembly path and an alternate staged pre-mount path before verification.
    - `verify` routes to `troubleshoot` on blurry/drifting optics, then loops back to rebuild or re-verify with explicit stop criteria for chipped/loose glass.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [assemble-basic-telescope](/processes/assemble-basic-telescope)
        - Requires: 50 mm magnifying lens ×1, 20 mm magnifying lens ×1, cardboard mailing tube ×1, camera tripod ×1, masking tape ×1
        - Consumes: none
        - Creates: basic telescope ×1

## 3) Locate the Andromeda Galaxy (`astronomy/andromeda`)

- Quest link: [/quests/astronomy/andromeda](/quests/astronomy/andromeda)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
    - `start` → "Gear ready." — planisphere star chart ×1, red flashlight ×1
    - `align` → "Alignment notes are in my log." — constellation sketch set ×1, basic telescope ×1
- Troubleshooting and safety flow:
    - `interpret` branches to `recover` when the target cannot be stably re-acquired.
    - `recover` loops back through alignment and includes explicit stop conditions for unsafe footing and poor sky conditions.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 4) Spot the ISS (`astronomy/iss-flyover`)

- Quest link: [/quests/astronomy/iss-flyover](/quests/astronomy/iss-flyover)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
    - `plan` → "Details logged. How do I stage the scope?" — ISS pass window ×1
    - `weather-delay` → "Sky is clear enough now; proceed to setup." — ISS pass window ×1
    - `setup` → "Station is ready for the pass." — ISS spotting station ×1
    - `observe` → "Entry complete with time and direction." — ISS pass log ×1
    - `interpret` → "Log has all three fields and conditions notes." — ISS pass log ×1
- Troubleshooting and safety flow:
    - `plan`, `setup`, and `observe` all branch to `weather-delay` for cloud/haze/glare recovery instead of allowing a dead-end session.
    - `interpret` enforces a complete observation artifact (time + direction + duration) and routes incomplete entries back through setup so the pass can be restaged and re-observed.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - ISS pass log ×1
- Processes used:
    - [check-iss-pass](/processes/check-iss-pass)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass window ×1
    - [stage-iss-spotting-station](/processes/stage-iss-spotting-station)
        - Requires: ISS pass window ×1, basic telescope ×1, camera tripod ×1, red flashlight ×1
        - Consumes: none
        - Creates: ISS spotting station ×1
    - [log-iss-pass](/processes/log-iss-pass)
        - Requires: ISS spotting station ×1, ISS pass window ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass log ×1

## 5) Photograph the ISS (`astronomy/iss-photo`)

- Quest link: [/quests/astronomy/iss-photo](/quests/astronomy/iss-photo)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/iss-flyover`
- Dialogue `requiresItems` gates:
    - `plan` → "Pass time noted, gear set." — smartphone ×1, camera tripod ×1
    - `capture` → "Photo saved and logged." — mission logbook ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [check-iss-pass](/processes/check-iss-pass)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass window ×1

## 6) Track Jupiter's Moons (`astronomy/jupiter-moons`)

- Quest link: [/quests/astronomy/jupiter-moons](/quests/astronomy/jupiter-moons)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
    - `observe` → "Week complete." — basic telescope ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [observe-jupiter-moons](/processes/observe-jupiter-moons)
        - Requires: basic telescope ×1, camera tripod ×1
        - Consumes: none

## 7) Map the Constellations (`astronomy/constellations`)

- Quest link: [/quests/astronomy/constellations](/quests/astronomy/constellations)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
    - `plan` → "Plan is ready—let's star hop." — seasonal star hop plan ×1
    - `chart` → "I can spot them easily now!" — constellation sketch set ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - constellation sketch set ×1
- Processes used:
    - [draft-seasonal-star-plan](/processes/draft-seasonal-star-plan)
        - Requires: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: seasonal star hop plan ×1
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 8) Split a Binary Star (`astronomy/binary-star`)

- Quest link: [/quests/astronomy/binary-star](/quests/astronomy/binary-star)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/constellations`
- Dialogue `requiresItems` gates:
    - `locate` → "I see gold and blue!" — basic telescope ×1, planisphere star chart ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 9) Measure Light Pollution (`astronomy/light-pollution`)

- Quest link: [/quests/astronomy/light-pollution](/quests/astronomy/light-pollution)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/constellations`
- Dialogue `requiresItems` gates:
    - `measure` → "Count noted in my mission logbook." — planisphere star chart ×1, red flashlight ×1, mission logbook ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 10) Watch the Aurora (`astronomy/aurora-watch`)

- Quest link: [/quests/astronomy/aurora-watch](/quests/astronomy/aurora-watch)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/light-pollution`
- Dialogue `requiresItems` gates:
    - `forecast` → "Window picked—what should I pack?" — aurora viewing plan ×1
    - `kit` → "Kit is ready—let's step outside." — dark-sky kit packed ×1
    - `observe` → "Entry written with colors and timestamps." — aurora sighting log ×1
- Troubleshooting and safety flow:
    - `session-check` branches between live observing and `fallback` when weather or site safety degrades.
    - `fallback` re-runs forecast planning before returning to session readiness.
    - `verify-log` enforces a complete observation record before finish.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - aurora sighting log ×1
- Processes used:
    - [check-aurora-forecast](/processes/check-aurora-forecast)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: aurora viewing plan ×1
    - [pack-dark-sky-kit](/processes/pack-dark-sky-kit)
        - Requires: red flashlight ×1, aurora viewing plan ×1
        - Consumes: none
        - Creates: dark-sky kit packed ×1
    - [log-aurora-sighting](/processes/log-aurora-sighting)
        - Requires: dark-sky kit packed ×1, aurora viewing plan ×1, mission logbook ×1
        - Consumes: none
        - Creates: aurora sighting log ×1

## 11) Photograph a Lunar Eclipse (`astronomy/lunar-eclipse`)

- Quest link: [/quests/astronomy/lunar-eclipse](/quests/astronomy/lunar-eclipse)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
    - `prep` → "Plan is logged and tripod is stable." — mission log entry ×1, camera tripod ×1, mission logbook ×1, feather quill ×1
    - `capture` → "Shots captured—ready for review." — basic telescope ×1, digital camera ×1
- Troubleshooting and safety flow:
    - `review` branches to `retake` when images fail sharpness/exposure criteria.
    - `retake` loops back to capture with correction guidance and explicit cold/surface safety pause conditions; recapture still requires basic telescope ×1 and digital camera ×1.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1
    - [photograph-lunar-eclipse](/processes/photograph-lunar-eclipse)
        - Requires: basic telescope ×1, digital camera ×1, camera tripod ×1
        - Consumes: none

## 12) Document a Meteor Shower (`astronomy/meteor-shower`)

- Quest link: [/quests/astronomy/meteor-shower](/quests/astronomy/meteor-shower)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
    - `observe` → "Observation complete." — basic telescope ×1, mission logbook ×1, red flashlight ×1, planisphere star chart ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [observe-meteor-shower](/processes/observe-meteor-shower)
        - Requires: basic telescope ×1
        - Consumes: none

## 13) Track a Visiting Comet (`astronomy/comet-tracking`)

- Quest link: [/quests/astronomy/comet-tracking](/quests/astronomy/comet-tracking)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
    - `observe` → "Path recorded" — basic telescope ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [observe-meteor-shower](/processes/observe-meteor-shower)
        - Requires: basic telescope ×1
        - Consumes: none

## 14) Locate the North Star (`astronomy/north-star`)

- Quest link: [/quests/astronomy/north-star](/quests/astronomy/north-star)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/constellations`
- Dialogue `requiresItems` gates:
    - `start` → "Show me the steps." — constellation sketch set ×1
    - `locate` → "Polaris spotted." — Polaris alignment note ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Polaris alignment note ×1
- Processes used:
    - [mark-polaris-alignment](/processes/mark-polaris-alignment)
        - Requires: constellation sketch set ×1, basic telescope ×1, camera tripod ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: Polaris alignment note ×1

## 15) Observe the Orion Nebula (`astronomy/orion-nebula`)

- Quest link: [/quests/astronomy/orion-nebula](/quests/astronomy/orion-nebula)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/andromeda`
- Dialogue `requiresItems` gates:
    - `search` → "The nebula glows!" — planisphere star chart ×1, red flashlight ×1, basic telescope ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 16) Planetary Alignment (`astronomy/planetary-alignment`)

- Quest link: [/quests/astronomy/planetary-alignment](/quests/astronomy/planetary-alignment)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/north-star`
- Dialogue `requiresItems` gates:
    - `middle` → "Alignment confirmed." — basic telescope ×1
- Grants:
    - `middle` → "Thanks for the chart!" — basic telescope ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - dUSD ×100
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 17) Track a Satellite Pass (`astronomy/satellite-pass`)

- Quest link: [/quests/astronomy/satellite-pass](/quests/astronomy/satellite-pass)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
    - `observe` → "I kept it in sight" — basic telescope ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 18) Spot Saturn's Rings (`astronomy/saturn-rings`)

- Quest link: [/quests/astronomy/saturn-rings](/quests/astronomy/saturn-rings)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
    - `start` → "Where do I point?" — planisphere star chart ×1, basic telescope ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 19) Capture Star Trails (`astronomy/star-trails`)

- Quest link: [/quests/astronomy/star-trails](/quests/astronomy/star-trails)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/planetary-alignment`
- Dialogue `requiresItems` gates:
    - `start` → "Plot the hop and gear." — planisphere star chart ×1, red flashlight ×1, mission logbook ×1
    - `plan` → "Tripod leveled and azimuth marked." — seasonal star hop plan ×1, red flashlight ×1, digital camera ×1, camera tripod ×1
    - `setup` → "Stack captured and color-balanced." — polar-aligned camera rig ×1, Laptop Computer ×1
    - `finish` → "Save to the observing log." — stacked star trail photo ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [draft-seasonal-star-plan](/processes/draft-seasonal-star-plan)
        - Requires: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: seasonal star hop plan ×1
    - [align-star-trail-rig](/processes/align-star-trail-rig)
        - Requires: seasonal star hop plan ×1, digital camera ×1, camera tripod ×1, red flashlight ×1
        - Consumes: none
        - Creates: polar-aligned camera rig ×1
    - [capture-star-trail-stack](/processes/capture-star-trail-stack)
        - Requires: polar-aligned camera rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: stacked star trail photo ×1

## 20) Sketch Sunspots (`astronomy/sunspot-sketch`)

- Quest link: [/quests/astronomy/sunspot-sketch](/quests/astronomy/sunspot-sketch)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/saturn-rings`
- Dialogue `requiresItems` gates:
    - `project` → "Sunspots sketched in my logbook." — basic telescope ×1, mission logbook ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 21) Observe Venus's Phases (`astronomy/venus-phases`)

- Quest link: [/quests/astronomy/venus-phases](/quests/astronomy/venus-phases)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/saturn-rings`
- Dialogue `requiresItems` gates:
    - `start` → "Ready to aim." — planisphere star chart ×1, basic telescope ×1
    - `plan` → "Timing locked—let's observe." — Venus observation window ×1
    - `view` → "Phase recorded with date and time." — Venus phase sketch ×1
    - `interpret` → "Measured fraction is within the 20%-60% target band." — Venus phase sketch ×1
- Troubleshooting and safety flow:
    - `view` now branches to `recheck` when seeing is unstable.
    - `interpret` enforces pass/fail bounds (20%-60% illuminated fraction) and routes out-of-range results to corrective re-test loops (`recheck` → `plan`/`view`).
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Venus phase sketch ×1
- Processes used:
    - [plan-venus-window](/processes/plan-venus-window)
        - Requires: planisphere star chart ×1, smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: Venus observation window ×1
    - [sketch-venus-phase](/processes/sketch-venus-phase)
        - Requires: Venus observation window ×1, basic telescope ×1, mission logbook ×1
        - Consumes: none
        - Creates: Venus phase sketch ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
