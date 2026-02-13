---
title: 'Astronomy'
slug: 'astronomy'
---

Astronomy quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Observe the Moon (`astronomy/observe-moon`)

- Quest link: [/quests/astronomy/observe-moon](/quests/astronomy/observe-moon)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `record` → "Sketch completed"
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - aa82b02f-2617-4474-a91b-29647e4a9780 ×1
    - 4729b96d-5057-40d8-83a4-25a4fa122d98 ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [write-mission-log-entry](/processes/write-mission-log-entry)
    - Requires:
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
      - aa82b02f-2617-4474-a91b-29647e4a9780 ×1
    - Consumes:
      - 4729b96d-5057-40d8-83a4-25a4fa122d98 ×0.05
    - Creates:
      - 280ed361-ac70-4ab9-bcd9-aee481790faf ×1

---

## 2) Assemble a Simple Telescope (`astronomy/basic-telescope`)

- Quest link: [/quests/astronomy/basic-telescope](/quests/astronomy/basic-telescope)
- Unlock prerequisite:
  - `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
  - `start` → "I'm ready."
    - 0254a829-9002-4a75-8af2-03cd961601da ×1
    - 7aafe032-86e2-449e-8e25-8148f8c58c17 ×1
    - 2794503d-fbe7-4031-a63e-deac531f9784 ×1
    - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
    - 13aaff4f-e4ba-4e4a-b21b-5852b118a0ed ×1
  - `build` → "I can see Jupiter!"
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-basic-telescope](/processes/assemble-basic-telescope)
    - Requires:
      - 0254a829-9002-4a75-8af2-03cd961601da ×1
      - 7aafe032-86e2-449e-8e25-8148f8c58c17 ×1
      - 2794503d-fbe7-4031-a63e-deac531f9784 ×1
      - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
      - 13aaff4f-e4ba-4e4a-b21b-5852b118a0ed ×1
    - Consumes:
      - None
    - Creates:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1

---

## 3) Locate the Andromeda Galaxy (`astronomy/andromeda`)

- Quest link: [/quests/astronomy/andromeda](/quests/astronomy/andromeda)
- Unlock prerequisite:
  - `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
  - `start` → "Gear ready."
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
  - `search` → "Galaxy in sight."
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 4) Spot the ISS (`astronomy/iss-flyover`)

- Quest link: [/quests/astronomy/iss-flyover](/quests/astronomy/iss-flyover)
- Unlock prerequisite:
  - `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
  - `plan` → "Details logged. How do I stage the scope?"
    - 16478015-5213-4b3f-960c-c0fdaaa91297 ×1
  - `setup` → "Station is ready for the pass."
    - bb97e755-4337-4e9d-8063-4a0cff4649b5 ×1
  - `observe` → "Entry complete with time and direction."
    - 067aa8eb-b5a4-4bef-a307-7dde10e981f5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 067aa8eb-b5a4-4bef-a307-7dde10e981f5 ×1
- Processes used:
  - [check-iss-pass](/processes/check-iss-pass)
    - Requires:
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 16478015-5213-4b3f-960c-c0fdaaa91297 ×1
  - [log-iss-pass](/processes/log-iss-pass)
    - Requires:
      - bb97e755-4337-4e9d-8063-4a0cff4649b5 ×1
      - 16478015-5213-4b3f-960c-c0fdaaa91297 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 067aa8eb-b5a4-4bef-a307-7dde10e981f5 ×1
  - [stage-iss-spotting-station](/processes/stage-iss-spotting-station)
    - Requires:
      - 16478015-5213-4b3f-960c-c0fdaaa91297 ×1
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
      - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - Consumes:
      - None
    - Creates:
      - bb97e755-4337-4e9d-8063-4a0cff4649b5 ×1

---

## 5) Photograph the ISS (`astronomy/iss-photo`)

- Quest link: [/quests/astronomy/iss-photo](/quests/astronomy/iss-photo)
- Unlock prerequisite:
  - `astronomy/iss-flyover`
- Dialogue `requiresItems` gates:
  - `plan` → "Pass time noted, gear set."
    - 82577af7-6724-4cb2-8922-f7140e550145 ×1
    - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
  - `capture` → "Photo saved and logged."
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [check-iss-pass](/processes/check-iss-pass)
    - Requires:
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 16478015-5213-4b3f-960c-c0fdaaa91297 ×1

---

## 6) Track Jupiter's Moons (`astronomy/jupiter-moons`)

- Quest link: [/quests/astronomy/jupiter-moons](/quests/astronomy/jupiter-moons)
- Unlock prerequisite:
  - `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
  - `observe` → "Week complete."
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [observe-jupiter-moons](/processes/observe-jupiter-moons)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 7) Map the Constellations (`astronomy/constellations`)

