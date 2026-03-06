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
    - `start` → "Kit is staged and sunset has started." — basic telescope ×1, mission logbook ×1, feather quill ×1, bottle of black ink ×1, red flashlight ×1
    - `record` → "Observation and sketch are complete." — basic telescope ×1, mission logbook ×1, feather quill ×1, bottle of black ink ×1, red flashlight ×1
    - `verify` → "All three fields are complete and readable." — mission log entry ×1, basic telescope ×1, mission logbook ×1, feather quill ×1, bottle of black ink ×1, red flashlight ×1
- Troubleshooting and safety flow:
    - `session-check` branches to either `record` for a safe observing window or `recovery` when conditions are unsafe.
    - `verify` enforces a complete observation artifact (time + crater notes + seeing note) before completion.
    - `recovery` requires capping optics and re-validating footing/light discipline before looping back.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - dChat ×1, dUSD ×1000
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
    - `verify` → "Verified: stable tripod and clear moon points logged." — mission log entry ×1, basic telescope ×1, mission logbook ×1, feather quill ×1
    - `verify-safety` → "Safety checklist complete; telescope is stored safely." — mission log entry ×1, basic telescope ×1, mission logbook ×1, feather quill ×1
- Troubleshooting and safety flow:
    - `build` branches into a direct assembly path and an alternate staged pre-mount path before verification.
    - `verify` now gates advancement on the mission log entry artifact from `write-mission-log-entry` before safety sign-off.
    - `verify-safety` adds a hard safety gate (lens cap + fault scan + no sun alignment) and routes faults to `troubleshoot` before finish.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Venus phase sketch ×1
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
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - ISS pass log ×1
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
    - `plan` → "Details logged. Pick an observation mode." — ISS pass window ×1
    - `setup` → "Station is ready for the pass." — ISS spotting station ×1
    - `observe-quick` → "Quick note complete with direction and duration." — mission logbook ×1, mission log entry ×1
    - `observe` → "Entry complete with time and direction." — ISS pass log ×1
    - `interpret` → "Log has all fields with condition notes." — ISS pass log ×1
    - `interpret-quick` → "Quick note has all fields with conditions logged." — ISS pass window ×1, mission logbook ×1, mission log entry ×1
    - `follow-up-window` → "Follow-up scheduled and safety note recorded." — mission logbook ×1, mission log entry ×1
- Troubleshooting and safety flow:
    - `choose-observation-mode` adds a non-linear branch between full station setup and a naked-eye fallback lane.
    - `weather-delay` can schedule a deferred follow-up window (`follow-up-window`) when no safe viewing window exists.
    - `interpret` enforces a complete observation artifact (time + direction + duration) and routes incomplete entries back to mode selection for deterministic retries.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Venus phase sketch ×1
- Processes used:
    - [capture-iss-long-exposure-memento](/processes/capture-iss-long-exposure-memento)
        - Requires: digital camera ×1, camera tripod ×1, ISS pass window ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS long-exposure memento print ×1
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
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 5) Photograph the ISS (`astronomy/iss-photo`)

