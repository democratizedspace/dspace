---
title: 'Energy'
slug: 'energy'
---

This page documents the full **Energy** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

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

## Quest details

### 1) Set up a solar panel (`energy/solar`)
- Quest link: `/quests/energy/solar`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `materials` / Alright, what's next?: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; Small solar enclosure (`3720a674-e205-4950-aa1d-b10dca1885ca`) x1
  - Node `setup` / Everything's all set up! What now?: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
  - Node `charge` / You've made my day, Orion! Thanks so much!!: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Wow, no charge? You're too kind!: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; Small solar enclosure (`3720a674-e205-4950-aa1d-b10dca1885ca`) x1
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solarpunk Award (`5bba251a-d223-4e22-aa30-b65238b17516`) x1
- Processes used:
  - [`setup-solar-enclosure-200Wh`](/processes/setup-solar-enclosure-200Wh)
    - Requires: None
    - Consumes: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; Small solar enclosure (`3720a674-e205-4950-aa1d-b10dca1885ca`) x1
    - Creates: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
  - [`solar-200Wh`](/processes/solar-200Wh)
    - Requires: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200

### 2) Maintain Your Battery Pack (`energy/battery-maintenance`)
- Quest link: `/quests/energy/battery-maintenance`
- Unlock prerequisite (`requiresQuests`): `energy/solar`
- Dialogue `requiresItems` gates:
  - Node `cycle` / Battery cycled: 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`charge-battery-pack-solar`](/processes/charge-battery-pack-solar)
    - Requires: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200

### 3) Install a Larger Battery (`energy/battery-upgrade`)
- Quest link: `/quests/energy/battery-upgrade`
- Unlock prerequisite (`requiresQuests`): `energy/solar`
- Dialogue `requiresItems` gates:
  - Node `install` / All set: 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`setup-solar-enclosure-1kWh`](/processes/setup-solar-enclosure-1kWh)
    - Requires: None
    - Consumes: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 1 kWh battery pack (`7246c1c8-f22e-4d31-acd3-967f91b8626a`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; Small solar enclosure (`3720a674-e205-4950-aa1d-b10dca1885ca`) x1
    - Creates: Solar setup (1 kWh) (`8bfdedf6-79a4-4527-a43d-4d57f793ac52`) x1

### 4) Configure a Solar Charge Controller (`energy/charge-controller-setup`)
- Quest link: `/quests/energy/charge-controller-setup`
- Unlock prerequisite (`requiresQuests`): `energy/solar`
- Dialogue `requiresItems` gates:
  - Node `layout` / Polarity checked; fuse still out.: Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
  - Node `wire` / Controller powers up without sparks.: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
  - Node `configure` / Settings saved and fuse seated.: charge controller profile set (`22a50cfd-4433-4ce7-bbed-e4038338191b`) x1
  - Node `charge` / Controller shows a happy, full pack.: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `layout` / Borrow my kit: Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`configure-charge-controller-profile`](/processes/configure-charge-controller-profile)
    - Requires: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
    - Consumes: None
    - Creates: charge controller profile set (`22a50cfd-4433-4ce7-bbed-e4038338191b`) x1
  - [`harvest-200Wh-portable`](/processes/harvest-200Wh-portable)
    - Requires: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
  - [`wire-portable-solar-kit`](/processes/wire-portable-solar-kit)
    - Requires: None
    - Consumes: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
    - Creates: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1

### 5) Accumulate 1,000 dWatt (`energy/dWatt-1e3`)
- Quest link: `/quests/energy/dWatt-1e3`
- Unlock prerequisite (`requiresQuests`): `energy/charge-controller-setup`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1
- Processes used:
  - None

### 6) Accumulate 10,000 dWatt (`energy/dWatt-1e4`)
- Quest link: `/quests/energy/dWatt-1e4`
- Unlock prerequisite (`requiresQuests`): `energy/dWatt-1e3`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x10000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x3
- Processes used:
  - None

### 7) Collect a Stunning 100,000 dWatt (`energy/dWatt-1e5`)
- Quest link: `/quests/energy/dWatt-1e5`
- Unlock prerequisite (`requiresQuests`): `energy/dWatt-1e4`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x100000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x5
- Processes used:
  - None

