---
title: 'Energy'
slug: 'energy'
---

Energy quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Set up a solar panel](/quests/energy/solar) (`energy/solar`)
2. [Maintain Your Battery Pack](/quests/energy/battery-maintenance) (`energy/battery-maintenance`)
3. [Install a Larger Battery](/quests/energy/battery-upgrade) (`energy/battery-upgrade`)
4. [Configure a Solar Charge Controller](/quests/energy/charge-controller-setup) (`energy/charge-controller-setup`)
5. [Accumulate 1,000 dWatt](/quests/energy/dWatt-1e3) (`energy/dWatt-1e3`)
6. [Accumulate 10,000 dWatt](/quests/energy/dWatt-1e4) (`energy/dWatt-1e4`)
7. [Collect a Stunning 100,000 dWatt](/quests/energy/dWatt-1e5) (`energy/dWatt-1e5`)
8. [Achieve an Astounding 1,000,000 dWatt](/quests/energy/dWatt-1e6) (`energy/dWatt-1e6`)
9. [Amass an Unbelievable 10,000,000 dWatt](/quests/energy/dWatt-1e7) (`energy/dWatt-1e7`)
10. [Store a Colossal 100,000,000 dWatt](/quests/energy/dWatt-1e8) (`energy/dWatt-1e8`)
11. [Build a Hand Crank Generator](/quests/energy/hand-crank-generator) (`energy/hand-crank-generator`)
12. [Charge a Device Off-Grid](/quests/energy/offgrid-charger) (`energy/offgrid-charger`)
13. [Test a Portable Solar Panel](/quests/energy/portable-solar-panel) (`energy/portable-solar-panel`)
14. [Install a Power Inverter](/quests/energy/power-inverter) (`energy/power-inverter`)
15. [Upgrade your solar enclosure with more capacity](/quests/energy/solar-1kWh) (`energy/solar-1kWh`)
16. [Build a Biogas Digester](/quests/energy/biogas-digester) (`energy/biogas-digester`)
17. [Accrue 1,000 dSolar](/quests/energy/dSolar-1kW) (`energy/dSolar-1kW`)
18. [Accrue 10,000 dSolar](/quests/energy/dSolar-10kW) (`energy/dSolar-10kW`)
19. [Accrue 100,000 dSolar](/quests/energy/dSolar-100kW) (`energy/dSolar-100kW`)
20. [Build a Solar Tracker](/quests/energy/solar-tracker) (`energy/solar-tracker`)
21. [Install a Wind Turbine](/quests/energy/wind-turbine) (`energy/wind-turbine`)

---

## 1) Set up a solar panel (`energy/solar`)

- Quest link: [/quests/energy/solar](/quests/energy/solar)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `materials` → "Alright, what's next?"
    - 02b32152-a7b2-458e-9643-7b754c722165 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
    - 3720a674-e205-4950-aa1d-b10dca1885ca ×1
  - `setup` → "Everything's all set up! What now?"
    - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
  - `charge` → "You've made my day, Orion! Thanks so much!!"
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Wow, no charge? You're too kind!"
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 3720a674-e205-4950-aa1d-b10dca1885ca ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×1
  - 5bba251a-d223-4e22-aa30-b65238b17516 ×1
- Processes used:
  - [setup-solar-enclosure-200Wh](/processes/setup-solar-enclosure-200Wh)
    - Requires:
      - None
    - Consumes:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 3720a674-e205-4950-aa1d-b10dca1885ca ×1
    - Creates:
      - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
  - [solar-200Wh](/processes/solar-200Wh)
    - Requires:
      - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200

---

## 2) Maintain Your Battery Pack (`energy/battery-maintenance`)

- Quest link: [/quests/energy/battery-maintenance](/quests/energy/battery-maintenance)
- Unlock prerequisite:
  - `energy/solar`
- Dialogue `requiresItems` gates:
  - `cycle` → "Battery cycled"
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [charge-battery-pack-solar](/processes/charge-battery-pack-solar)
    - Requires:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200

---

## 3) Install a Larger Battery (`energy/battery-upgrade`)

