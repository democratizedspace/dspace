---
title: 'Astronomy'
slug: 'astronomy'
---

Astronomy quests cover the `astronomy` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Observe the Moon](/quests/astronomy/observe-moon)
2. [Assemble a Simple Telescope](/quests/astronomy/basic-telescope)
3. [Spot the ISS](/quests/astronomy/iss-flyover)
4. [Photograph a Lunar Eclipse](/quests/astronomy/lunar-eclipse)
5. [Locate the Andromeda Galaxy](/quests/astronomy/andromeda)
6. [Track Jupiter's Moons](/quests/astronomy/jupiter-moons)
7. [Spot Saturn's Rings](/quests/astronomy/saturn-rings)
8. [Photograph the ISS](/quests/astronomy/iss-photo)
9. [Observe the Orion Nebula](/quests/astronomy/orion-nebula)
10. [Map the Constellations](/quests/astronomy/constellations)
11. [Document a Meteor Shower](/quests/astronomy/meteor-shower)
12. [Sketch Sunspots](/quests/astronomy/sunspot-sketch)
13. [Observe Venus's Phases](/quests/astronomy/venus-phases)
14. [Split a Binary Star](/quests/astronomy/binary-star)
15. [Measure Light Pollution](/quests/astronomy/light-pollution)
16. [Locate the North Star](/quests/astronomy/north-star)
17. [Track a Visiting Comet](/quests/astronomy/comet-tracking)
18. [Track a Satellite Pass](/quests/astronomy/satellite-pass)
19. [Watch the Aurora](/quests/astronomy/aurora-watch)
20. [Planetary Alignment](/quests/astronomy/planetary-alignment)
21. [Capture Star Trails](/quests/astronomy/star-trails)

## 1) Observe the Moon (`astronomy/observe-moon`)

- Quest link: `/quests/astronomy/observe-moon`
- Unlock prerequisite: `requiresQuests`: ['welcome/howtodoquests']
- Dialogue `requiresItems` gates:
    - `record` → “Sketch completed”: basic telescope ×1, mission logbook ×1, feather quill ×1, bottle of black ink ×1, red flashlight ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`write-mission-log-entry`](/processes/write-mission-log-entry)
        - Requires: mission logbook ×1, feather quill ×1
        - Consumes: bottle of black ink ×0.05
        - Creates: mission log entry ×1

## 2) Assemble a Simple Telescope (`astronomy/basic-telescope`)

- Quest link: `/quests/astronomy/basic-telescope`
- Unlock prerequisite: `requiresQuests`: ['astronomy/observe-moon']
- Dialogue `requiresItems` gates:
    - `start` → “I'm ready.”: 50 mm magnifying lens ×1, 20 mm magnifying lens ×1, cardboard mailing tube ×1, camera tripod ×1, masking tape ×1
    - `build` → “I can see Jupiter!”: basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`assemble-basic-telescope`](/processes/assemble-basic-telescope)
        - Requires: 50 mm magnifying lens ×1, 20 mm magnifying lens ×1, cardboard mailing tube ×1, camera tripod ×1, masking tape ×1
        - Consumes: none
        - Creates: basic telescope ×1

## 3) Spot the ISS (`astronomy/iss-flyover`)

- Quest link: `/quests/astronomy/iss-flyover`
- Unlock prerequisite: `requiresQuests`: ['astronomy/observe-moon']
- Dialogue `requiresItems` gates:
    - `plan` → “Details logged. How do I stage the scope?”: ISS pass window ×1
    - `setup` → “Station is ready for the pass.”: ISS spotting station ×1
    - `observe` → “Entry complete with time and direction.”: ISS pass log ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: ISS pass log ×1
- Processes used:
    - [`check-iss-pass`](/processes/check-iss-pass)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass window ×1
    - [`log-iss-pass`](/processes/log-iss-pass)
        - Requires: ISS spotting station ×1, ISS pass window ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass log ×1
    - [`stage-iss-spotting-station`](/processes/stage-iss-spotting-station)
        - Requires: ISS pass window ×1, basic telescope ×1, camera tripod ×1, red flashlight ×1
        - Consumes: none
        - Creates: ISS spotting station ×1

## 4) Photograph a Lunar Eclipse (`astronomy/lunar-eclipse`)

- Quest link: `/quests/astronomy/lunar-eclipse`
- Unlock prerequisite: `requiresQuests`: ['astronomy/observe-moon']
- Dialogue `requiresItems` gates:
    - `capture` → “Got my shots”: basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`photograph-lunar-eclipse`](/processes/photograph-lunar-eclipse)
        - Requires: basic telescope ×1, digital camera ×1, camera tripod ×1
        - Consumes: none
        - Creates: none

