---
title: 'Geothermal'
slug: 'geothermal'
---

This page documents the full **Geothermal** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Survey for Geothermal Heat](/quests/geothermal/survey-ground-temperature) (`geothermal/survey-ground-temperature`)
2. [Calibrate Ground Sensor](/quests/geothermal/calibrate-ground-sensor) (`geothermal/calibrate-ground-sensor`)
3. [Check Loop Inlet Temperature](/quests/geothermal/check-loop-inlet-temp) (`geothermal/check-loop-inlet-temp`)
4. [Check Loop Outlet Temperature](/quests/geothermal/check-loop-outlet-temp) (`geothermal/check-loop-outlet-temp`)
5. [Check Loop Pressure](/quests/geothermal/check-loop-pressure) (`geothermal/check-loop-pressure`)
6. [Check Loop Temperature Delta](/quests/geothermal/check-loop-temp-delta) (`geothermal/check-loop-temp-delta`)
7. [Install Backup Thermistor](/quests/geothermal/install-backup-thermistor) (`geothermal/install-backup-thermistor`)
8. [Log Ground Temperature](/quests/geothermal/log-ground-temperature) (`geothermal/log-ground-temperature`)
9. [Compare Depth Ground Temps](/quests/geothermal/compare-depth-ground-temps) (`geothermal/compare-depth-ground-temps`)
10. [Compare Seasonal Ground Temps](/quests/geothermal/compare-seasonal-ground-temps) (`geothermal/compare-seasonal-ground-temps`)
11. [Log Heat Pump Warmup](/quests/geothermal/log-heat-pump-warmup) (`geothermal/log-heat-pump-warmup`)
12. [Monitor Heat Pump Energy Use](/quests/geothermal/monitor-heat-pump-energy) (`geothermal/monitor-heat-pump-energy`)
13. [Purge Air from Ground Loop](/quests/geothermal/purge-loop-air) (`geothermal/purge-loop-air`)
14. [Backflush Loop Filter](/quests/geothermal/backflush-loop-filter) (`geothermal/backflush-loop-filter`)
15. [Replace Faulty Thermistor](/quests/geothermal/replace-faulty-thermistor) (`geothermal/replace-faulty-thermistor`)

## Quest details

### 1) Survey for Geothermal Heat (`geothermal/survey-ground-temperature`)
- Quest link: `/quests/geothermal/survey-ground-temperature`
- Unlock prerequisite (`requiresQuests`): `energy/solar`
- Dialogue `requiresItems` gates:
  - Node `materials` / I've got the tool ready.: aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Thanks for the thermometer!: aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Quest-level `grantsItems`: None
- Rewards: Solarpunk Award (`5bba251a-d223-4e22-aa30-b65238b17516`) x1
- Processes used:
  - None

### 2) Calibrate Ground Sensor (`geothermal/calibrate-ground-sensor`)
- Quest link: `/quests/geothermal/calibrate-ground-sensor`
- Unlock prerequisite (`requiresQuests`): `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
  - Node `calibrate` / Calibration complete: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None

### 3) Check Loop Inlet Temperature (`geothermal/check-loop-inlet-temp`)
- Quest link: `/quests/geothermal/check-loop-inlet-temp`
- Unlock prerequisite (`requiresQuests`): `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
  - Node `start` / Rig is on the bench.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
  - Node `build` / Rig is already built: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - Node `log` / Capture the inlet trace: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `log` / Trace saved: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `plot` / Plot the inlet run: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `plot` / Chart reviewed: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - Node `finish` / Inlet trend logged: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-thermistor-logger`](/processes/assemble-thermistor-logger)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - [`capture-hourly-temperature-log`](/processes/capture-hourly-temperature-log)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1

### 4) Check Loop Outlet Temperature (`geothermal/check-loop-outlet-temp`)
- Quest link: `/quests/geothermal/check-loop-outlet-temp`
- Unlock prerequisite (`requiresQuests`): `geothermal/check-loop-inlet-temp`
- Dialogue `requiresItems` gates:
  - Node `start` / Rig is already staged on the outlet: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `reposition` / Log the outlet run: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `reposition` / Outlet trace captured: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `stream` / Publish the outlet endpoint: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
  - Node `stream` / Endpoint is live: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
  - Node `finish` / Outlet stream pinned: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`capture-hourly-temperature-log`](/processes/capture-hourly-temperature-log)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - [`deploy-temperature-json-endpoint`](/processes/deploy-temperature-json-endpoint)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
    - Consumes: None
    - Creates: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1

### 5) Check Loop Pressure (`geothermal/check-loop-pressure`)
- Quest link: `/quests/geothermal/check-loop-pressure`
- Unlock prerequisite (`requiresQuests`): `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
  - None
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - `pressure-gauge-read` (process definition not found)