- Quest link: [/quests/astronomy/constellations](/quests/astronomy/constellations)
- Unlock prerequisite:
  - `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
  - `plan` → "Plan is ready—let's star hop."
    - 60da6648-c22e-466e-9789-9e1d4635fd46 ×1
  - `chart` → "I can spot them easily now!"
    - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1
- Processes used:
  - [draft-seasonal-star-plan](/processes/draft-seasonal-star-plan)
    - Requires:
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
      - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 60da6648-c22e-466e-9789-9e1d4635fd46 ×1
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 8) Split a Binary Star (`astronomy/binary-star`)

- Quest link: [/quests/astronomy/binary-star](/quests/astronomy/binary-star)
- Unlock prerequisite:
  - `astronomy/constellations`
- Dialogue `requiresItems` gates:
  - `locate` → "I see gold and blue!"
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 9) Measure Light Pollution (`astronomy/light-pollution`)

- Quest link: [/quests/astronomy/light-pollution](/quests/astronomy/light-pollution)
- Unlock prerequisite:
  - `astronomy/constellations`
- Dialogue `requiresItems` gates:
  - `measure` → "Count noted in my mission logbook."
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 10) Watch the Aurora (`astronomy/aurora-watch`)

- Quest link: [/quests/astronomy/aurora-watch](/quests/astronomy/aurora-watch)
- Unlock prerequisite:
  - `astronomy/light-pollution`
- Dialogue `requiresItems` gates:
  - `forecast` → "Window picked—what should I pack?"
    - 808f8298-ba98-43d6-907b-1b34a7daffb8 ×1
  - `kit` → "Kit is ready—let's step outside."
    - 0ce0d0d4-d734-4099-b903-92e9b1c52b05 ×1
  - `observe` → "Entry written with colors and timestamps."
    - 682c9b29-b16f-4cf1-aaad-861a4aa133f4 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 682c9b29-b16f-4cf1-aaad-861a4aa133f4 ×1
- Processes used:
  - [check-aurora-forecast](/processes/check-aurora-forecast)
    - Requires:
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 808f8298-ba98-43d6-907b-1b34a7daffb8 ×1
  - [log-aurora-sighting](/processes/log-aurora-sighting)
    - Requires:
      - 0ce0d0d4-d734-4099-b903-92e9b1c52b05 ×1
      - 808f8298-ba98-43d6-907b-1b34a7daffb8 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 682c9b29-b16f-4cf1-aaad-861a4aa133f4 ×1
  - [pack-dark-sky-kit](/processes/pack-dark-sky-kit)
    - Requires:
      - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
      - 808f8298-ba98-43d6-907b-1b34a7daffb8 ×1
    - Consumes:
      - None
    - Creates:
      - 0ce0d0d4-d734-4099-b903-92e9b1c52b05 ×1

---

## 11) Photograph a Lunar Eclipse (`astronomy/lunar-eclipse`)

- Quest link: [/quests/astronomy/lunar-eclipse](/quests/astronomy/lunar-eclipse)
- Unlock prerequisite:
  - `astronomy/observe-moon`
- Dialogue `requiresItems` gates:
  - `capture` → "Got my shots"
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [photograph-lunar-eclipse](/processes/photograph-lunar-eclipse)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - a96ce9ed-b9e0-44e5-bd9f-c068643e6749 ×1
      - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 12) Document a Meteor Shower (`astronomy/meteor-shower`)

- Quest link: [/quests/astronomy/meteor-shower](/quests/astronomy/meteor-shower)
- Unlock prerequisite:
  - `astronomy/jupiter-moons`
- Dialogue `requiresItems` gates:
  - `observe` → "Observation complete."
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [observe-meteor-shower](/processes/observe-meteor-shower)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 13) Track a Visiting Comet (`astronomy/comet-tracking`)

- Quest link: [/quests/astronomy/comet-tracking](/quests/astronomy/comet-tracking)
- Unlock prerequisite:
  - `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
  - `observe` → "Path recorded"
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [observe-meteor-shower](/processes/observe-meteor-shower)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 14) Locate the North Star (`astronomy/north-star`)

