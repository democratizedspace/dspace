---
title: 'Geothermal'
slug: 'geothermal'
---

Geothermal quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Survey for Geothermal Heat (`geothermal/survey-ground-temperature`)

- Quest link: [/quests/geothermal/survey-ground-temperature](/quests/geothermal/survey-ground-temperature)
- Unlock prerequisite:
  - `energy/solar`
- Dialogue `requiresItems` gates:
  - `materials` → "I've got the tool ready."
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Thanks for the thermometer!"
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5bba251a-d223-4e22-aa30-b65238b17516 ×1
- Processes used:
  - None

---

## 2) Calibrate Ground Sensor (`geothermal/calibrate-ground-sensor`)

- Quest link: [/quests/geothermal/calibrate-ground-sensor](/quests/geothermal/calibrate-ground-sensor)
- Unlock prerequisite:
  - `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
  - `calibrate` → "Calibration complete"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 3) Check Loop Inlet Temperature (`geothermal/check-loop-inlet-temp`)

- Quest link: [/quests/geothermal/check-loop-inlet-temp](/quests/geothermal/check-loop-inlet-temp)
- Unlock prerequisite:
  - `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
  - `start` → "Rig is on the bench."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×4
    - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
  - `build` → "Rig is already built"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
  - `log` → "Capture the inlet trace"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `log` → "Trace saved"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `plot` → "Plot the inlet run"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `plot` → "Chart reviewed"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - `finish` → "Inlet trend logged"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1

---

## 4) Check Loop Outlet Temperature (`geothermal/check-loop-outlet-temp`)

- Quest link: [/quests/geothermal/check-loop-outlet-temp](/quests/geothermal/check-loop-outlet-temp)
- Unlock prerequisite:
  - `geothermal/check-loop-inlet-temp`
- Dialogue `requiresItems` gates:
  - `start` → "Rig is already staged on the outlet"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `reposition` → "Log the outlet run"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `reposition` → "Outlet trace captured"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `stream` → "Publish the outlet endpoint"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
  - `stream` → "Endpoint is live"
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
  - `finish` → "Outlet stream pinned"
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - [deploy-temperature-json-endpoint](/processes/deploy-temperature-json-endpoint)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
      - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
    - Consumes:
      - None
    - Creates:
      - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1

---

## 5) Check Loop Pressure (`geothermal/check-loop-pressure`)

- Quest link: [/quests/geothermal/check-loop-pressure](/quests/geothermal/check-loop-pressure)
- Unlock prerequisite:
  - `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 6) Check Loop Temperature Delta (`geothermal/check-loop-temp-delta`)

- Quest link: [/quests/geothermal/check-loop-temp-delta](/quests/geothermal/check-loop-temp-delta)
- Unlock prerequisite:
  - `geothermal/check-loop-inlet-temp`
  - `geothermal/check-loop-outlet-temp`
- Dialogue `requiresItems` gates:
  - `start` → "Both probes are mounted"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
  - `align` → "Capture the paired trace"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `align` → "Trace is saved"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `plot` → "Plot both runs"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `plot` → "Plot looks clean"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - `annotate` → "Add notes to the overlay"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
  - `annotate` → "Notes are logged"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
  - `publish` → "Push a live delta dashboard"
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `publish` → "Dashboard is live"
    - c377a2ff-1391-4ad8-a150-1e4531067406 ×1
  - `finish` → "Delta is monitored"
    - c377a2ff-1391-4ad8-a150-1e4531067406 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - [publish-live-temperature-graph](/processes/publish-live-temperature-graph)
    - Requires:
      - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
      - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - c377a2ff-1391-4ad8-a150-1e4531067406 ×1
  - [refine-temperature-graph](/processes/refine-temperature-graph)
    - Requires:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1

---

## 7) Install Backup Thermistor (`geothermal/install-backup-thermistor`)

- Quest link: [/quests/geothermal/install-backup-thermistor](/quests/geothermal/install-backup-thermistor)
- Unlock prerequisite:
  - `geothermal/calibrate-ground-sensor`
- Dialogue `requiresItems` gates:
  - `materials` → "I've got the parts."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
  - `install` → "Reading logged."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Here's a spare thermistor."
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 8) Log Ground Temperature (`geothermal/log-ground-temperature`)

- Quest link: [/quests/geothermal/log-ground-temperature](/quests/geothermal/log-ground-temperature)
- Unlock prerequisite:
  - `geothermal/check-loop-pressure`
- Dialogue `requiresItems` gates:
  - `prep` → "Rig is already sealed"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
  - `bury` → "Start a buried 24 h log"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `bury` → "Baseline log exported"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `chart` → "Plot the baseline curve"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `chart` → "Annotate weather notes"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `chart` → "Baseline chart saved"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
  - `finish` → "Ground curve logged"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - [refine-temperature-graph](/processes/refine-temperature-graph)
    - Requires:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1

---

## 9) Compare Depth Ground Temps (`geothermal/compare-depth-ground-temps`)

- Quest link: [/quests/geothermal/compare-depth-ground-temps](/quests/geothermal/compare-depth-ground-temps)
- Unlock prerequisite:
  - `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - `deploy` → "Logs collected"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 10) Compare Seasonal Ground Temps (`geothermal/compare-seasonal-ground-temps`)

