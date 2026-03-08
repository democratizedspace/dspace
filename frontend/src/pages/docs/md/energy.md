---
title: 'Energy'
slug: 'energy'
---

Energy quests build practical progression through the energy skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Set up a solar panel](/quests/energy/solar)
2. [Maintain Your Battery Pack](/quests/energy/battery-maintenance)
3. [Install a Larger Battery](/quests/energy/battery-upgrade)
4. [Configure a Solar Charge Controller](/quests/energy/charge-controller-setup)
5. [Accumulate 1,000 dWatt](/quests/energy/dWatt-1e3)
6. [Accumulate 10,000 dWatt](/quests/energy/dWatt-1e4)
7. [Collect a Stunning 100,000 dWatt](/quests/energy/dWatt-1e5)
8. [Achieve an Astounding 1,000,000 dWatt](/quests/energy/dWatt-1e6)
9. [Amass an Unbelievable 10,000,000 dWatt](/quests/energy/dWatt-1e7)
10. [Store a Colossal 100,000,000 dWatt](/quests/energy/dWatt-1e8)
11. [Build a Hand Crank Generator](/quests/energy/hand-crank-generator)
12. [Charge a Device Off-Grid](/quests/energy/offgrid-charger)
13. [Test a Portable Solar Panel](/quests/energy/portable-solar-panel)
14. [Install a Power Inverter](/quests/energy/power-inverter)
15. [Upgrade your solar enclosure with more capacity](/quests/energy/solar-1kWh)
16. [Build a Biogas Digester](/quests/energy/biogas-digester)
17. [Accrue 1,000 dSolar](/quests/energy/dSolar-1kW)
18. [Accrue 10,000 dSolar](/quests/energy/dSolar-10kW)
19. [Accrue 100,000 dSolar](/quests/energy/dSolar-100kW)
20. [Build a Solar Tracker](/quests/energy/solar-tracker)
21. [Install a Wind Turbine](/quests/energy/wind-turbine)

## 1) Set up a solar panel (`energy/solar`)

- Quest link: [/quests/energy/solar](/quests/energy/solar)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `materials` → "Alright, what's next?" — portable solar panel ×1, 200 Wh battery pack ×1, Solar charge controller ×1, Small solar enclosure ×1
    - `setup` → "Everything's all set up! What now?" — Solar setup (200 Wh) ×1
    - `charge` → "Charging started. Let's verify output before we celebrate." — dSolar ×100
    - `charge-troubleshoot` → "Wiring fixed and trickle production resumed; retry full charge." — dSolar ×50
    - `verify-charge` → "Verified: 200 dSolar harvested safely." — dSolar ×200
- Grants:
    - `materials` → "Wow, no charge? You're too kind!" — portable solar panel ×1, 200 Wh battery pack ×1, Solar charge controller ×1, Small solar enclosure ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - dChat ×1, dUSD ×1000
- Processes used:
    - [setup-solar-enclosure-200Wh](/processes/setup-solar-enclosure-200Wh)
        - Requires: none
        - Consumes: portable solar panel ×1, 200 Wh battery pack ×1, Solar charge controller ×1, Small solar enclosure ×1
        - Creates: Solar setup (200 Wh) ×1
    - [solar-200Wh](/processes/solar-200Wh)
        - Requires: Solar setup (200 Wh) ×1
        - Consumes: none
        - Creates: dWatt ×200, dSolar ×200

## 2) Maintain Your Battery Pack (`energy/battery-maintenance`)