- Quest link: [/quests/energy/battery-upgrade](/quests/energy/battery-upgrade)
- Unlock prerequisite:
  - `energy/solar`
- Dialogue `requiresItems` gates:
  - `install` → "All set"
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [setup-solar-enclosure-1kWh](/processes/setup-solar-enclosure-1kWh)
    - Requires:
      - None
    - Consumes:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 7246c1c8-f22e-4d31-acd3-967f91b8626a ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 3720a674-e205-4950-aa1d-b10dca1885ca ×1
    - Creates:
      - 8bfdedf6-79a4-4527-a43d-4d57f793ac52 ×1

---

## 4) Configure a Solar Charge Controller (`energy/charge-controller-setup`)

- Quest link: [/quests/energy/charge-controller-setup](/quests/energy/charge-controller-setup)
- Unlock prerequisite:
  - `energy/solar`
- Dialogue `requiresItems` gates:
  - `layout` → "Polarity checked; fuse still out."
    - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
    - 02b32152-a7b2-458e-9643-7b754c722165 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - `wire` → "Controller powers up without sparks."
    - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
  - `configure` → "Settings saved and fuse seated."
    - 22a50cfd-4433-4ce7-bbed-e4038338191b ×1
  - `charge` → "Controller shows a happy, full pack."
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
- Grants:
  - Option/step `grantsItems`:
    - `layout` → "Borrow my kit"
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [configure-charge-controller-profile](/processes/configure-charge-controller-profile)
    - Requires:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
    - Consumes:
      - None
    - Creates:
      - 22a50cfd-4433-4ce7-bbed-e4038338191b ×1
  - [harvest-200Wh-portable](/processes/harvest-200Wh-portable)
    - Requires:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
  - [wire-portable-solar-kit](/processes/wire-portable-solar-kit)
    - Requires:
      - None
    - Consumes:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
    - Creates:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1

---

## 5) Accumulate 1,000 dWatt (`energy/dWatt-1e3`)

- Quest link: [/quests/energy/dWatt-1e3](/quests/energy/dWatt-1e3)
- Unlock prerequisite:
  - `energy/charge-controller-setup`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×1
- Processes used:
  - None

---

## 6) Accumulate 10,000 dWatt (`energy/dWatt-1e4`)

- Quest link: [/quests/energy/dWatt-1e4](/quests/energy/dWatt-1e4)
- Unlock prerequisite:
  - `energy/dWatt-1e3`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×3
- Processes used:
  - None

---

## 7) Collect a Stunning 100,000 dWatt (`energy/dWatt-1e5`)

- Quest link: [/quests/energy/dWatt-1e5](/quests/energy/dWatt-1e5)
- Unlock prerequisite:
  - `energy/dWatt-1e4`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×100000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×5
- Processes used:
  - None

---

## 8) Achieve an Astounding 1,000,000 dWatt (`energy/dWatt-1e6`)

- Quest link: [/quests/energy/dWatt-1e6](/quests/energy/dWatt-1e6)
- Unlock prerequisite:
  - `energy/dWatt-1e4`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×10
- Processes used:
  - None

---

## 9) Amass an Unbelievable 10,000,000 dWatt (`energy/dWatt-1e7`)

- Quest link: [/quests/energy/dWatt-1e7](/quests/energy/dWatt-1e7)
- Unlock prerequisite:
  - `energy/dWatt-1e5`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10000000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×25
- Processes used:
  - None

---

## 10) Store a Colossal 100,000,000 dWatt (`energy/dWatt-1e8`)

- Quest link: [/quests/energy/dWatt-1e8](/quests/energy/dWatt-1e8)
- Unlock prerequisite:
  - `energy/dWatt-1e7`
- Dialogue `requiresItems` gates:
  - `progress` → "Goal reached!"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×100000000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×50
- Processes used:
  - None

---

## 11) Build a Hand Crank Generator (`energy/hand-crank-generator`)

- Quest link: [/quests/energy/hand-crank-generator](/quests/energy/hand-crank-generator)
- Unlock prerequisite:
  - `energy/dWatt-1e3`
