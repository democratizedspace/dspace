---
title: 'Geothermal'
slug: 'geothermal'
---

Geothermal quests build practical progression through the geothermal skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Survey for Geothermal Heat](/quests/geothermal/survey-ground-temperature)
2. [Calibrate Ground Sensor](/quests/geothermal/calibrate-ground-sensor)
3. [Check Loop Inlet Temperature](/quests/geothermal/check-loop-inlet-temp)
4. [Check Loop Outlet Temperature](/quests/geothermal/check-loop-outlet-temp)
5. [Check Loop Pressure](/quests/geothermal/check-loop-pressure)
6. [Check Loop Temperature Delta](/quests/geothermal/check-loop-temp-delta)
7. [Install Backup Thermistor](/quests/geothermal/install-backup-thermistor)
8. [Log Ground Temperature](/quests/geothermal/log-ground-temperature)
9. [Compare Depth Ground Temps](/quests/geothermal/compare-depth-ground-temps)
10. [Compare Seasonal Ground Temps](/quests/geothermal/compare-seasonal-ground-temps)
11. [Log Heat Pump Warmup](/quests/geothermal/log-heat-pump-warmup)
12. [Monitor Heat Pump Energy Use](/quests/geothermal/monitor-heat-pump-energy)
13. [Purge Air from Ground Loop](/quests/geothermal/purge-loop-air)
14. [Backflush Loop Filter](/quests/geothermal/backflush-loop-filter)
15. [Replace Faulty Thermistor](/quests/geothermal/replace-faulty-thermistor)

## 1) Survey for Geothermal Heat (`geothermal/survey-ground-temperature`)

- Quest link: [/quests/geothermal/survey-ground-temperature](/quests/geothermal/survey-ground-temperature)
- Unlock prerequisite:
    - `requiresQuests`: `energy/solar`
- Dialogue `requiresItems` gates:
    - `materials` → "I've got the tool ready." — aquarium thermometer (0–50°C) ×1
- Grants:
    - `materials` → "Thanks for the thermometer!" — aquarium thermometer (0–50°C) ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Solarpunk Award ×1
- Processes used:
    - None

## 2) Calibrate Ground Sensor (`geothermal/calibrate-ground-sensor`)