- Quest link: [/quests/energy/battery-maintenance](/quests/energy/battery-maintenance)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar`
- Dialogue `requiresItems` gates:
    - `start` → "Let's give it some exercise." — portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, digital multimeter ×1, safety goggles ×1
    - `cycle` → "Cycle complete; compare post-cycle reading to baseline." — dSolar ×200
    - `verify-log` → "Log review passed: healthy charge profile confirmed." — dSolar ×200
- Grants:
    - `start` → "Loan me a safe diagnostics + charging kit." — portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, digital multimeter ×1, safety goggles ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×1, Solarpunk Award ×1
- Processes used:
    - [measure-battery-voltage](/processes/measure-battery-voltage)
        - Requires: 200 Wh battery pack ×1, digital multimeter ×1, safety goggles ×1
        - Consumes: none
        - Creates: none
    - [charge-battery-pack-solar](/processes/charge-battery-pack-solar)
        - Requires: portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1
        - Consumes: none
        - Creates: dWatt ×200, dSolar ×200

## 3) Install a Larger Battery (`energy/battery-upgrade`)

- Quest link: [/quests/energy/battery-upgrade](/quests/energy/battery-upgrade)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar`
- Dialogue `requiresItems` gates:
    - `prep` → "Pack isolated, PPE on, and upgrade kit staged." — 200 Wh battery pack ×1
    - `install` → "Installation completed; let's verify charging behavior." — Solar setup (1 kWh) ×1
    - `troubleshoot` → "Polarity and torque rechecked; retry install." — 200 Wh battery pack ×1
    - `verify` → "Verified: storage upgrade is stable and producing." — Solar setup (1 kWh) ×1, dSolar ×200
- Grants:
    - `prep` → "Loan me the upgraded battery pack." — 200 Wh battery pack ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×1, Solarpunk Award ×1
- Processes used:
    - [setup-solar-enclosure-1kWh](/processes/setup-solar-enclosure-1kWh)
        - Requires: none
        - Consumes: portable solar panel ×1, 1 kWh battery pack ×1, Solar charge controller ×1, Small solar enclosure ×1
        - Creates: Solar setup (1 kWh) ×1
    - [solar-1000Wh](/processes/solar-1000Wh)
        - Requires: Solar setup (1 kWh) ×1
        - Consumes: none
        - Creates: dWatt ×1000, dSolar ×1000

## 4) Configure a Solar Charge Controller (`energy/charge-controller-setup`)

- Quest link: [/quests/energy/charge-controller-setup](/quests/energy/charge-controller-setup)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar`
- Dialogue `requiresItems` gates:
    - `bench-test` → "Bench test passed; proceed to full wiring." — Solar charge controller ×1
    - `layout` → "Polarity checked; fuse still out." — Solar charge controller ×1, portable solar panel ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
    - `rollback-safe` → "Rollback complete, wiring rechecked. Retry controlled power-up." — portable solar kit (wired) ×1
    - `wire` → "Controller powers up without sparks." — portable solar kit (wired) ×1
    - `configure` → "Settings saved and fuse seated." — charge controller profile set ×1
    - `profile-review` → "Profile values match. Continue to controlled charging." — charge controller profile set ×1
    - `charge` → "Controller reports stable charging. Verify before finish." — dSolar ×200
    - `verify` → "Verified: profile + charge output are both in spec." — charge controller profile set ×1, dSolar ×200
    - `monitor-recovery` → "Recovery complete. Re-run verification gate." — charge controller profile set ×1, dSolar ×200
- Grants:
    - `layout` → "Borrow my kit" — Solar charge controller ×1, portable solar panel ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×1, Solarpunk Award ×1
- Processes used:
    - [wire-portable-solar-kit](/processes/wire-portable-solar-kit)
        - Requires: none
        - Consumes: portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
        - Creates: portable solar kit (wired) ×1
    - [configure-charge-controller-profile](/processes/configure-charge-controller-profile)
        - Requires: portable solar kit (wired) ×1
        - Consumes: none
        - Creates: charge controller profile set ×1
    - [harvest-200Wh-portable](/processes/harvest-200Wh-portable)
        - Requires: portable solar kit (wired) ×1
        - Consumes: none
        - Creates: dWatt ×200, dSolar ×200

## 5) Accumulate 1,000 dWatt (`energy/dWatt-1e3`)

- Quest link: [/quests/energy/dWatt-1e3](/quests/energy/dWatt-1e3)
- Unlock prerequisite:
    - `requiresQuests`: `energy/charge-controller-setup`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dWatt ×1000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Solarpunk Award ×1
- Processes used:
    - None

## 6) Accumulate 10,000 dWatt (`energy/dWatt-1e4`)

- Quest link: [/quests/energy/dWatt-1e4](/quests/energy/dWatt-1e4)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dWatt-1e3`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dWatt ×10000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×1
- Processes used:
    - None