- Quest link: [/quests/astronomy/iss-photo](/quests/astronomy/iss-photo)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/iss-flyover`
- Dialogue `requiresItems` gates:
    - `plan` → "Pass window confirmed, gear is staged." — smartphone ×1, camera tripod ×1, ISS pass window ×1
    - `capture` → "Photo saved and metadata logged." — mission logbook ×1, ISS pass window ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "Pass: streak continuous, timing <15s, heading matches plan." — mission logbook ×1, mission log entry ×1, feather quill ×1
    - `recovery` → "Session aborted safely; follow-up logged for next pass." — mission log entry ×1
- Troubleshooting/safety branches:
    - `interpret` fail path forces `retest` when timing, heading, or framing are out of range.
    - `retest` requires corrective stabilization + heading checks before rerunning capture.
    - `recovery` enforces a safety stop/reschedule path for weather or footing risk and requires a logged follow-up note before completion.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - ISS pass log ×1
- Processes used:
    - [capture-iss-long-exposure-memento](/processes/capture-iss-long-exposure-memento)
        - Requires: digital camera ×1, camera tripod ×1, ISS pass window ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS long-exposure memento print ×1
    - [check-iss-pass](/processes/check-iss-pass)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass window ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 6) Track Jupiter's Moons (`astronomy/jupiter-moons`)

- Quest link: [/quests/astronomy/jupiter-moons](/quests/astronomy/jupiter-moons)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
    - `chart-route` → "Ready to log moon positions." — basic telescope ×1, planisphere star chart ×1, constellation sketch set ×1
    - `quick-route` → "I can separate all four moons clearly." — basic telescope ×1
    - `observe` → "Evidence captured across sessions." — mission logbook ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "Orbital movement confirmed in the log." — mission logbook ×1, mission log entry ×1
    - `recovery` → "Unsafe tonight, but evidence is already logged—finish with caution." — mission logbook ×1, mission log entry ×1
- Troubleshooting/safety branches:
    - `plan` branches to `chart-route` (main) and `quick-route` (alternate) before evidence review.
    - `recovery` enforces safety stand-down for unsafe footing/weather/glare and loops back to planning.
    - `interpret` blocks completion when evidence is inconsistent and routes back through recovery.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - ISS pass log ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [observe-jupiter-moons](/processes/observe-jupiter-moons)
        - Requires: basic telescope ×1, camera tripod ×1
        - Consumes: none
        - Creates: none
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 7) Map the Constellations (`astronomy/constellations`)

- Quest link: [/quests/astronomy/constellations](/quests/astronomy/constellations)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
    - `plan-route` → "Plan is ready—let's star hop." — seasonal star hop plan ×1
    - `sweep-route` → "Anchor confirmed—continue to full mapping." — constellation sketch set ×1
    - `chart` → "Patterns are clear—ready to log evidence." — constellation sketch set ×1
    - `log-evidence` → "Logged with conditions and constellation list." — mission logbook ×1, constellation sketch set ×1, mission log entry ×1
- Troubleshooting/safety branches:
    - `choose-route` creates main and alternate mapping paths before charting.
    - `plan-route`, `sweep-route`, and `chart` all branch to `recovery` for haze/glare disorientation.
    - `recovery` loops back to route selection after a safety reset and prevents completion bypasses.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - planisphere star chart ×1
- Processes used:
    - [draft-seasonal-star-plan](/processes/draft-seasonal-star-plan)
        - Requires: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: seasonal star hop plan ×1
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 8) Split a Binary Star (`astronomy/binary-star`)

- Quest link: [/quests/astronomy/binary-star](/quests/astronomy/binary-star)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/constellations`
- Dialogue `requiresItems` gates:
    - `chart-route` → "I can resolve two stars and distinct colors; move to evidence logging." — basic telescope ×1, planisphere star chart ×1, constellation sketch set ×1
    - `focus-route` → "Focus lock achieved; route to evidence logging." — basic telescope ×1, constellation sketch set ×1
    - `log-evidence` → "Observation logged; run interpretation check." — mission logbook ×1, basic telescope ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "Yes—color contrast and repeatability are both confirmed." — mission log entry ×1, mission logbook ×1
- Troubleshooting/safety branches:
    - `choose-route` now requires both evidence capture and an explicit interpretation gate before completion.
    - `recovery` loops back to route selection after tripod/footing/glare safety checks.
    - Unsafe conditions can still finish only through a caution path, preserving fail-closed safety behavior.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - constellation sketch set ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 9) Measure Light Pollution (`astronomy/light-pollution`)

- Quest link: [/quests/astronomy/light-pollution](/quests/astronomy/light-pollution)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/constellations`
- Dialogue `requiresItems` gates:
    - `local-site` → "Count logged from current location." — planisphere star chart ×1, red flashlight ×1, mission logbook ×1
    - `relocate-site` → "Backup count logged for comparison." — planisphere star chart ×1, mission logbook ×1
    - `interpret` → "Band recorded with site notes and timestamp." — mission logbook ×1, mission log entry ×1, feather quill ×1
- Troubleshooting/safety branches:
    - `choose-site` provides a main path and alternate darker-site path before interpretation.
    - `recovery` enforces glare/haze/footing safety pauses and explicit abort-or-retry handling.
    - Safety abort completion requires a mission-log entry describing why the run was skipped.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - constellation sketch set ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

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
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Venus phase sketch ×1
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
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Venus phase sketch ×1
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
    - `session-plan` → "Sky is clear enough for live observing." — mission logbook ×1, mission log entry ×1
    - `observe-live` → "Observation run complete." — basic telescope ×1, mission logbook ×1, red flashlight ×1, planisphere star chart ×1
    - `interpret` → "Observation artifact and interpretation complete." — mission logbook ×1, mission log entry ×1, feather quill ×1
- Troubleshooting/safety branches:
    - `weather-fallback` handles cloud/haze failures and loops through a re-plan cycle before retry.
    - Safe postponement now requires a logged follow-up note before completion to preserve evidence continuity.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - planisphere star chart ×1
- Processes used:
    - [observe-meteor-shower](/processes/observe-meteor-shower)
        - Requires: basic telescope ×1
        - Consumes: none
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 13) Track a Visiting Comet (`astronomy/comet-tracking`)

- Quest link: [/quests/astronomy/comet-tracking](/quests/astronomy/comet-tracking)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
    - `chart-route` → "Comet path is clear; ready to log." — basic telescope ×1, planisphere star chart ×1
    - `quick-route` → "I can place the comet relative to fixed stars." — basic telescope ×1, camera tripod ×1
    - `log-track` → "Track logged with timestamp and star references." — mission logbook ×1, mission log entry ×1, feather quill ×1
- Troubleshooting/safety branches:
    - `choose-route` introduces main and alternate setup paths before log evidence.
    - `recovery` enforces dark-path footing and glare safety checks with retry or safe-reschedule exits.
    - Safe-reschedule completion requires existing mission-log evidence, preventing bypass of the comet track record gate.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - planisphere star chart ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 14) Locate the North Star (`astronomy/north-star`)

- Quest link: [/quests/astronomy/north-star](/quests/astronomy/north-star)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/constellations`
- Dialogue `requiresItems` gates:
    - `start` → "Show both routes." — constellation sketch set ×1
    - `pointer-route` → "Polaris is stable and the heading is repeatable." — planisphere star chart ×1, constellation sketch set ×1
    - `tripod-route` → "Alignment note captured and Polaris confirmed." — Polaris alignment note ×1, basic telescope ×1
    - `log-evidence` → "Evidence logged and verified." — mission logbook ×1, feather quill ×1, mission log entry ×1, Polaris alignment note ×1
    - `recovery` → "Unsafe tonight; log a caution closeout." — mission logbook ×1, mission log entry ×1
