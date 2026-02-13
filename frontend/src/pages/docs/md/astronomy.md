---
title: 'Astronomy'
slug: 'astronomy'
---

This page documents the full **Astronomy** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Observe the Moon](/quests/astronomy/observe-moon) (`astronomy/observe-moon`)
2. [Assemble a Simple Telescope](/quests/astronomy/basic-telescope) (`astronomy/basic-telescope`)
3. [Locate the Andromeda Galaxy](/quests/astronomy/andromeda) (`astronomy/andromeda`)
4. [Spot the ISS](/quests/astronomy/iss-flyover) (`astronomy/iss-flyover`)
5. [Photograph the ISS](/quests/astronomy/iss-photo) (`astronomy/iss-photo`)
6. [Track Jupiter's Moons](/quests/astronomy/jupiter-moons) (`astronomy/jupiter-moons`)
7. [Map the Constellations](/quests/astronomy/constellations) (`astronomy/constellations`)
8. [Split a Binary Star](/quests/astronomy/binary-star) (`astronomy/binary-star`)
9. [Measure Light Pollution](/quests/astronomy/light-pollution) (`astronomy/light-pollution`)
10. [Watch the Aurora](/quests/astronomy/aurora-watch) (`astronomy/aurora-watch`)
11. [Photograph a Lunar Eclipse](/quests/astronomy/lunar-eclipse) (`astronomy/lunar-eclipse`)
12. [Document a Meteor Shower](/quests/astronomy/meteor-shower) (`astronomy/meteor-shower`)
13. [Track a Visiting Comet](/quests/astronomy/comet-tracking) (`astronomy/comet-tracking`)
14. [Locate the North Star](/quests/astronomy/north-star) (`astronomy/north-star`)
15. [Observe the Orion Nebula](/quests/astronomy/orion-nebula) (`astronomy/orion-nebula`)
16. [Planetary Alignment](/quests/astronomy/planetary-alignment) (`astronomy/planetary-alignment`)
17. [Track a Satellite Pass](/quests/astronomy/satellite-pass) (`astronomy/satellite-pass`)
18. [Spot Saturn's Rings](/quests/astronomy/saturn-rings) (`astronomy/saturn-rings`)
19. [Capture Star Trails](/quests/astronomy/star-trails) (`astronomy/star-trails`)
20. [Sketch Sunspots](/quests/astronomy/sunspot-sketch) (`astronomy/sunspot-sketch`)
21. [Observe Venus's Phases](/quests/astronomy/venus-phases) (`astronomy/venus-phases`)

## Quest details

### 1) Observe the Moon (`astronomy/observe-moon`)
- Quest link: `/quests/astronomy/observe-moon`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `record` / Sketch completed: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1; feather quill (`aa82b02f-2617-4474-a91b-29647e4a9780`) x1; bottle of black ink (`4729b96d-5057-40d8-83a4-25a4fa122d98`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`write-mission-log-entry`](/processes/write-mission-log-entry)
    - Requires: mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1; feather quill (`aa82b02f-2617-4474-a91b-29647e4a9780`) x1
    - Consumes: bottle of black ink (`4729b96d-5057-40d8-83a4-25a4fa122d98`) x0.05
    - Creates: mission log entry (`280ed361-ac70-4ab9-bcd9-aee481790faf`) x1

### 2) Assemble a Simple Telescope (`astronomy/basic-telescope`)
- Quest link: `/quests/astronomy/basic-telescope`
- Unlock prerequisite (`requiresQuests`): `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
  - Node `start` / I'm ready.: 50 mm magnifying lens (`0254a829-9002-4a75-8af2-03cd961601da`) x1; 20 mm magnifying lens (`7aafe032-86e2-449e-8e25-8148f8c58c17`) x1; cardboard mailing tube (`2794503d-fbe7-4031-a63e-deac531f9784`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1; masking tape (`13aaff4f-e4ba-4e4a-b21b-5852b118a0ed`) x1
  - Node `build` / I can see Jupiter!: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-basic-telescope`](/processes/assemble-basic-telescope)
    - Requires: 50 mm magnifying lens (`0254a829-9002-4a75-8af2-03cd961601da`) x1; 20 mm magnifying lens (`7aafe032-86e2-449e-8e25-8148f8c58c17`) x1; cardboard mailing tube (`2794503d-fbe7-4031-a63e-deac531f9784`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1; masking tape (`13aaff4f-e4ba-4e4a-b21b-5852b118a0ed`) x1
    - Consumes: None
    - Creates: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1

### 3) Locate the Andromeda Galaxy (`astronomy/andromeda`)
- Quest link: `/quests/astronomy/andromeda`
- Unlock prerequisite (`requiresQuests`): `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
  - Node `start` / Gear ready.: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1
  - Node `search` / Galaxy in sight.: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 4) Spot the ISS (`astronomy/iss-flyover`)
- Quest link: `/quests/astronomy/iss-flyover`
- Unlock prerequisite (`requiresQuests`): `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
  - Node `plan` / Details logged. How do I stage the scope?: ISS pass window (`16478015-5213-4b3f-960c-c0fdaaa91297`) x1
  - Node `setup` / Station is ready for the pass.: ISS spotting station (`bb97e755-4337-4e9d-8063-4a0cff4649b5`) x1
  - Node `observe` / Entry complete with time and direction.: ISS pass log (`067aa8eb-b5a4-4bef-a307-7dde10e981f5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: ISS pass log (`067aa8eb-b5a4-4bef-a307-7dde10e981f5`) x1
- Processes used:
  - [`check-iss-pass`](/processes/check-iss-pass)
    - Requires: smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: ISS pass window (`16478015-5213-4b3f-960c-c0fdaaa91297`) x1
  - [`log-iss-pass`](/processes/log-iss-pass)
    - Requires: ISS spotting station (`bb97e755-4337-4e9d-8063-4a0cff4649b5`) x1; ISS pass window (`16478015-5213-4b3f-960c-c0fdaaa91297`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: ISS pass log (`067aa8eb-b5a4-4bef-a307-7dde10e981f5`) x1
  - [`stage-iss-spotting-station`](/processes/stage-iss-spotting-station)
    - Requires: ISS pass window (`16478015-5213-4b3f-960c-c0fdaaa91297`) x1; basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1
    - Consumes: None
    - Creates: ISS spotting station (`bb97e755-4337-4e9d-8063-4a0cff4649b5`) x1

### 5) Photograph the ISS (`astronomy/iss-photo`)
- Quest link: `/quests/astronomy/iss-photo`
- Unlock prerequisite (`requiresQuests`): `astronomy/iss-flyover`
- Dialogue `requiresItems` gates:
  - Node `plan` / Pass time noted, gear set.: smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1
  - Node `capture` / Photo saved and logged.: mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`check-iss-pass`](/processes/check-iss-pass)
    - Requires: smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: ISS pass window (`16478015-5213-4b3f-960c-c0fdaaa91297`) x1

### 6) Track Jupiter's Moons (`astronomy/jupiter-moons`)
- Quest link: `/quests/astronomy/jupiter-moons`
- Unlock prerequisite (`requiresQuests`): `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
  - Node `observe` / Week complete.: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`observe-jupiter-moons`](/processes/observe-jupiter-moons)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1
    - Consumes: None
    - Creates: None

### 7) Map the Constellations (`astronomy/constellations`)
- Quest link: `/quests/astronomy/constellations`
- Unlock prerequisite (`requiresQuests`): `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
  - Node `plan` / Plan is ready—let's star hop.: seasonal star hop plan (`60da6648-c22e-466e-9789-9e1d4635fd46`) x1
  - Node `chart` / I can spot them easily now!: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1
- Processes used:
  - [`draft-seasonal-star-plan`](/processes/draft-seasonal-star-plan)
    - Requires: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: seasonal star hop plan (`60da6648-c22e-466e-9789-9e1d4635fd46`) x1
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 8) Split a Binary Star (`astronomy/binary-star`)
- Quest link: `/quests/astronomy/binary-star`
- Unlock prerequisite (`requiresQuests`): `astronomy/constellations`
- Dialogue `requiresItems` gates:
  - Node `locate` / I see gold and blue!: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 9) Measure Light Pollution (`astronomy/light-pollution`)
- Quest link: `/quests/astronomy/light-pollution`
- Unlock prerequisite (`requiresQuests`): `astronomy/constellations`
- Dialogue `requiresItems` gates:
  - Node `measure` / Count noted in my mission logbook.: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 10) Watch the Aurora (`astronomy/aurora-watch`)
- Quest link: `/quests/astronomy/aurora-watch`
- Unlock prerequisite (`requiresQuests`): `astronomy/light-pollution`
- Dialogue `requiresItems` gates:
  - Node `forecast` / Window picked—what should I pack?: aurora viewing plan (`808f8298-ba98-43d6-907b-1b34a7daffb8`) x1
  - Node `kit` / Kit is ready—let's step outside.: dark-sky kit packed (`0ce0d0d4-d734-4099-b903-92e9b1c52b05`) x1
  - Node `observe` / Entry written with colors and timestamps.: aurora sighting log (`682c9b29-b16f-4cf1-aaad-861a4aa133f4`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: aurora sighting log (`682c9b29-b16f-4cf1-aaad-861a4aa133f4`) x1
- Processes used:
  - [`check-aurora-forecast`](/processes/check-aurora-forecast)
    - Requires: smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: aurora viewing plan (`808f8298-ba98-43d6-907b-1b34a7daffb8`) x1
  - [`log-aurora-sighting`](/processes/log-aurora-sighting)
    - Requires: dark-sky kit packed (`0ce0d0d4-d734-4099-b903-92e9b1c52b05`) x1; aurora viewing plan (`808f8298-ba98-43d6-907b-1b34a7daffb8`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: aurora sighting log (`682c9b29-b16f-4cf1-aaad-861a4aa133f4`) x1
  - [`pack-dark-sky-kit`](/processes/pack-dark-sky-kit)
    - Requires: red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; aurora viewing plan (`808f8298-ba98-43d6-907b-1b34a7daffb8`) x1
    - Consumes: None
    - Creates: dark-sky kit packed (`0ce0d0d4-d734-4099-b903-92e9b1c52b05`) x1

### 11) Photograph a Lunar Eclipse (`astronomy/lunar-eclipse`)
- Quest link: `/quests/astronomy/lunar-eclipse`
- Unlock prerequisite (`requiresQuests`): `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
  - Node `capture` / Got my shots: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`photograph-lunar-eclipse`](/processes/photograph-lunar-eclipse)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; digital camera (`a96ce9ed-b9e0-44e5-bd9f-c068643e6749`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1
    - Consumes: None
    - Creates: None

### 12) Document a Meteor Shower (`astronomy/meteor-shower`)
- Quest link: `/quests/astronomy/meteor-shower`
- Unlock prerequisite (`requiresQuests`): `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
  - Node `observe` / Observation complete.: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`observe-meteor-shower`](/processes/observe-meteor-shower)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
    - Consumes: None
    - Creates: None

### 13) Track a Visiting Comet (`astronomy/comet-tracking`)
- Quest link: `/quests/astronomy/comet-tracking`
- Unlock prerequisite (`requiresQuests`): `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
  - Node `observe` / Path recorded: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`observe-meteor-shower`](/processes/observe-meteor-shower)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
    - Consumes: None
    - Creates: None

### 14) Locate the North Star (`astronomy/north-star`)
- Quest link: `/quests/astronomy/north-star`
- Unlock prerequisite (`requiresQuests`): `astronomy/constellations`
- Dialogue `requiresItems` gates:
  - Node `start` / Show me the steps.: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1
  - Node `locate` / Polaris spotted.: Polaris alignment note (`6102f07b-384b-437f-b78f-d1e9b5431e97`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Polaris alignment note (`6102f07b-384b-437f-b78f-d1e9b5431e97`) x1
- Processes used:
  - [`mark-polaris-alignment`](/processes/mark-polaris-alignment)
    - Requires: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1; basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: Polaris alignment note (`6102f07b-384b-437f-b78f-d1e9b5431e97`) x1

### 15) Observe the Orion Nebula (`astronomy/orion-nebula`)
- Quest link: `/quests/astronomy/orion-nebula`
- Unlock prerequisite (`requiresQuests`): `astronomy/andromeda`
- Dialogue `requiresItems` gates:
  - Node `search` / The nebula glows!: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 16) Planetary Alignment (`astronomy/planetary-alignment`)
- Quest link: `/quests/astronomy/planetary-alignment`
- Unlock prerequisite (`requiresQuests`): `astronomy/north-star`
- Dialogue `requiresItems` gates:
  - Node `middle` / Alignment confirmed.: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `middle` / Thanks for the chart!: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Quest-level `grantsItems`: None
- Rewards: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100
- Processes used:
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 17) Track a Satellite Pass (`astronomy/satellite-pass`)
- Quest link: `/quests/astronomy/satellite-pass`
- Unlock prerequisite (`requiresQuests`): `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
  - Node `observe` / I kept it in sight: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`identify-constellations`](/processes/identify-constellations)
    - Requires: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1
    - Consumes: None
    - Creates: constellation sketch set (`b73f795b-7abb-4a0c-950b-7f8ad82012b8`) x1

### 18) Spot Saturn's Rings (`astronomy/saturn-rings`)
- Quest link: `/quests/astronomy/saturn-rings`
- Unlock prerequisite (`requiresQuests`): `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
  - Node `start` / Where do I point?: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 19) Capture Star Trails (`astronomy/star-trails`)