- Dialogue `requiresItems` gates:
  - `start` → "I'll prep the printer and parts list."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×60
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - `print` → "Prints cooled and cleaned."
    - d715cf3d-c616-47a6-b753-ae24c87714f3 ×1
    - 3326e89c-5883-473d-a68f-3ea560093966 ×1
  - `prep` → "Bench is staged and parts checked."
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 6caa08d8-815c-4a0e-9297-0fda4516659d ×1
    - d715cf3d-c616-47a6-b753-ae24c87714f3 ×1
    - 3326e89c-5883-473d-a68f-3ea560093966 ×1
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
    - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
  - `assemble` → "Generator spins freely and leads are secure."
    - afb2b5a3-60e2-4863-b2db-e4d280145128 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
  - `charge` → "Logged 50 Wh without hot wires."
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-hand-crank-generator](/processes/assemble-hand-crank-generator)
    - Requires:
      - 3326e89c-5883-473d-a68f-3ea560093966 ×1
      - d715cf3d-c616-47a6-b753-ae24c87714f3 ×1
      - 6caa08d8-815c-4a0e-9297-0fda4516659d ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
      - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
    - Consumes:
      - None
    - Creates:
      - afb2b5a3-60e2-4863-b2db-e4d280145128 ×1
  - [hand-crank-50Wh](/processes/hand-crank-50Wh)
    - Requires:
      - afb2b5a3-60e2-4863-b2db-e4d280145128 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50
  - [print-crank-handle](/processes/print-crank-handle)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×20
    - Creates:
      - d715cf3d-c616-47a6-b753-ae24c87714f3 ×1
  - [print-generator-housing](/processes/print-generator-housing)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×40
    - Creates:
      - 3326e89c-5883-473d-a68f-3ea560093966 ×1

---

## 12) Charge a Device Off-Grid (`energy/offgrid-charger`)

- Quest link: [/quests/energy/offgrid-charger](/quests/energy/offgrid-charger)
- Unlock prerequisite:
  - `energy/hand-crank-generator`
- Dialogue `requiresItems` gates:
  - `start` → "Let's give it a try."
    - 82577af7-6724-4cb2-8922-f7140e550145 ×1
  - `kit` → "Everything is staged and dry."
    - 02b32152-a7b2-458e-9643-7b754c722165 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - `wire` → "Everything is tight, fused, and quiet."
    - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
  - `profile` → "Profile saved; cables cool."
    - 22a50cfd-4433-4ce7-bbed-e4038338191b ×1
  - `charge` → "200 Wh harvested and stable."
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
  - `phone` → "Phone charged and the cable stayed cool."
    - 2a9083b7-8578-45e3-8d76-7a298462f847 ×1
- Grants:
  - Option/step `grantsItems`:
    - `kit` → "Take the solar kit"
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [charge-smartphone-offgrid](/processes/charge-smartphone-offgrid)
    - Requires:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
      - 82577af7-6724-4cb2-8922-f7140e550145 ×1
      - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - Consumes:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10
    - Creates:
      - 2a9083b7-8578-45e3-8d76-7a298462f847 ×1
  - [configure-charge-controller-profile](/processes/configure-charge-controller-profile)
    - Requires:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
    - Consumes:
      - None
    - Creates:
      - 22a50cfd-4433-4ce7-bbed-e4038338191b ×1
  - [harvest-200Wh-portable](/processes/harvest-200Wh-portable)
    - Requires:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
  - [wire-portable-solar-kit](/processes/wire-portable-solar-kit)
    - Requires:
      - None
    - Consumes:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
    - Creates:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1

---

## 13) Test a Portable Solar Panel (`energy/portable-solar-panel`)

- Quest link: [/quests/energy/portable-solar-panel](/quests/energy/portable-solar-panel)
- Unlock prerequisite:
  - `energy/offgrid-charger`
- Dialogue `requiresItems` gates:
  - `kit` → "Parts staged and safe."
    - 02b32152-a7b2-458e-9643-7b754c722165 ×1
    - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - `wire` → "Cable ends are tight and fused."
    - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
  - `harvest` → "Harvested 200 Wh without any hot cables."
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
- Grants:
  - Option/step `grantsItems`:
    - `kit` → "Take the loaner kit"
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [harvest-200Wh-portable](/processes/harvest-200Wh-portable)
    - Requires:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200
  - [wire-portable-solar-kit](/processes/wire-portable-solar-kit)
    - Requires:
      - None
    - Consumes:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
    - Creates:
      - 8e540f94-91e0-47a1-b6ca-78e8b48aefac ×1