### 8) Achieve an Astounding 1,000,000 dWatt (`energy/dWatt-1e6`)
- Quest link: `/quests/energy/dWatt-1e6`
- Unlock prerequisite (`requiresQuests`): `energy/dWatt-1e4`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1000000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x10
- Processes used:
  - None

### 9) Amass an Unbelievable 10,000,000 dWatt (`energy/dWatt-1e7`)
- Quest link: `/quests/energy/dWatt-1e7`
- Unlock prerequisite (`requiresQuests`): `energy/dWatt-1e5`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x10000000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x25
- Processes used:
  - None

### 10) Store a Colossal 100,000,000 dWatt (`energy/dWatt-1e8`)
- Quest link: `/quests/energy/dWatt-1e8`
- Unlock prerequisite (`requiresQuests`): `energy/dWatt-1e7`
- Dialogue `requiresItems` gates:
  - Node `progress` / Goal reached!: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x100000000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x50
- Processes used:
  - None

### 11) Build a Hand Crank Generator (`energy/hand-crank-generator`)
- Quest link: `/quests/energy/hand-crank-generator`
- Unlock prerequisite (`requiresQuests`): `energy/dWatt-1e3`
- Dialogue `requiresItems` gates:
  - Node `start` / I'll prep the printer and parts list.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x60; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
  - Node `print` / Prints cooled and cleaned.: 3D printed crank handle (`d715cf3d-c616-47a6-b753-ae24c87714f3`) x1; 3D printed generator housing (`3326e89c-5883-473d-a68f-3ea560093966`) x1
  - Node `prep` / Bench is staged and parts checked.: 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 12 V DC motor (`6caa08d8-815c-4a0e-9297-0fda4516659d`) x1; 3D printed crank handle (`d715cf3d-c616-47a6-b753-ae24c87714f3`) x1; 3D printed generator housing (`3326e89c-5883-473d-a68f-3ea560093966`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
  - Node `assemble` / Generator spins freely and leads are secure.: hand crank generator assembly (`afb2b5a3-60e2-4863-b2db-e4d280145128`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
  - Node `charge` / Logged 50 Wh without hot wires.: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x50
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-hand-crank-generator`](/processes/assemble-hand-crank-generator)
    - Requires: 3D printed generator housing (`3326e89c-5883-473d-a68f-3ea560093966`) x1; 3D printed crank handle (`d715cf3d-c616-47a6-b753-ae24c87714f3`) x1; 12 V DC motor (`6caa08d8-815c-4a0e-9297-0fda4516659d`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1
    - Consumes: None
    - Creates: hand crank generator assembly (`afb2b5a3-60e2-4863-b2db-e4d280145128`) x1
  - [`hand-crank-50Wh`](/processes/hand-crank-50Wh)
    - Requires: hand crank generator assembly (`afb2b5a3-60e2-4863-b2db-e4d280145128`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x50
  - [`print-crank-handle`](/processes/print-crank-handle)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x20
    - Creates: 3D printed crank handle (`d715cf3d-c616-47a6-b753-ae24c87714f3`) x1
  - [`print-generator-housing`](/processes/print-generator-housing)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x40
    - Creates: 3D printed generator housing (`3326e89c-5883-473d-a68f-3ea560093966`) x1

### 12) Charge a Device Off-Grid (`energy/offgrid-charger`)
- Quest link: `/quests/energy/offgrid-charger`
- Unlock prerequisite (`requiresQuests`): `energy/hand-crank-generator`
- Dialogue `requiresItems` gates:
  - Node `start` / Let's give it a try.: smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1
  - Node `kit` / Everything is staged and dry.: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
  - Node `wire` / Everything is tight, fused, and quiet.: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
  - Node `profile` / Profile saved; cables cool.: charge controller profile set (`22a50cfd-4433-4ce7-bbed-e4038338191b`) x1
  - Node `charge` / 200 Wh harvested and stable.: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
  - Node `phone` / Phone charged and the cable stayed cool.: off-grid phone charge log (`2a9083b7-8578-45e3-8d76-7a298462f847`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `kit` / Take the solar kit: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`charge-smartphone-offgrid`](/processes/charge-smartphone-offgrid)
    - Requires: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1; smartphone (`82577af7-6724-4cb2-8922-f7140e550145`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
    - Consumes: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x10
    - Creates: off-grid phone charge log (`2a9083b7-8578-45e3-8d76-7a298462f847`) x1
  - [`configure-charge-controller-profile`](/processes/configure-charge-controller-profile)
    - Requires: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
    - Consumes: None
    - Creates: charge controller profile set (`22a50cfd-4433-4ce7-bbed-e4038338191b`) x1
  - [`harvest-200Wh-portable`](/processes/harvest-200Wh-portable)
    - Requires: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
  - [`wire-portable-solar-kit`](/processes/wire-portable-solar-kit)
    - Requires: None
    - Consumes: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
    - Creates: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1

### 13) Test a Portable Solar Panel (`energy/portable-solar-panel`)
- Quest link: `/quests/energy/portable-solar-panel`
- Unlock prerequisite (`requiresQuests`): `energy/offgrid-charger`
- Dialogue `requiresItems` gates:
  - Node `kit` / Parts staged and safe.: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
  - Node `wire` / Cable ends are tight and fused.: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
  - Node `harvest` / Harvested 200 Wh without any hot cables.: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `kit` / Take the loaner kit: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`harvest-200Wh-portable`](/processes/harvest-200Wh-portable)
    - Requires: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200
  - [`wire-portable-solar-kit`](/processes/wire-portable-solar-kit)
    - Requires: None
    - Consumes: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1
    - Creates: portable solar kit (wired) (`8e540f94-91e0-47a1-b6ca-78e8b48aefac`) x1

### 14) Install a Power Inverter (`energy/power-inverter`)
- Quest link: `/quests/energy/power-inverter`
- Unlock prerequisite (`requiresQuests`): `energy/battery-upgrade`
- Dialogue `requiresItems` gates:
  - Node `gather` / Parts staged and vent fans are clear.: 300 W pure sine inverter (`082481a4-5e40-43e6-8542-0e64a3bd92d7`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
  - Node `mount` / Inverter mounted, fuse in, cables secure.: mounted 300 W inverter (`466cb507-6beb-4c20-967b-4f1fda1d6463`) x1
  - Node `test` / AC holds steady and nothing smells toasty.: load-tested inverter (`2e6f7453-6b8a-4e04-8ea6-1ddba490019f`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`load-test-inverter-300w`](/processes/load-test-inverter-300w)
    - Requires: mounted 300 W inverter (`466cb507-6beb-4c20-967b-4f1fda1d6463`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
    - Consumes: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x150
    - Creates: load-tested inverter (`2e6f7453-6b8a-4e04-8ea6-1ddba490019f`) x1
  - [`mount-inverter-300w`](/processes/mount-inverter-300w)
    - Requires: None
    - Consumes: 300 W pure sine inverter (`082481a4-5e40-43e6-8542-0e64a3bd92d7`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
    - Creates: mounted 300 W inverter (`466cb507-6beb-4c20-967b-4f1fda1d6463`) x1

### 15) Upgrade your solar enclosure with more capacity (`energy/solar-1kWh`)
- Quest link: `/quests/energy/solar-1kWh`
- Unlock prerequisite (`requiresQuests`): `energy/portable-solar-panel`
- Dialogue `requiresItems` gates:
  - Node `upgrades` / Alright, it's fully assembled! I assume since I didn't upgrade the panel, it's still gonna charge at the same rate? So instead of an hour, this should take roughly 5 hours?: Solar setup (1 kWh) (`8bfdedf6-79a4-4527-a43d-4d57f793ac52`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x3
- Processes used:
  - [`disassemble-enclosure-200Wh`](/processes/disassemble-enclosure-200Wh)
    - Requires: None
    - Consumes: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
    - Creates: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; Small solar enclosure (`3720a674-e205-4950-aa1d-b10dca1885ca`) x1
  - [`setup-solar-enclosure-1kWh`](/processes/setup-solar-enclosure-1kWh)
    - Requires: None
    - Consumes: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x1; 1 kWh battery pack (`7246c1c8-f22e-4d31-acd3-967f91b8626a`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; Small solar enclosure (`3720a674-e205-4950-aa1d-b10dca1885ca`) x1
    - Creates: Solar setup (1 kWh) (`8bfdedf6-79a4-4527-a43d-4d57f793ac52`) x1
  - [`solar-1000Wh`](/processes/solar-1000Wh)
    - Requires: Solar setup (1 kWh) (`8bfdedf6-79a4-4527-a43d-4d57f793ac52`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1000; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x1000

### 16) Build a Biogas Digester (`energy/biogas-digester`)
- Quest link: `/quests/energy/biogas-digester`
- Unlock prerequisite (`requiresQuests`): `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - Node `assemble` / Frame is assembled and wired: 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
  - Node `feed` / Gas production started: `dc9c057e-2bd1-4bcc-b06c-2e18344ce3e5` x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `assemble` / I'll grab the battery pack: 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - `biogas-ferment-50Wh` (process definition not found)

### 17) Accrue 1,000 dSolar (`energy/dSolar-1kW`)
- Quest link: `/quests/energy/dSolar-1kW`
- Unlock prerequisite (`requiresQuests`): `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x1000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x3
- Processes used:
  - None

### 18) Accrue 10,000 dSolar (`energy/dSolar-10kW`)
- Quest link: `/quests/energy/dSolar-10kW`
- Unlock prerequisite (`requiresQuests`): `energy/dSolar-1kW`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x10000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x6
- Processes used:
  - None

### 19) Accrue 100,000 dSolar (`energy/dSolar-100kW`)
- Quest link: `/quests/energy/dSolar-100kW`
- Unlock prerequisite (`requiresQuests`): `energy/dSolar-10kW`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x100000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: portable solar panel (`02b32152-a7b2-458e-9643-7b754c722165`) x10
- Processes used:
  - None

### 20) Build a Solar Tracker (`energy/solar-tracker`)
- Quest link: `/quests/energy/solar-tracker`
- Unlock prerequisite (`requiresQuests`): `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - Node `track` / Tracker humming: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `track` / Take the kit: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`solar-200Wh`](/processes/solar-200Wh)
    - Requires: Solar setup (200 Wh) (`e0590418-22c7-4885-9c9e-1d1cdafb78d6`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dSolar (`b02ecff5-1f7d-4247-a09d-7d6cd6bb218a`) x200

### 21) Install a Wind Turbine (`energy/wind-turbine`)
- Quest link: `/quests/energy/wind-turbine`
- Unlock prerequisite (`requiresQuests`): `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
  - Node `start` / Site is clear and gear is staged.: 500 W wind turbine (`743681a7-d2e7-465c-af07-43665079bf4d`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1; wire stripper (`6a3772b6-2550-434f-89f9-2eb53d5b139f`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
  - Node `setup` / Tower is anchored and the brake test passed.: wired 500 W wind turbine (`34540aad-4c25-4268-a158-a291283bc7a0`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
  - Node `harvest` / Logged 200 Wh and cables stayed cool.: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`charge-battery-pack-wind`](/processes/charge-battery-pack-wind)
    - Requires: wired 500 W wind turbine (`34540aad-4c25-4268-a158-a291283bc7a0`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
    - Consumes: None
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200; dWind (`d0758cf9-b5a6-46c7-b4b2-dc24c7d9df67`) x200
  - [`mount-wire-wind-turbine-500w`](/processes/mount-wire-wind-turbine-500w)
    - Requires: 500 W wind turbine (`743681a7-d2e7-465c-af07-43665079bf4d`) x1; Solar charge controller (`67a682f8-a8a4-4a14-8806-5ccd3620fd3b`) x1; 8 AWG fused cable kit (`0ccc4a37-b719-4f7c-ba73-9e4becdcd778`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1; wire stripper (`6a3772b6-2550-434f-89f9-2eb53d5b139f`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
    - Consumes: None
    - Creates: wired 500 W wind turbine (`34540aad-4c25-4268-a158-a291283bc7a0`) x1

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