- Troubleshooting/safety branches:
    - `choose-route` splits into pointer-star and tripod-assisted acquisition paths before evidence logging.
    - `recovery` enforces footing/light-discipline checks, then loops to route selection for deterministic retry handling.
    - Unsafe nights can only close out after a mission-log entry exists, so recovery cannot bypass evidence logging.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - constellation sketch set ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [mark-polaris-alignment](/processes/mark-polaris-alignment)
        - Requires: constellation sketch set ×1, basic telescope ×1, camera tripod ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: Polaris alignment note ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 15) Observe the Orion Nebula (`astronomy/orion-nebula`)

- Quest link: [/quests/astronomy/orion-nebula](/quests/astronomy/orion-nebula)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/andromeda`
- Dialogue `requiresItems` gates:
    - `start` → "Give me both approaches." — planisphere star chart ×1, constellation sketch set ×1
    - `belt-route` → "Nebula structure is visible and steady." — planisphere star chart ×1, basic telescope ×1, red flashlight ×1
    - `wide-route` → "Glow confirmed after refocus." — basic telescope ×1, red flashlight ×1
    - `log-observation` → "Log entry ready for interpretation." — mission logbook ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "Interpretation complete and reproducible." — feather quill ×1, red flashlight ×1
    - `recovery` → "Conditions unsafe/poor; close with a deferred-session note." — mission logbook ×1, mission log entry ×1
- Troubleshooting/safety branches:
    - `choose-route` introduces belt-hop and wide-field strategies before evidence gating.
    - `recovery` handles dew, glare, and weather degradation with a mandatory retry loop back to route selection.
    - `interpret` blocks completion until artifact quality is verified and routes uncertain runs back to recovery.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Venus phase sketch ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 16) Planetary Alignment (`astronomy/planetary-alignment`)

- Quest link: [/quests/astronomy/planetary-alignment](/quests/astronomy/planetary-alignment)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/north-star`
- Dialogue `requiresItems` gates:
    - `chart-route` → "Planisphere and telescope are ready for capture." — basic telescope ×1
    - `quick-route` → "Order matches prediction; move to evidence capture." — basic telescope ×1, constellation sketch set ×1
    - `capture` → "Evidence logged; move to interpretation." — mission log entry ×1, mission logbook ×1
    - `interpret` → "Yes—logged order is consistent and uncertainty is documented." — mission log entry ×1, basic telescope ×1
    - `recovery` → "Unsafe window tonight; finish with a logged caution note." — mission log entry ×1
- Troubleshooting/safety branches:
    - `plan` now branches to a chart-first main route and a quick-confirm alternate route.
    - `interpret` blocks finish on inconsistent evidence and routes to `recovery`.
    - `recovery` enforces stand-down checks (footing/weather/glare) before retry or caution closeout.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Polaris alignment note ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 17) Track a Satellite Pass (`astronomy/satellite-pass`)

- Quest link: [/quests/astronomy/satellite-pass](/quests/astronomy/satellite-pass)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
    - `plan` → "Plan recorded and route is clear." — mission logbook ×1, basic telescope ×1, seasonal star hop plan ×1
    - `safety-preflight` → "Preflight complete and hazard check passed." — basic telescope ×1, seasonal star hop plan ×1
    - `weather-hold` → "Sky cleared enough—run preflight before setup." — seasonal star hop plan ×1, basic telescope ×1
    - `setup` → "Setup is stable and ready." — basic telescope ×1, constellation sketch set ×1
    - `observe` → "Pass observed with full notes." — mission logbook ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "All fields logged and coherent." — mission logbook ×1, mission log entry ×1, feather quill ×1