---

## 14) Install a Power Inverter (`energy/power-inverter`)

- Quest link: [/quests/energy/power-inverter](/quests/energy/power-inverter)
- Unlock prerequisite:
  - `energy/battery-upgrade`
- Dialogue `requiresItems` gates:
  - `gather` → "Parts staged and vent fans are clear."
    - 082481a4-5e40-43e6-8542-0e64a3bd92d7 ×1
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
  - `mount` → "Inverter mounted, fuse in, cables secure."
    - 466cb507-6beb-4c20-967b-4f1fda1d6463 ×1
  - `test` → "AC holds steady and nothing smells toasty."
    - 2e6f7453-6b8a-4e04-8ea6-1ddba490019f ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [load-test-inverter-300w](/processes/load-test-inverter-300w)
    - Requires:
      - 466cb507-6beb-4c20-967b-4f1fda1d6463 ×1
      - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - Consumes:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×150
    - Creates:
      - 2e6f7453-6b8a-4e04-8ea6-1ddba490019f ×1
  - [mount-inverter-300w](/processes/mount-inverter-300w)
    - Requires:
      - None
    - Consumes:
      - 082481a4-5e40-43e6-8542-0e64a3bd92d7 ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - Creates:
      - 466cb507-6beb-4c20-967b-4f1fda1d6463 ×1

---

## 15) Upgrade your solar enclosure with more capacity (`energy/solar-1kWh`)

- Quest link: [/quests/energy/solar-1kWh](/quests/energy/solar-1kWh)
- Unlock prerequisite:
  - `energy/portable-solar-panel`
- Dialogue `requiresItems` gates:
  - `upgrades` → "Alright, it's fully assembled! I assume since I didn't upgrade the panel, it's still gonna charge at the same rate? So instead of an hour, this should take roughly 5 hours?"
    - 8bfdedf6-79a4-4527-a43d-4d57f793ac52 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×3
- Processes used:
  - [disassemble-enclosure-200Wh](/processes/disassemble-enclosure-200Wh)
    - Requires:
      - None
    - Consumes:
      - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
    - Creates:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 3720a674-e205-4950-aa1d-b10dca1885ca ×1
  - [setup-solar-enclosure-1kWh](/processes/setup-solar-enclosure-1kWh)
    - Requires:
      - None
    - Consumes:
      - 02b32152-a7b2-458e-9643-7b754c722165 ×1
      - 7246c1c8-f22e-4d31-acd3-967f91b8626a ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 3720a674-e205-4950-aa1d-b10dca1885ca ×1
    - Creates:
      - 8bfdedf6-79a4-4527-a43d-4d57f793ac52 ×1
  - [solar-1000Wh](/processes/solar-1000Wh)
    - Requires:
      - 8bfdedf6-79a4-4527-a43d-4d57f793ac52 ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×1000

---

## 16) Build a Biogas Digester (`energy/biogas-digester`)

- Quest link: [/quests/energy/biogas-digester](/quests/energy/biogas-digester)
- Unlock prerequisite:
  - `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - `assemble` → "Frame is assembled and wired"
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
  - `feed` → "Gas production started"
    - dc9c057e-2bd1-4bcc-b06c-2e18344ce3e5 ×1
- Grants:
  - Option/step `grantsItems`:
    - `assemble` → "I'll grab the battery pack"
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [biogas-ferment-50Wh](/processes/biogas-ferment-50Wh)
    - Requires: Unknown process id in canonical process list

---

## 17) Accrue 1,000 dSolar (`energy/dSolar-1kW`)

- Quest link: [/quests/energy/dSolar-1kW](/quests/energy/dSolar-1kW)
- Unlock prerequisite:
  - `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×1000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×3
- Processes used:
  - None

---

## 18) Accrue 10,000 dSolar (`energy/dSolar-10kW`)