## 7) Collect a Stunning 100,000 dWatt (`energy/dWatt-1e5`)

- Quest link: [/quests/energy/dWatt-1e5](/quests/energy/dWatt-1e5)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dWatt-1e4`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dWatt ×100000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - None

## 8) Achieve an Astounding 1,000,000 dWatt (`energy/dWatt-1e6`)

- Quest link: [/quests/energy/dWatt-1e6](/quests/energy/dWatt-1e6)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dWatt-1e4`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dWatt ×1000000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - None

## 9) Amass an Unbelievable 10,000,000 dWatt (`energy/dWatt-1e7`)

- Quest link: [/quests/energy/dWatt-1e7](/quests/energy/dWatt-1e7)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dWatt-1e5`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dWatt ×10000000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×5
- Processes used:
    - None

## 10) Store a Colossal 100,000,000 dWatt (`energy/dWatt-1e8`)

- Quest link: [/quests/energy/dWatt-1e8](/quests/energy/dWatt-1e8)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dWatt-1e7`
- Dialogue `requiresItems` gates:
    - `progress` → "Goal reached!" — dWatt ×100000000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×25
- Processes used:
    - None

## 11) Build a Hand Crank Generator (`energy/hand-crank-generator`)

- Quest link: [/quests/energy/hand-crank-generator](/quests/energy/hand-crank-generator)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dWatt-1e3`
- Dialogue `requiresItems` gates:
    - `start` → "I'll prep the printer and parts list." — entry-level FDM 3D printer ×1, white PLA filament ×60, 8 AWG fused cable kit ×1
    - `print` → "Prints cooled and cleaned." — 3D printed crank handle ×1, 3D printed generator housing ×1
    - `prep` → "Bench is staged and parts checked." — 200 Wh battery pack ×1, 12 V DC motor ×1, 3D printed crank handle ×1, 3D printed generator housing ×1, 8 AWG fused cable kit ×1, precision screwdriver set ×1, digital multimeter ×1
    - `safety-stop` → "Safety checks passed; return to staging." — 8 AWG fused cable kit ×1, digital multimeter ×1
    - `assemble` → "Generator spins freely and leads are secure." — hand crank generator assembly ×1, 200 Wh battery pack ×1, digital multimeter ×1
    - `charge` → "Logged 50 Wh without hot wires." — dWatt ×50
    - `verify` → "Verified: 50 Wh output and stable wiring." — dWatt ×50, digital multimeter ×1
    - `recover` → "Recovery complete; retry charging." — hand crank generator assembly ×1, 200 Wh battery pack ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×1
- Processes used:
    - [print-crank-handle](/processes/print-crank-handle)
        - Requires: entry-level FDM 3D printer ×1
        - Consumes: white PLA filament ×20
        - Creates: 3D printed crank handle ×1
    - [print-generator-housing](/processes/print-generator-housing)
        - Requires: entry-level FDM 3D printer ×1
        - Consumes: white PLA filament ×40
        - Creates: 3D printed generator housing ×1
    - [assemble-hand-crank-generator](/processes/assemble-hand-crank-generator)
        - Requires: 3D printed generator housing ×1, 3D printed crank handle ×1, 12 V DC motor ×1, 8 AWG fused cable kit ×1, precision screwdriver set ×1
        - Consumes: none
        - Creates: hand crank generator assembly ×1
    - [hand-crank-50Wh](/processes/hand-crank-50Wh)
        - Requires: hand crank generator assembly ×1, 200 Wh battery pack ×1, digital multimeter ×1
        - Consumes: none
        - Creates: dWatt ×50

## 12) Charge a Device Off-Grid (`energy/offgrid-charger`)

- Quest link: [/quests/energy/offgrid-charger](/quests/energy/offgrid-charger)
- Unlock prerequisite:
    - `requiresQuests`: `energy/hand-crank-generator`
- Dialogue `requiresItems` gates:
    - `start` → "Let's give it a try." — smartphone ×1
    - `kit` → "Everything is staged and dry." — portable solar panel ×1, 200 Wh battery pack ×1, Solar charge controller ×1, USB Cable ×1, 8 AWG fused cable kit ×1
    - `precheck` → "Run a direct-sun setup and monitor cable temperature every 5 minutes." — 8 AWG fused cable kit ×1
    - `precheck` → "Start in partial shade for a conservative ramp-up, then re-aim after a stability check." — 8 AWG fused cable kit ×1
    - `wire` → "Everything is tight, fused, and quiet." — portable solar kit (wired) ×1
    - `profile` → "Profile saved; run an audit before charging." — charge controller profile set ×1
    - `profile-audit` → "Audit passed. Begin energy harvest." — charge controller profile set ×1
    - `charge` → "200 Wh harvested and stable." — dSolar ×200
    - `phone` → "Phone charged and the cable stayed cool." — off-grid phone charge log ×1
- Grants:
    - `kit` → "Take the solar kit" — portable solar panel ×1, 200 Wh battery pack ×1, Solar charge controller ×1, USB Cable ×1, 8 AWG fused cable kit ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - dWatt ×1
- Processes used:
    - [wire-portable-solar-kit](/processes/wire-portable-solar-kit)
        - Requires: none
        - Consumes: portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
        - Creates: portable solar kit (wired) ×1
    - [configure-charge-controller-profile](/processes/configure-charge-controller-profile)
        - Requires: portable solar kit (wired) ×1
        - Consumes: none
        - Creates: charge controller profile set ×1
    - [harvest-200Wh-portable](/processes/harvest-200Wh-portable)
        - Requires: portable solar kit (wired) ×1
        - Consumes: none
        - Creates: dWatt ×200, dSolar ×200
    - [charge-smartphone-offgrid](/processes/charge-smartphone-offgrid)
        - Requires: portable solar kit (wired) ×1, smartphone ×1, USB Cable ×1
        - Consumes: dWatt ×10
        - Creates: off-grid phone charge log ×1

## 13) Test a Portable Solar Panel (`energy/portable-solar-panel`)

- Quest link: [/quests/energy/portable-solar-panel](/quests/energy/portable-solar-panel)
- Unlock prerequisite:
    - `requiresQuests`: `energy/offgrid-charger`
- Dialogue `requiresItems` gates:
    - `kit` → "Parts staged and safe." — portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
    - `site-check` → "Track the sun for higher output and run frequent thermal checks." — 8 AWG fused cable kit ×1
    - `site-check` → "Use a conservative angle to prioritize cable cooling and stable voltage." — 8 AWG fused cable kit ×1
    - `wire` → "Cable ends are tight and fused." — portable solar kit (wired) ×1
    - `inspect-terminals` → "Inspection passed. Begin harvest." — portable solar kit (wired) ×1
    - `harvest` → "Harvested 200 Wh without any hot cables." — dSolar ×200
    - `verify` → "Verification complete. Pack down safely." — portable solar kit (wired) ×1, dSolar ×200
- Grants:
    - `kit` → "Take the loaner kit" — portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×1
- Processes used:
    - [wire-portable-solar-kit](/processes/wire-portable-solar-kit)
        - Requires: none
        - Consumes: portable solar panel ×1, Solar charge controller ×1, 200 Wh battery pack ×1, 8 AWG fused cable kit ×1
        - Creates: portable solar kit (wired) ×1
    - [harvest-200Wh-portable](/processes/harvest-200Wh-portable)
        - Requires: portable solar kit (wired) ×1
        - Consumes: none
        - Creates: dWatt ×200, dSolar ×200

## 14) Install a Power Inverter (`energy/power-inverter`)

- Quest link: [/quests/energy/power-inverter](/quests/energy/power-inverter)
- Unlock prerequisite:
    - `requiresQuests`: `energy/battery-upgrade`
- Dialogue `requiresItems` gates:
    - `start` → "I'm ready." — safety goggles ×1
    - `gather` → "Parts staged and vent fans are clear." — 300 W pure sine inverter ×1, 8 AWG fused cable kit ×1, 200 Wh battery pack ×1, digital multimeter ×1
    - `lockout` → "Lockout complete; return to staging." — digital multimeter ×1
    - `mount` → "Inverter mounted, fuse in, cables secure." — mounted 300 W inverter ×1
    - `verify-mount` → "Mount verification passed; proceed to load test." — mounted 300 W inverter ×1, digital multimeter ×1
    - `rollback` → "Rollback complete; re-run installation." — digital multimeter ×1
    - `test` → "AC holds steady and nothing smells toasty." — load-tested inverter ×1
    - `verify-output` → "Verification run passed with stable output." — load-tested inverter ×1, digital multimeter ×1
    - `recover` → "Recovery complete; re-run load test." — mounted 300 W inverter ×1, digital multimeter ×1
- QA note: `rollback` intentionally does not re-require the consumed 8 AWG cable kit so recovery cannot soft-lock after `mount-inverter-300w` consumption.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dWatt ×1
- Processes used:
    - [mount-inverter-300w](/processes/mount-inverter-300w)
        - Requires: none
        - Consumes: 300 W pure sine inverter ×1, 8 AWG fused cable kit ×1, 200 Wh battery pack ×1
        - Creates: mounted 300 W inverter ×1
    - [load-test-inverter-300w](/processes/load-test-inverter-300w)
        - Requires: mounted 300 W inverter ×1, digital multimeter ×1
        - Consumes: dWatt ×150
        - Creates: load-tested inverter ×1

## 15) Upgrade your solar enclosure with more capacity (`energy/solar-1kWh`)

- Quest link: [/quests/energy/solar-1kWh](/quests/energy/solar-1kWh)
- Unlock prerequisite:
    - `requiresQuests`: `energy/portable-solar-panel`
- Dialogue `requiresItems` gates:
    - `upgrades` → "Alright, it's fully assembled! I assume since I didn't upgrade the panel, it's still gonna charge at the same rate? So instead of an hour, this should take roughly 5 hours?" — Solar setup (1 kWh) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Solarpunk Award ×1
- Processes used:
    - [disassemble-enclosure-200Wh](/processes/disassemble-enclosure-200Wh)
        - Requires: none
        - Consumes: Solar setup (200 Wh) ×1
        - Creates: portable solar panel ×1, 200 Wh battery pack ×1, Solar charge controller ×1, Small solar enclosure ×1
    - [setup-solar-enclosure-1kWh](/processes/setup-solar-enclosure-1kWh)
        - Requires: none
        - Consumes: portable solar panel ×1, 1 kWh battery pack ×1, Solar charge controller ×1, Small solar enclosure ×1
        - Creates: Solar setup (1 kWh) ×1
    - [solar-1000Wh](/processes/solar-1000Wh)
        - Requires: Solar setup (1 kWh) ×1
        - Consumes: none
        - Creates: dWatt ×1000, dSolar ×1000

## 16) Build a Biogas Digester (`energy/biogas-digester`)

- Quest link: [/quests/energy/biogas-digester](/quests/energy/biogas-digester)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
    - `safety-stop` → "Seal is stable again; resume fermentation." — 200 Wh battery pack ×1
    - `verify` → "Verified: output + safety log both pass." — dWatt ×50
- Grants:
    - `assemble` → "I'll grab the battery pack." — 200 Wh battery pack ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - [build-biogas-digester-small-scale](/processes/build-biogas-digester-small-scale)
        - Requires: 200 Wh battery pack ×1
        - Consumes: none
        - Creates: none
    - [ferment-biogas-digester-batch](/processes/ferment-biogas-digester-batch)
        - Requires: 200 Wh battery pack ×1
        - Consumes: none
        - Creates: dWatt ×80

## 17) Accrue 1,000 dSolar (`energy/dSolar-1kW`)

- Quest link: [/quests/energy/dSolar-1kW](/quests/energy/dSolar-1kW)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dSolar ×1000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - None

## 18) Accrue 10,000 dSolar (`energy/dSolar-10kW`)

- Quest link: [/quests/energy/dSolar-10kW](/quests/energy/dSolar-10kW)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dSolar-1kW`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dSolar ×10000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - None