## 5) Locate the Andromeda Galaxy (`astronomy/andromeda`)

- Quest link: `/quests/astronomy/andromeda`
- Unlock prerequisite: `requiresQuests`: ['astronomy/basic-telescope']
- Dialogue `requiresItems` gates:
    - `start` → “Gear ready.”: planisphere star chart ×1, red flashlight ×1
    - `search` → “Galaxy in sight.”: basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 6) Track Jupiter's Moons (`astronomy/jupiter-moons`)

- Quest link: `/quests/astronomy/jupiter-moons`
- Unlock prerequisite: `requiresQuests`: ['astronomy/basic-telescope']
- Dialogue `requiresItems` gates:
    - `observe` → “Week complete.”: basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`observe-jupiter-moons`](/processes/observe-jupiter-moons)
        - Requires: basic telescope ×1, camera tripod ×1
        - Consumes: none
        - Creates: none

## 7) Spot Saturn's Rings (`astronomy/saturn-rings`)

- Quest link: `/quests/astronomy/saturn-rings`
- Unlock prerequisite: `requiresQuests`: ['astronomy/basic-telescope']
- Dialogue `requiresItems` gates:
    - `start` → “Where do I point?”: planisphere star chart ×1, basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 8) Photograph the ISS (`astronomy/iss-photo`)

- Quest link: `/quests/astronomy/iss-photo`
- Unlock prerequisite: `requiresQuests`: ['astronomy/iss-flyover']
- Dialogue `requiresItems` gates:
    - `plan` → “Pass time noted, gear set.”: smartphone ×1, camera tripod ×1
    - `capture` → “Photo saved and logged.”: mission logbook ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`check-iss-pass`](/processes/check-iss-pass)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: ISS pass window ×1

## 9) Observe the Orion Nebula (`astronomy/orion-nebula`)

- Quest link: `/quests/astronomy/orion-nebula`
- Unlock prerequisite: `requiresQuests`: ['astronomy/andromeda']
- Dialogue `requiresItems` gates:
    - `search` → “The nebula glows!”: planisphere star chart ×1, red flashlight ×1, basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 10) Map the Constellations (`astronomy/constellations`)

- Quest link: `/quests/astronomy/constellations`
- Unlock prerequisite: `requiresQuests`: ['astronomy/jupiter-moons']
- Dialogue `requiresItems` gates:
    - `plan` → “Plan is ready—let's star hop.”: seasonal star hop plan ×1
    - `chart` → “I can spot them easily now!”: constellation sketch set ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: constellation sketch set ×1
- Processes used:
    - [`draft-seasonal-star-plan`](/processes/draft-seasonal-star-plan)
        - Requires: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: seasonal star hop plan ×1
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 11) Document a Meteor Shower (`astronomy/meteor-shower`)

- Quest link: `/quests/astronomy/meteor-shower`
- Unlock prerequisite: `requiresQuests`: ['astronomy/jupiter-moons']
- Dialogue `requiresItems` gates:
    - `observe` → “Observation complete.”: basic telescope ×1, mission logbook ×1, red flashlight ×1, planisphere star chart ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`observe-meteor-shower`](/processes/observe-meteor-shower)
        - Requires: basic telescope ×1
        - Consumes: none
        - Creates: none

## 12) Sketch Sunspots (`astronomy/sunspot-sketch`)

- Quest link: `/quests/astronomy/sunspot-sketch`
- Unlock prerequisite: `requiresQuests`: ['astronomy/saturn-rings']
- Dialogue `requiresItems` gates:
    - `project` → “Sunspots sketched in my logbook.”: basic telescope ×1, mission logbook ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 13) Observe Venus's Phases (`astronomy/venus-phases`)