- Quest link: [/quests/energy/dSolar-10kW](/quests/energy/dSolar-10kW)
- Unlock prerequisite:
  - `energy/dSolar-1kW`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×10000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×6
- Processes used:
  - None

---

## 19) Accrue 100,000 dSolar (`energy/dSolar-100kW`)

- Quest link: [/quests/energy/dSolar-100kW](/quests/energy/dSolar-100kW)
- Unlock prerequisite:
  - `energy/dSolar-10kW`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×100000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 02b32152-a7b2-458e-9643-7b754c722165 ×10
- Processes used:
  - None

---

## 20) Build a Solar Tracker (`energy/solar-tracker`)

- Quest link: [/quests/energy/solar-tracker](/quests/energy/solar-tracker)
- Unlock prerequisite:
  - `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - `track` → "Tracker humming"
    - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
- Grants:
  - Option/step `grantsItems`:
    - `track` → "Take the kit"
      - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [solar-200Wh](/processes/solar-200Wh)
    - Requires:
      - e0590418-22c7-4885-9c9e-1d1cdafb78d6 ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200

---

## 21) Install a Wind Turbine (`energy/wind-turbine`)

- Quest link: [/quests/energy/wind-turbine](/quests/energy/wind-turbine)
- Unlock prerequisite:
  - `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - `start` → "Site is clear and gear is staged."
    - 743681a7-d2e7-465c-af07-43665079bf4d ×1
    - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
    - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
    - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
    - 6a3772b6-2550-434f-89f9-2eb53d5b139f ×1
    - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
  - `setup` → "Tower is anchored and the brake test passed."
    - 34540aad-4c25-4268-a158-a291283bc7a0 ×1
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
  - `harvest` → "Logged 200 Wh and cables stayed cool."
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [charge-battery-pack-wind](/processes/charge-battery-pack-wind)
    - Requires:
      - 34540aad-4c25-4268-a158-a291283bc7a0 ×1
      - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - Consumes:
      - None
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
      - d0758cf9-b5a6-46c7-b4b2-dc24c7d9df67 ×200
  - [mount-wire-wind-turbine-500w](/processes/mount-wire-wind-turbine-500w)
    - Requires:
      - 743681a7-d2e7-465c-af07-43665079bf4d ×1
      - 67a682f8-a8a4-4a14-8806-5ccd3620fd3b ×1
      - 0ccc4a37-b719-4f7c-ba73-9e4becdcd778 ×1
      - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
      - 6a3772b6-2550-434f-89f9-2eb53d5b139f ×1
      - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
      - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - Consumes:
      - None
    - Creates:
      - 34540aad-4c25-4268-a158-a291283bc7a0 ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `energy/solar` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `energy/solar`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200).
  - `energy/battery-maintenance`: verify prerequisite completion and inventory gates.
  - `energy/battery-upgrade`: verify prerequisite completion and inventory gates.
  - `energy/charge-controller-setup`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200).
  - `energy/dWatt-1e3`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000).
  - `energy/dWatt-1e4`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10000).
  - `energy/dWatt-1e5`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×100000).
  - `energy/dWatt-1e6`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000000).
  - `energy/dWatt-1e7`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10000000).
  - `energy/dWatt-1e8`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×100000000).
  - `energy/hand-crank-generator`: verify prerequisite completion and inventory gates (notable count gates: 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×60, 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50).
  - `energy/offgrid-charger`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200).
  - `energy/portable-solar-panel`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×200).
  - `energy/power-inverter`: verify prerequisite completion and inventory gates.
  - `energy/solar-1kWh`: verify prerequisite completion and inventory gates.
  - `energy/biogas-digester`: verify prerequisite completion and inventory gates.
  - `energy/dSolar-1kW`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×1000).
  - `energy/dSolar-10kW`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×10000).
  - `energy/dSolar-100kW`: verify prerequisite completion and inventory gates (notable count gates: b02ecff5-1f7d-4247-a09d-7d6cd6bb218a ×100000).
  - `energy/solar-tracker`: verify prerequisite completion and inventory gates.
  - `energy/wind-turbine`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200).
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