## 19) Accrue 100,000 dSolar (`energy/dSolar-100kW`)

- Quest link: [/quests/energy/dSolar-100kW](/quests/energy/dSolar-100kW)
- Unlock prerequisite:
    - `requiresQuests`: `energy/dSolar-10kW`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — dSolar ×100000
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×6
- Processes used:
    - None

## 20) Build a Solar Tracker (`energy/solar-tracker`)

- Quest link: [/quests/energy/solar-tracker](/quests/energy/solar-tracker)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
    - `prep` → "Base is staged; build the tracker drive and controls." — Solar setup (200 Wh) ×1
    - `build` → "Assembly complete; start tracking cycles." — Solar tracking unit ×1
    - `track` → "Run complete; verify output and mechanical stability." — Solar tracking unit ×1, dSolar ×200
    - `recover` → "Mechanical issue fixed; rerun assembly checks." — Solar setup (200 Wh) ×1
    - `recover` → "Minor issue fixed; retry the tracking run." — Solar setup (200 Wh) ×1
    - `verify` → "Verified: tracker is productive and safe." — Solar tracking unit ×1, dSolar ×200
- Grants:
    - `prep` → "Take the 200 Wh kit." — Solar setup (200 Wh) ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - [assemble-solar-tracking-unit](/processes/assemble-solar-tracking-unit)
        - Requires: Solar setup (200 Wh) ×1, Arduino Uno ×1, NEMA 17 stepper motor pair ×1, aluminum extrusion rail kit ×1
        - Consumes: none
        - Creates: Solar tracking unit ×1
    - [solar-200Wh](/processes/solar-200Wh)
        - Requires: Solar tracking unit ×1
        - Consumes: none
        - Creates: dWatt ×200, dSolar ×200