- Quest link: `/quests/astronomy/venus-phases`
- Unlock prerequisite: `requiresQuests`: ['astronomy/saturn-rings']
- Dialogue `requiresItems` gates:
    - `start` → “Ready to aim.”: planisphere star chart ×1, basic telescope ×1
    - `plan` → “Timing locked—let's observe.”: Venus observation window ×1
    - `view` → “Phase recorded with date and time.”: Venus phase sketch ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Venus phase sketch ×1
- Processes used:
    - [`plan-venus-window`](/processes/plan-venus-window)
        - Requires: planisphere star chart ×1, smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: Venus observation window ×1
    - [`sketch-venus-phase`](/processes/sketch-venus-phase)
        - Requires: Venus observation window ×1, basic telescope ×1, mission logbook ×1
        - Consumes: none
        - Creates: Venus phase sketch ×1

## 14) Split a Binary Star (`astronomy/binary-star`)

- Quest link: `/quests/astronomy/binary-star`
- Unlock prerequisite: `requiresQuests`: ['astronomy/constellations']
- Dialogue `requiresItems` gates:
    - `locate` → “I see gold and blue!”: basic telescope ×1, planisphere star chart ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 15) Measure Light Pollution (`astronomy/light-pollution`)

- Quest link: `/quests/astronomy/light-pollution`
- Unlock prerequisite: `requiresQuests`: ['astronomy/constellations']
- Dialogue `requiresItems` gates:
    - `measure` → “Count noted in my mission logbook.”: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 16) Locate the North Star (`astronomy/north-star`)

- Quest link: `/quests/astronomy/north-star`
- Unlock prerequisite: `requiresQuests`: ['astronomy/constellations']
- Dialogue `requiresItems` gates:
    - `start` → “Show me the steps.”: constellation sketch set ×1
    - `locate` → “Polaris spotted.”: Polaris alignment note ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Polaris alignment note ×1
- Processes used:
    - [`mark-polaris-alignment`](/processes/mark-polaris-alignment)
        - Requires: constellation sketch set ×1, basic telescope ×1, camera tripod ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: Polaris alignment note ×1

## 17) Track a Visiting Comet (`astronomy/comet-tracking`)

- Quest link: `/quests/astronomy/comet-tracking`
- Unlock prerequisite: `requiresQuests`: ['astronomy/meteor-shower']
- Dialogue `requiresItems` gates:
    - `observe` → “Path recorded”: basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`observe-meteor-shower`](/processes/observe-meteor-shower)
        - Requires: basic telescope ×1
        - Consumes: none
        - Creates: none

## 18) Track a Satellite Pass (`astronomy/satellite-pass`)

- Quest link: `/quests/astronomy/satellite-pass`
- Unlock prerequisite: `requiresQuests`: ['astronomy/meteor-shower']
- Dialogue `requiresItems` gates:
    - `observe` → “I kept it in sight”: basic telescope ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 19) Watch the Aurora (`astronomy/aurora-watch`)

- Quest link: `/quests/astronomy/aurora-watch`
- Unlock prerequisite: `requiresQuests`: ['astronomy/light-pollution']
- Dialogue `requiresItems` gates:
    - `forecast` → “Window picked—what should I pack?”: aurora viewing plan ×1
    - `kit` → “Kit is ready—let's step outside.”: dark-sky kit packed ×1
    - `observe` → “Entry written with colors and timestamps.”: aurora sighting log ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: aurora sighting log ×1
- Processes used:
    - [`check-aurora-forecast`](/processes/check-aurora-forecast)
        - Requires: smartphone ×1, mission logbook ×1
        - Consumes: none
        - Creates: aurora viewing plan ×1
    - [`log-aurora-sighting`](/processes/log-aurora-sighting)
        - Requires: dark-sky kit packed ×1, aurora viewing plan ×1, mission logbook ×1
        - Consumes: none
        - Creates: aurora sighting log ×1
    - [`pack-dark-sky-kit`](/processes/pack-dark-sky-kit)
        - Requires: red flashlight ×1, aurora viewing plan ×1
        - Consumes: none
        - Creates: dark-sky kit packed ×1

## 20) Planetary Alignment (`astronomy/planetary-alignment`)