### 6) Check Loop Temperature Delta (`geothermal/check-loop-temp-delta`)
- Quest link: `/quests/geothermal/check-loop-temp-delta`
- Unlock prerequisite (`requiresQuests`): `geothermal/check-loop-inlet-temp`, `geothermal/check-loop-outlet-temp`
- Dialogue `requiresItems` gates:
  - Node `start` / Both probes are mounted: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
  - Node `align` / Capture the paired trace: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `align` / Trace is saved: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `plot` / Plot both runs: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `plot` / Plot looks clean: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - Node `annotate` / Add notes to the overlay: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
  - Node `annotate` / Notes are logged: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
  - Node `publish` / Push a live delta dashboard: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1; annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `publish` / Dashboard is live: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1
  - Node `finish` / Delta is monitored: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`capture-hourly-temperature-log`](/processes/capture-hourly-temperature-log)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - [`publish-live-temperature-graph`](/processes/publish-live-temperature-graph)
    - Requires: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1; annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1
  - [`refine-temperature-graph`](/processes/refine-temperature-graph)
    - Requires: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1

### 7) Install Backup Thermistor (`geothermal/install-backup-thermistor`)
- Quest link: `/quests/geothermal/install-backup-thermistor`
- Unlock prerequisite (`requiresQuests`): `geothermal/calibrate-ground-sensor`
- Dialogue `requiresItems` gates:
  - Node `materials` / I've got the parts.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
  - Node `install` / Reading logged.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Here's a spare thermistor.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None

### 8) Log Ground Temperature (`geothermal/log-ground-temperature`)
- Quest link: `/quests/geothermal/log-ground-temperature`
- Unlock prerequisite (`requiresQuests`): `geothermal/check-loop-pressure`
- Dialogue `requiresItems` gates:
  - Node `prep` / Rig is already sealed: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - Node `bury` / Start a buried 24 h log: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `bury` / Baseline log exported: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `chart` / Plot the baseline curve: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `chart` / Annotate weather notes: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `chart` / Baseline chart saved: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
  - Node `finish` / Ground curve logged: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-thermistor-logger`](/processes/assemble-thermistor-logger)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - [`capture-hourly-temperature-log`](/processes/capture-hourly-temperature-log)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - [`refine-temperature-graph`](/processes/refine-temperature-graph)
    - Requires: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1

### 9) Compare Depth Ground Temps (`geothermal/compare-depth-ground-temps`)
- Quest link: `/quests/geothermal/compare-depth-ground-temps`
- Unlock prerequisite (`requiresQuests`): `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - Node `deploy` / Logs collected: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None

### 10) Compare Seasonal Ground Temps (`geothermal/compare-seasonal-ground-temps`)
- Quest link: `/quests/geothermal/compare-seasonal-ground-temps`
- Unlock prerequisite (`requiresQuests`): `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - Node `deploy` / Sensor logging: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None

### 11) Log Heat Pump Warmup (`geothermal/log-heat-pump-warmup`)
- Quest link: `/quests/geothermal/log-heat-pump-warmup`
- Unlock prerequisite (`requiresQuests`): `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - Node `start` / Rig and towels are ready: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `stage` / Capture the warmup trace: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `stage` / Trace exported: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `analyze` / Plot the warmup curve: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `analyze` / Annotate compressor ramp: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `analyze` / Curve annotated: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
  - Node `finish` / Warmup benchmarked: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`capture-hourly-temperature-log`](/processes/capture-hourly-temperature-log)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - [`refine-temperature-graph`](/processes/refine-temperature-graph)
    - Requires: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1

### 12) Monitor Heat Pump Energy Use (`geothermal/monitor-heat-pump-energy`)
- Quest link: `/quests/geothermal/monitor-heat-pump-energy`
- Unlock prerequisite (`requiresQuests`): `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - Node `materials` / I've got one ready.: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Here's the smart plug.: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
- Quest-level `grantsItems`: None
- Rewards: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1
- Processes used:
  - None

### 13) Purge Air from Ground Loop (`geothermal/purge-loop-air`)
- Quest link: `/quests/geothermal/purge-loop-air`
- Unlock prerequisite (`requiresQuests`): `geothermal/monitor-heat-pump-energy`
- Dialogue `requiresItems` gates:
  - Node `materials` / I have a pump ready.: submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Take this pump.: submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 14) Backflush Loop Filter (`geothermal/backflush-loop-filter`)
- Quest link: `/quests/geothermal/backflush-loop-filter`
- Unlock prerequisite (`requiresQuests`): `geothermal/purge-loop-air`
- Dialogue `requiresItems` gates:
  - Node `materials` / I have a pump ready.: submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Take this pump.: submersible water pump (`584ca717-4ce1-4ca1-bcd3-38272a52768a`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 15) Replace Faulty Thermistor (`geothermal/replace-faulty-thermistor`)
- Quest link: `/quests/geothermal/replace-faulty-thermistor`
- Unlock prerequisite (`requiresQuests`): `geothermal/install-backup-thermistor`
- Dialogue `requiresItems` gates:
  - Node `replace` / Probe replaced and reading logged.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None

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