## 21) Install a Wind Turbine (`energy/wind-turbine`)

- Quest link: [/quests/energy/wind-turbine](/quests/energy/wind-turbine)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar-1kWh`
- Dialogue `requiresItems` gates:
    - `start` → "Site is clear and gear is staged." — 500 W wind turbine ×1, Solar charge controller ×1, 8 AWG fused cable kit ×1, tape measure ×1, wire stripper ×1, wire cutters ×1, digital multimeter ×1, 200 Wh battery pack ×1
    - `safety-stop` → "Safety conditions restored; restart install flow." — digital multimeter ×1
    - `setup` → "Tower is anchored and the brake test passed." — wired 500 W wind turbine ×1, 200 Wh battery pack ×1
    - `verify-brake` → "Verification passed; proceed to harvesting." — wired 500 W wind turbine ×1, digital multimeter ×1
    - `recover` → "Recovery complete; retry setup." — tape measure ×1, digital multimeter ×1
    - `harvest` → "Logged 200 Wh and cables stayed cool." — dWatt ×200
    - `verify-output` → "Verified: output stable and tower secure." — dWatt ×200, wired 500 W wind turbine ×1
    - `gust-recover` → "Recovery complete; retry wind harvest." — wired 500 W wind turbine ×1, digital multimeter ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - portable solar panel ×3
- Processes used:
    - [mount-wire-wind-turbine-500w](/processes/mount-wire-wind-turbine-500w)
        - Requires: 500 W wind turbine ×1, Solar charge controller ×1, 8 AWG fused cable kit ×1, tape measure ×1, wire stripper ×1, wire cutters ×1, digital multimeter ×1
        - Consumes: none
        - Creates: wired 500 W wind turbine ×1
    - [charge-battery-pack-wind](/processes/charge-battery-pack-wind)
        - Requires: wired 500 W wind turbine ×1, 200 Wh battery pack ×1
        - Consumes: none
        - Creates: dWatt ×200, dWind ×200

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