- Quest link: `/quests/astronomy/planetary-alignment`
- Unlock prerequisite: `requiresQuests`: ['astronomy/north-star']
- Dialogue `requiresItems` gates:
    - `middle` → “Alignment confirmed.”: basic telescope ×1
- Grants:
    - `middle` → “Thanks for the chart!”: basic telescope ×1
    - Quest-level `grantsItems`: None
- Rewards: dUSD ×100
- Processes used:
    - [`identify-constellations`](/processes/identify-constellations)
        - Requires: basic telescope ×1, planisphere star chart ×1
        - Consumes: none
        - Creates: constellation sketch set ×1

## 21) Capture Star Trails (`astronomy/star-trails`)

- Quest link: `/quests/astronomy/star-trails`
- Unlock prerequisite: `requiresQuests`: ['astronomy/planetary-alignment']
- Dialogue `requiresItems` gates:
    - `start` → “Plot the hop and gear.”: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
    - `plan` → “Tripod leveled and azimuth marked.”: seasonal star hop plan ×1, red flashlight ×1, digital camera ×1, camera tripod ×1
    - `setup` → “Stack captured and color-balanced.”: polar-aligned camera rig ×1, Laptop Computer ×1
    - `finish` → “Save to the observing log.”: stacked star trail photo ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`align-star-trail-rig`](/processes/align-star-trail-rig)
        - Requires: seasonal star hop plan ×1, digital camera ×1, camera tripod ×1, red flashlight ×1
        - Consumes: none
        - Creates: polar-aligned camera rig ×1
    - [`capture-star-trail-stack`](/processes/capture-star-trail-stack)
        - Requires: polar-aligned camera rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: stacked star trail photo ×1
    - [`draft-seasonal-star-plan`](/processes/draft-seasonal-star-plan)
        - Requires: planisphere star chart ×1, red flashlight ×1, mission logbook ×1
        - Consumes: none
        - Creates: seasonal star hop plan ×1

## QA flow notes

- Cross-quest dependencies:
    - `astronomy/observe-moon` unlocks after: welcome/howtodoquests
    - `astronomy/basic-telescope` unlocks after: astronomy/observe-moon
    - `astronomy/iss-flyover` unlocks after: astronomy/observe-moon
    - `astronomy/lunar-eclipse` unlocks after: astronomy/observe-moon
    - `astronomy/andromeda` unlocks after: astronomy/basic-telescope
    - `astronomy/jupiter-moons` unlocks after: astronomy/basic-telescope
    - `astronomy/saturn-rings` unlocks after: astronomy/basic-telescope
    - `astronomy/iss-photo` unlocks after: astronomy/iss-flyover
    - `astronomy/orion-nebula` unlocks after: astronomy/andromeda
    - `astronomy/constellations` unlocks after: astronomy/jupiter-moons
    - `astronomy/meteor-shower` unlocks after: astronomy/jupiter-moons
    - `astronomy/sunspot-sketch` unlocks after: astronomy/saturn-rings
    - `astronomy/venus-phases` unlocks after: astronomy/saturn-rings
    - `astronomy/binary-star` unlocks after: astronomy/constellations
    - `astronomy/light-pollution` unlocks after: astronomy/constellations
    - `astronomy/north-star` unlocks after: astronomy/constellations
    - `astronomy/comet-tracking` unlocks after: astronomy/meteor-shower
    - `astronomy/satellite-pass` unlocks after: astronomy/meteor-shower
    - `astronomy/aurora-watch` unlocks after: astronomy/light-pollution
    - `astronomy/planetary-alignment` unlocks after: astronomy/north-star
    - `astronomy/star-trails` unlocks after: astronomy/planetary-alignment
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `check-iss-pass` is reused in 2 quests (astronomy/iss-flyover, astronomy/iss-photo)
    - Process `draft-seasonal-star-plan` is reused in 2 quests (astronomy/constellations, astronomy/star-trails)
    - Process `identify-constellations` is reused in 7 quests (astronomy/andromeda, astronomy/binary-star, astronomy/constellations, astronomy/light-pollution, astronomy/orion-nebula, astronomy/planetary-alignment, astronomy/satellite-pass)
    - Process `observe-meteor-shower` is reused in 2 quests (astronomy/comet-tracking, astronomy/meteor-shower)