- Quest link: `/quests/astronomy/star-trails`
- Unlock prerequisite (`requiresQuests`): `astronomy/planetary-alignment`
- Dialogue `requiresItems` gates:
  - Node `start` / Plot the hop and gear.: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
  - Node `plan` / Tripod leveled and azimuth marked.: seasonal star hop plan (`60da6648-c22e-466e-9789-9e1d4635fd46`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; digital camera (`a96ce9ed-b9e0-44e5-bd9f-c068643e6749`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1
  - Node `setup` / Stack captured and color-balanced.: polar-aligned camera rig (`dfbd9155-1c06-4951-9a32-4520107a88fb`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `finish` / Save to the observing log.: stacked star trail photo (`2ab80a53-6a2a-4e51-b1f7-fa78620a0132`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`align-star-trail-rig`](/processes/align-star-trail-rig)
    - Requires: seasonal star hop plan (`60da6648-c22e-466e-9789-9e1d4635fd46`) x1; digital camera (`a96ce9ed-b9e0-44e5-bd9f-c068643e6749`) x1; camera tripod (`49fb255e-a4c3-48e4-bca7-4c3781fdb98b`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1
    - Consumes: None
    - Creates: polar-aligned camera rig (`dfbd9155-1c06-4951-9a32-4520107a88fb`) x1
  - [`capture-star-trail-stack`](/processes/capture-star-trail-stack)
    - Requires: polar-aligned camera rig (`dfbd9155-1c06-4951-9a32-4520107a88fb`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: stacked star trail photo (`2ab80a53-6a2a-4e51-b1f7-fa78620a0132`) x1
  - [`draft-seasonal-star-plan`](/processes/draft-seasonal-star-plan)
    - Requires: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; red flashlight (`9a72fb16-fc69-45c5-beca-f25c27028977`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: seasonal star hop plan (`60da6648-c22e-466e-9789-9e1d4635fd46`) x1

### 20) Sketch Sunspots (`astronomy/sunspot-sketch`)
- Quest link: `/quests/astronomy/sunspot-sketch`
- Unlock prerequisite (`requiresQuests`): `astronomy/saturn-rings`
- Dialogue `requiresItems` gates:
  - Node `project` / Sunspots sketched in my logbook.: basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 21) Observe Venus's Phases (`astronomy/venus-phases`)
- Quest link: `/quests/astronomy/venus-phases`
- Unlock prerequisite (`requiresQuests`): `astronomy/saturn-rings`
- Dialogue `requiresItems` gates:
  - Node `start` / Ready to aim.: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1
  - Node `plan` / Timing locked—let's observe.: Venus observation window (`4b328572-69f2-4fa6-8005-dc64ac434cef`) x1
  - Node `view` / Phase recorded with date and time.: Venus phase sketch (`85d4fb76-9591-4b70-b88d-e74ff133215d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Venus phase sketch (`85d4fb76-9591-4b70-b88d-e74ff133215d`) x1
- Processes used:
  - [`plan-venus-window`](/processes/plan-venus-window)
    - Requires: planisphere star chart (`98f6252e-95c2-468a-b110-69d47604df2c`) x1; smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: Venus observation window (`4b328572-69f2-4fa6-8005-dc64ac434cef`) x1
  - [`sketch-venus-phase`](/processes/sketch-venus-phase)
    - Requires: Venus observation window (`4b328572-69f2-4fa6-8005-dc64ac434cef`) x1; basic telescope (`f439b57a-9df3-4bd9-9b6e-042476ceecf5`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1
    - Consumes: None
    - Creates: Venus phase sketch (`85d4fb76-9591-4b70-b88d-e74ff133215d`) x1

## QA flow notes

- Cross-quest dependencies are enforced through `requiresQuests` and per-node item gates listed above.
- Progression integrity checks:
  - Verify each quest unlocks only after listed prerequisites are completed.
  - Verify each gated dialogue option appears only when required item counts are met.
  - Verify process outputs satisfy downstream quest gates without requiring unrelated items.
- Known pitfalls to test:
  - Reused processes across quests may require multiple item counts (confirm minimum counts before continue options).
  - If a process is repeatable, ensure “continue” dialogue remains blocked until expected logs/artifacts exist.
- End-to-end validation walkthrough:
  - Complete quests in tree order from the first root quest.
  - At each quest, run every listed process path at least once and confirm resulting inventory deltas.
  - Re-open the next quest and confirm required items and prerequisites are recognized correctly.