- Quest link: [/quests/astronomy/north-star](/quests/astronomy/north-star)
- Unlock prerequisite:
  - `astronomy/constellations`
- Dialogue `requiresItems` gates:
  - `start` → "Show me the steps."
    - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1
  - `locate` → "Polaris spotted."
    - 6102f07b-384b-437f-b78f-d1e9b5431e97 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 6102f07b-384b-437f-b78f-d1e9b5431e97 ×1
- Processes used:
  - [mark-polaris-alignment](/processes/mark-polaris-alignment)
    - Requires:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
      - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 6102f07b-384b-437f-b78f-d1e9b5431e97 ×1

---

## 15) Observe the Orion Nebula (`astronomy/orion-nebula`)

- Quest link: [/quests/astronomy/orion-nebula](/quests/astronomy/orion-nebula)
- Unlock prerequisite:
  - `astronomy/andromeda`
- Dialogue `requiresItems` gates:
  - `search` → "The nebula glows!"
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 16) Planetary Alignment (`astronomy/planetary-alignment`)

- Quest link: [/quests/astronomy/planetary-alignment](/quests/astronomy/planetary-alignment)
- Unlock prerequisite:
  - `astronomy/north-star`
- Dialogue `requiresItems` gates:
  - `middle` → "Alignment confirmed."
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`:
    - `middle` → "Thanks for the chart!"
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
- Processes used:
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 17) Track a Satellite Pass (`astronomy/satellite-pass`)

- Quest link: [/quests/astronomy/satellite-pass](/quests/astronomy/satellite-pass)
- Unlock prerequisite:
  - `astronomy/meteor-shower`
- Dialogue `requiresItems` gates:
  - `observe` → "I kept it in sight"
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [identify-constellations](/processes/identify-constellations)
    - Requires:
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - Consumes:
      - None
    - Creates:
      - b73f795b-7abb-4a0c-950b-7f8ad82012b8 ×1

---

## 18) Spot Saturn's Rings (`astronomy/saturn-rings`)

- Quest link: [/quests/astronomy/saturn-rings](/quests/astronomy/saturn-rings)
- Unlock prerequisite:
  - `astronomy/basic-telescope`
- Dialogue `requiresItems` gates:
  - `start` → "Where do I point?"
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 19) Capture Star Trails (`astronomy/star-trails`)

- Quest link: [/quests/astronomy/star-trails](/quests/astronomy/star-trails)
- Unlock prerequisite:
  - `astronomy/planetary-alignment`
- Dialogue `requiresItems` gates:
  - `start` → "Plot the hop and gear."
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
  - `plan` → "Tripod leveled and azimuth marked."
    - 60da6648-c22e-466e-9789-9e1d4635fd46 ×1
    - 9a72fb16-fc69-45c5-beca-f25c27028977 ×1
    - a96ce9ed-b9e0-44e5-bd9f-c068643e6749 ×1
    - 49fb255e-a4c3-48e4-bca7-4c3781fdb98b ×1
  - `setup` → "Stack captured and color-balanced."
    - dfbd9155-1c06-4951-9a32-4520107a88fb ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `finish` → "Save to the observing log."
    - 2ab80a53-6a2a-4e51-b1f7-fa78620a0132 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 20) Sketch Sunspots (`astronomy/sunspot-sketch`)

- Quest link: [/quests/astronomy/sunspot-sketch](/quests/astronomy/sunspot-sketch)
- Unlock prerequisite:
  - `astronomy/saturn-rings`
- Dialogue `requiresItems` gates:
  - `project` → "Sunspots sketched in my logbook."
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
    - 70bb8d86-2c4e-4330-9705-371891934686 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 21) Observe Venus's Phases (`astronomy/venus-phases`)

- Quest link: [/quests/astronomy/venus-phases](/quests/astronomy/venus-phases)
- Unlock prerequisite:
  - `astronomy/saturn-rings`
- Dialogue `requiresItems` gates:
  - `start` → "Ready to aim."
    - 98f6252e-95c2-468a-b110-69d47604df2c ×1
    - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
  - `plan` → "Timing locked—let's observe."
    - 4b328572-69f2-4fa6-8005-dc64ac434cef ×1
  - `view` → "Phase recorded with date and time."
    - 85d4fb76-9591-4b70-b88d-e74ff133215d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 85d4fb76-9591-4b70-b88d-e74ff133215d ×1
- Processes used:
  - [plan-venus-window](/processes/plan-venus-window)
    - Requires:
      - 98f6252e-95c2-468a-b110-69d47604df2c ×1
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 4b328572-69f2-4fa6-8005-dc64ac434cef ×1
  - [sketch-venus-phase](/processes/sketch-venus-phase)
    - Requires:
      - 4b328572-69f2-4fa6-8005-dc64ac434cef ×1
      - f439b57a-9df3-4bd9-9b6e-042476ceecf5 ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
    - Consumes:
      - None
    - Creates:
      - 85d4fb76-9591-4b70-b88d-e74ff133215d ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `astronomy/observe-moon` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `astronomy/observe-moon`: verify prerequisite completion and inventory gates.
  - `astronomy/basic-telescope`: verify prerequisite completion and inventory gates.
  - `astronomy/andromeda`: verify prerequisite completion and inventory gates.
  - `astronomy/iss-flyover`: verify prerequisite completion and inventory gates.
  - `astronomy/iss-photo`: verify prerequisite completion and inventory gates.
  - `astronomy/jupiter-moons`: verify prerequisite completion and inventory gates.
  - `astronomy/constellations`: verify prerequisite completion and inventory gates.
  - `astronomy/binary-star`: verify prerequisite completion and inventory gates.
  - `astronomy/light-pollution`: verify prerequisite completion and inventory gates.
  - `astronomy/aurora-watch`: verify prerequisite completion and inventory gates.
  - `astronomy/lunar-eclipse`: verify prerequisite completion and inventory gates.
  - `astronomy/meteor-shower`: verify prerequisite completion and inventory gates.
  - `astronomy/comet-tracking`: verify prerequisite completion and inventory gates.
  - `astronomy/north-star`: verify prerequisite completion and inventory gates.
  - `astronomy/orion-nebula`: verify prerequisite completion and inventory gates.
  - `astronomy/planetary-alignment`: verify prerequisite completion and inventory gates.
  - `astronomy/satellite-pass`: verify prerequisite completion and inventory gates.
  - `astronomy/saturn-rings`: verify prerequisite completion and inventory gates.
  - `astronomy/star-trails`: verify prerequisite completion and inventory gates.
  - `astronomy/sunspot-sketch`: verify prerequisite completion and inventory gates.
  - `astronomy/venus-phases`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