- Quest link: [/quests/geothermal/calibrate-ground-sensor](/quests/geothermal/calibrate-ground-sensor)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
    - `start` → "Safety check done, start baseline" — Arduino Uno ×1
    - `baseline` → "Captured baseline pair" — Arduino Uno ×1
    - `baseline` → "Baseline pair already logged" — Arduino Uno ×1
    - `interpret` → "Both readings are in tolerance" — Arduino Uno ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [arduino-thermistor-read](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none

## 3) Check Loop Inlet Temperature (`geothermal/check-loop-inlet-temp`)

- Quest link: [/quests/geothermal/check-loop-inlet-temp](/quests/geothermal/check-loop-inlet-temp)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
    - `start` → "Rig is on the bench." — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
    - `build` → "Rig is already built" — thermistor logging rig ×1
    - `log` → "Capture the inlet trace" — thermistor logging rig ×1, Laptop Computer ×1
    - `log` → "Trace saved" — temperature log CSV ×1
    - `plot` → "Plot the inlet run" — temperature log CSV ×1, Laptop Computer ×1
    - `plot` → "Chart reviewed" — temperature line chart ×1
    - `finish` → "Inlet trend logged" — temperature line chart ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [assemble-thermistor-logger](/processes/assemble-thermistor-logger)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: thermistor logging rig ×1
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1

## 4) Check Loop Outlet Temperature (`geothermal/check-loop-outlet-temp`)

- Quest link: [/quests/geothermal/check-loop-outlet-temp](/quests/geothermal/check-loop-outlet-temp)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/check-loop-inlet-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Rig is already staged on the outlet" — thermistor logging rig ×1, temperature log CSV ×1
    - `reposition` → "Log the outlet run" — thermistor logging rig ×1, Laptop Computer ×1
    - `reposition` → "Outlet trace captured" — temperature log CSV ×2
    - `stream` → "Publish the outlet endpoint" — thermistor logging rig ×1, temperature log CSV ×1, Raspberry Pi 5 board ×1
    - `stream` → "Endpoint is live" — live temperature JSON endpoint ×1
    - `finish` → "Outlet stream pinned" — live temperature JSON endpoint ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
    - [deploy-temperature-json-endpoint](/processes/deploy-temperature-json-endpoint)
        - Requires: thermistor logging rig ×1, temperature log CSV ×1, Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: live temperature JSON endpoint ×1

## 5) Check Loop Pressure (`geothermal/check-loop-pressure`)

- Quest link: [/quests/geothermal/check-loop-pressure](/quests/geothermal/check-loop-pressure)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/survey-ground-temperature`
- Dialogue `requiresItems` gates:
    - `measure` → "Pressure snapshot logged" — Arduino Uno ×1
    - `corrective` → "Retest snapshot ready" — Arduino Uno ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Completion requires a captured pressure snapshot plus interpretation against the 20–35 psi and <2 psi oscillation targets.
    - Out-of-range pressure must follow corrective branch (bleed air / inspect fittings) and a mandatory retest loop before finish.

## 6) Check Loop Temperature Delta (`geothermal/check-loop-temp-delta`)

- Quest link: [/quests/geothermal/check-loop-temp-delta](/quests/geothermal/check-loop-temp-delta)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/check-loop-inlet-temp`, `geothermal/check-loop-outlet-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Both probes are mounted" — thermistor logging rig ×1, live temperature JSON endpoint ×1
    - `align` → "Capture the paired trace" — thermistor logging rig ×1, Laptop Computer ×1
    - `align` → "Trace is saved" — temperature log CSV ×1
    - `plot` → "Plot both runs" — temperature log CSV ×1, Laptop Computer ×1
    - `plot` → "Plot looks clean" — temperature line chart ×1
    - `annotate` → "Add notes to the overlay" — temperature line chart ×1, Laptop Computer ×1, live temperature JSON endpoint ×1
    - `annotate` → "Notes are logged" — annotated temperature graph ×1
    - `publish` → "Push a live delta dashboard" — live temperature JSON endpoint ×1, annotated temperature graph ×1, Laptop Computer ×1
    - `publish` → "Dashboard is live" — live temperature dashboard ×1
    - `finish` → "Delta is monitored" — live temperature dashboard ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1
    - [publish-live-temperature-graph](/processes/publish-live-temperature-graph)
        - Requires: live temperature JSON endpoint ×1, annotated temperature graph ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: live temperature dashboard ×1

## 7) Install Backup Thermistor (`geothermal/install-backup-thermistor`)

- Quest link: [/quests/geothermal/install-backup-thermistor](/quests/geothermal/install-backup-thermistor)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/calibrate-ground-sensor`
- Dialogue `requiresItems` gates:
    - `materials` → "Parts staged" — Arduino Uno ×1
    - `install` → "Backup probe installed and baseline logged" — Arduino Uno ×1
    - `verify` → "Parity verified within 1.5°C" — Arduino Uno ×1
    - `rollback` → "Rollback complete, retry install" — Arduino Uno ×1
    - `finish` → "Backup thermistor validated" — Arduino Uno ×1
- Grants:
    - `materials` → "Issue Arduino Uno logger" — Arduino Uno ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [arduino-thermistor-read](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none

## 8) Log Ground Temperature (`geothermal/log-ground-temperature`)

- Quest link: [/quests/geothermal/log-ground-temperature](/quests/geothermal/log-ground-temperature)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/check-loop-pressure`
- Dialogue `requiresItems` gates:
    - `prep` → "Rig is already sealed" — thermistor logging rig ×1
    - `bury` → "Start a buried 24 h log" — thermistor logging rig ×1, Laptop Computer ×1
    - `bury` → "Baseline log exported" — temperature log CSV ×1
    - `chart` → "Plot the baseline curve" — temperature log CSV ×1, Laptop Computer ×1
    - `chart` → "Annotate weather notes" — temperature line chart ×1, Laptop Computer ×1
    - `chart` → "Baseline chart saved" — annotated temperature graph ×1
    - `finish` → "Ground curve logged" — annotated temperature graph ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [assemble-thermistor-logger](/processes/assemble-thermistor-logger)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: thermistor logging rig ×1
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1

## 9) Compare Depth Ground Temps (`geothermal/compare-depth-ground-temps`)

- Quest link: [/quests/geothermal/compare-depth-ground-temps](/quests/geothermal/compare-depth-ground-temps)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `deploy` → "Logs collected" — Arduino Uno ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [arduino-thermistor-read](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none

## 10) Compare Seasonal Ground Temps (`geothermal/compare-seasonal-ground-temps`)

- Quest link: [/quests/geothermal/compare-seasonal-ground-temps](/quests/geothermal/compare-seasonal-ground-temps)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `deploy` → "Sensor logging" — Arduino Uno ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [arduino-thermistor-read](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none

## 11) Log Heat Pump Warmup (`geothermal/log-heat-pump-warmup`)

- Quest link: [/quests/geothermal/log-heat-pump-warmup](/quests/geothermal/log-heat-pump-warmup)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `start` → "Rig and safety checks are complete" — thermistor logging rig ×1, Laptop Computer ×1
    - `stage` → "Capture the warmup trace" — thermistor logging rig ×1, Laptop Computer ×1
    - `stage` → "Warmup log exported" — temperature log CSV ×1
    - `analyze` → "Plot and inspect warmup curve" — temperature log CSV ×1, Laptop Computer ×1
    - `analyze` → "Annotate compressor ramp and settle window" — temperature line chart ×1, Laptop Computer ×1
    - `analyze` → "Curve meets threshold and annotations are saved" — annotated temperature graph ×1
    - `finish` → "Warmup benchmarked" — annotated temperature graph ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1
- QA notes:
    - Required warmup log fields are timestamp, outlet temp, ambient temp, pump mode, and compressor state.
    - Pass threshold is ≥4°C rise over 15 minutes and ≤1°C oscillation during the final 5-minute settle window.
    - Threshold misses branch into anomaly classification and mandatory corrective re-log before closure.

## 12) Monitor Heat Pump Energy Use (`geothermal/monitor-heat-pump-energy`)

- Quest link: [/quests/geothermal/monitor-heat-pump-energy](/quests/geothermal/monitor-heat-pump-energy)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `materials` → "Hardware staged" — smart plug ×1, thermistor logging rig ×1, Laptop Computer ×1
    - `capture` → "Monitoring log exported" — temperature log CSV ×1
    - `classify` → "Stable thermal trend in-band" — temperature log CSV ×1
    - `finish` → "Energy monitoring baseline complete" — temperature log CSV ×1
- Grants:
    - `materials` → "Issue smart plug" — smart plug ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - dWatt ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1

## 13) Purge Air from Ground Loop (`geothermal/purge-loop-air`)

- Quest link: [/quests/geothermal/purge-loop-air](/quests/geothermal/purge-loop-air)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/monitor-heat-pump-energy`
- Dialogue `requiresItems` gates:
    - `materials` → "Pump and hoses staged" — submersible water pump ×1
    - `baseline` → "Baseline trace saved" — temperature log CSV ×1, submersible water pump ×1
    - `purge` → "Post-purge trace saved" — temperature log CSV ×2, submersible water pump ×1
    - `verify` → "Yes, purge pass confirmed" — temperature log CSV ×2
    - `finish` → "Loop purge benchmarked" — temperature log CSV ×2
- Grants:
    - `materials` → "Issue purge pump" — submersible water pump ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1

## 14) Backflush Loop Filter (`geothermal/backflush-loop-filter`)

- Quest link: [/quests/geothermal/backflush-loop-filter](/quests/geothermal/backflush-loop-filter)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/purge-loop-air`
- Dialogue `requiresItems` gates:
    - `materials` → "I have a pump ready." — submersible water pump ×1
- Grants:
    - `materials` → "Take this pump." — submersible water pump ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 15) Replace Faulty Thermistor (`geothermal/replace-faulty-thermistor`)

- Quest link: [/quests/geothermal/replace-faulty-thermistor](/quests/geothermal/replace-faulty-thermistor)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/install-backup-thermistor`
- Dialogue `requiresItems` gates:
    - `stage` → "Spare probe and logger are ready" — Arduino Uno ×1
    - `replace` → "Capture post-replacement baseline" — Arduino Uno ×1
    - `replace` → "Baseline capture saved" — Arduino Uno ×1
    - `verify` → "Parity holds across the verification window" — Arduino Uno ×1
    - `troubleshoot` → "Corrective action done, re-run baseline" — Arduino Uno ×1
    - `finish` → "Replacement thermistor verified" — Arduino Uno ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [arduino-thermistor-read](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none
- QA notes:
    - Completion now requires post-replacement baseline capture and a 10-minute parity verification window against backup probe data.
    - Drift/dropouts branch into reseat/moisture troubleshooting with a required recapture loop before finish.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