- Troubleshooting/safety branches:
    - `safety-preflight` is a mandatory operational check between planning and setup.
    - `weather-hold` provides seeing/weather fallback and routes through preflight before setup.
    - `classify-anomaly` separates tracking drift, weather interruption, and persistent safety hazards before retry/abort.
    - `troubleshoot` enforces a realignment retry loop that returns through preflight before completion.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - planisphere star chart ×1
- Processes used:
    - [draft-seasonal-star-plan](/processes/draft-seasonal-star-plan)
        - Requires: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: seasonal star hop plan ×1
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 18) Spot Saturn's Rings (`astronomy/saturn-rings`)

- Quest link: [/quests/astronomy/saturn-rings](/quests/astronomy/saturn-rings)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
    - `start` → "Brief me on both routes." — planisphere star chart ×1, basic telescope ×1
    - `chart-route` → "Ring plane resolved clearly." — planisphere star chart ×1, basic telescope ×1, red flashlight ×1
    - `focus-route` → "Focus lock holds and the rings are visible." — basic telescope ×1, red flashlight ×1
    - `log-observation` → "Log entry complete." — mission logbook ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "Interpretation passes; session is reproducible." — feather quill ×1, red flashlight ×1
    - `recovery` → "Unsafe conditions persist; close with a caution log." — mission logbook ×1, mission log entry ×1
- Troubleshooting/safety branches:
    - `choose-route` provides chart-first and focus-first acquisition branches.
    - `recovery` enforces tripod stability, footing, and lighting safety checks before any retry.
    - `interpret` prevents finish bypasses by routing uncertain captures back through recovery.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - ISS pass log ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 19) Capture Star Trails (`astronomy/star-trails`)

- Quest link: [/quests/astronomy/star-trails](/quests/astronomy/star-trails)
- Unlock prerequisite:
    - `requiresQuests`: `astronomy/planetary-alignment`
- Dialogue `requiresItems` gates:
    - `start` → "Plot the hop and gear." — planisphere star chart ×1, red flashlight ×1, mission logbook ×1
    - `plan` → "Tripod leveled and azimuth marked." — seasonal star hop plan ×1, red flashlight ×1, digital camera ×1, camera tripod ×1
    - `setup` → "Stack captured and color-balanced." — polar-aligned camera rig ×1, Laptop Computer ×1
    - `interpret` → "Pass: trails are continuous and drift stayed in bounds." — polar-aligned camera rig ×1, stacked star trail photo ×1
    - `interval-plan` → "Burst set captured and stacked for review." — polar-aligned camera rig ×1, Laptop Computer ×1
    - `recovery` → "Unsafe window tonight; log the partial and stand down." — stacked star trail photo ×1
    - `finish` → "Save to the observing log." — stacked star trail photo ×1
- Troubleshooting/safety branches:
    - `setup` now branches between full-length captures and `interval-plan` burst strategy when seeing is unstable.
    - Both capture strategies gate advancement through `capture-star-trail-stack` evidence before interpretation.
    - `setup` can route to `recovery` on condensation/cloud/battery failures.
    - `interpret` adds explicit pass/fail evidence checks before completion.
    - `recovery` loops back to planning only after tripod/lens/safe-path checks.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - dUSD ×100
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
    - `safety-brief` → "Safety controls are in place." — basic telescope ×1, mission logbook ×1
    - `chart-align` → "Projection disk is crisp and stable." — constellation sketch set ×1
    - `shadow-align` → "Shadow minimized; projection stable." — basic telescope ×1
    - `capture` → "Sketch and notes are complete." — mission logbook ×1, mission log entry ×1, feather quill ×1
    - `interpret` → "All required fields are present." — mission logbook ×1, mission log entry ×1
- Troubleshooting/safety branches:
    - `setup` branches between chart-assisted and shadow-minimization alignment strategies.
    - `recovery` enforces stand-down when overheating or bystander-safety issues appear and loops to `safety-brief`.
    - `interpret` requires structured sketch evidence before finish and sends missing fields back to recovery.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
- Rewards:
    - Venus phase sketch ×1
- Processes used:
    - [identify-constellations](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1
    - [write-mission-log-entry](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

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
    - `recheck` archives failed evidence with `reset-venus-phase-sketch` before retesting to keep final proof deterministic.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: 1 astronomy-themed memento reward in `Astronomy & Observation`
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
    - [reset-venus-phase-sketch](/processes/reset-venus-phase-sketch)
        - Requires: Venus phase sketch ×1
        - Consumes: Venus phase sketch ×1
        - Creates: none

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