- Quest link: [/quests/geothermal/compare-seasonal-ground-temps](/quests/geothermal/compare-seasonal-ground-temps)
- Unlock prerequisite:
  - `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - `deploy` → "Sensor logging"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 11) Log Heat Pump Warmup (`geothermal/log-heat-pump-warmup`)

- Quest link: [/quests/geothermal/log-heat-pump-warmup](/quests/geothermal/log-heat-pump-warmup)
- Unlock prerequisite:
  - `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - `start` → "Rig and towels are ready"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `stage` → "Capture the warmup trace"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `stage` → "Trace exported"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `analyze` → "Plot the warmup curve"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `analyze` → "Annotate compressor ramp"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `analyze` → "Curve annotated"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
  - `finish` → "Warmup benchmarked"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - [refine-temperature-graph](/processes/refine-temperature-graph)
    - Requires:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1

---

## 12) Monitor Heat Pump Energy Use (`geothermal/monitor-heat-pump-energy`)

- Quest link: [/quests/geothermal/monitor-heat-pump-energy](/quests/geothermal/monitor-heat-pump-energy)
- Unlock prerequisite:
  - `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
  - `materials` → "I've got one ready."
    - a5395e29-1862-4eb7-8517-5d161635e032 ×1
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Here's the smart plug."
      - a5395e29-1862-4eb7-8517-5d161635e032 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1
- Processes used:
  - None

---

## 13) Purge Air from Ground Loop (`geothermal/purge-loop-air`)

- Quest link: [/quests/geothermal/purge-loop-air](/quests/geothermal/purge-loop-air)
- Unlock prerequisite:
  - `geothermal/monitor-heat-pump-energy`
- Dialogue `requiresItems` gates:
  - `materials` → "I have a pump ready."
    - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Take this pump."
      - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 14) Backflush Loop Filter (`geothermal/backflush-loop-filter`)

- Quest link: [/quests/geothermal/backflush-loop-filter](/quests/geothermal/backflush-loop-filter)
- Unlock prerequisite:
  - `geothermal/purge-loop-air`
- Dialogue `requiresItems` gates:
  - `materials` → "I have a pump ready."
    - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Take this pump."
      - 584ca717-4ce1-4ca1-bcd3-38272a52768a ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 15) Replace Faulty Thermistor (`geothermal/replace-faulty-thermistor`)

- Quest link: [/quests/geothermal/replace-faulty-thermistor](/quests/geothermal/replace-faulty-thermistor)
- Unlock prerequisite:
  - `geothermal/install-backup-thermistor`
- Dialogue `requiresItems` gates:
  - `replace` → "Probe replaced and reading logged."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## QA flow notes

- Cross-quest dependencies:
  - `geothermal/survey-ground-temperature` depends on external quests: `energy/solar`.
- Progression integrity checks:
  - `geothermal/survey-ground-temperature`: verify prerequisite completion and inventory gates.
  - `geothermal/calibrate-ground-sensor`: verify prerequisite completion and inventory gates.
  - `geothermal/check-loop-inlet-temp`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×4).
  - `geothermal/check-loop-outlet-temp`: verify prerequisite completion and inventory gates.
  - `geothermal/check-loop-pressure`: verify prerequisite completion and inventory gates.
  - `geothermal/check-loop-temp-delta`: verify prerequisite completion and inventory gates.
  - `geothermal/install-backup-thermistor`: verify prerequisite completion and inventory gates.
  - `geothermal/log-ground-temperature`: verify prerequisite completion and inventory gates.
  - `geothermal/compare-depth-ground-temps`: verify prerequisite completion and inventory gates (notable count gates: 72b4448e-27d9-4746-bd3a-967ff13f501b ×2).
  - `geothermal/compare-seasonal-ground-temps`: verify prerequisite completion and inventory gates.
  - `geothermal/log-heat-pump-warmup`: verify prerequisite completion and inventory gates.
  - `geothermal/monitor-heat-pump-energy`: verify prerequisite completion and inventory gates.
  - `geothermal/purge-loop-air`: verify prerequisite completion and inventory gates.
  - `geothermal/backflush-loop-filter`: verify prerequisite completion and inventory gates.
  - `geothermal/replace-faulty-thermistor`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
