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
    - `safety` → "Safety check complete and thermometer staged." — aquarium thermometer (0–50°C) ×1
    - `measure` → "Capture a timestamped baseline run" — thermistor logging rig ×1, Laptop Computer ×1
    - `measure` → "Seal the three-point baseline log." — aquarium thermometer (0–50°C) ×1
    - `measure` → "Readings recorded and stable near 10-14°C." — temperature log CSV ×1, aquarium thermometer (0–50°C) ×1
    - `interpret` → "Baseline accepted and logged." — temperature log CSV ×1, aquarium thermometer (0–50°C) ×1
- Grants:
    - `safety` → "Issue me the ground thermometer." — aquarium thermometer (0–50°C) ×1
    - `measure` → "Seal the three-point baseline log." — temperature log CSV ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Solarpunk Award ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
- QA notes:
    - Added explicit safety-first staging and a three-point measurement interpretation gate before finish.
    - Added an operational safety lockout in troubleshooting so circulator vibration cannot contaminate retest measurements.

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
    - `evaluate` → "Yes, inlet is in range and stable" — temperature line chart ×1
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
- QA notes:
    - Added an interpretation gate with explicit pass bounds (3-9°C and within ±1°C oscillation) before finish unlocks.
    - Out-of-range readings branch into corrective reseat/re-bleed actions and require a full re-log loop.

## 4) Check Loop Outlet Temperature (`geothermal/check-loop-outlet-temp`)

- Quest link: [/quests/geothermal/check-loop-outlet-temp](/quests/geothermal/check-loop-outlet-temp)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/check-loop-inlet-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Rig is already staged on the outlet" — thermistor logging rig ×1, temperature log CSV ×1
    - `reposition` → "Log the outlet run" — thermistor logging rig ×1, Laptop Computer ×1
    - `reposition` → "Outlet trace captured" — temperature log CSV ×2
    - `reposition-retest` → "Log corrective outlet run" — thermistor logging rig ×1, Laptop Computer ×1
    - `reposition-retest` → "Corrective trace captured" — temperature log CSV ×3
    - `interpret` → "Trace is in range and stable" — temperature log CSV ×2
    - `interpret-retest` → "Corrective trace is now stable and in range" — temperature log CSV ×3
    - `stream` → "Publish the outlet endpoint" — thermistor logging rig ×1, temperature log CSV ×1, Raspberry Pi 5 board ×1
    - `stream` → "Endpoint is live" — live temperature JSON endpoint ×1
    - `finish` → "Outlet stream validated" — live temperature JSON endpoint ×1
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
- QA notes:
    - Added an interpretation node that enforces 28-45°C and ±2°C drift acceptance thresholds before publish/finish.
    - Added a corrective reseat/dry/bleed loop that routes through a dedicated retest capture + interpretation path before publish can resume.

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
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
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
    - `publish` → "Dashboard is live, interpret delta stability" — live temperature dashboard ×1
    - `interpret` → "Delta stayed stable and in range" — live temperature dashboard ×1
    - `retest` → "Post-correction trace logged" — temperature log CSV ×3
    - `interpret-retest` → "Corrective trace passed" — temperature log CSV ×3, live temperature dashboard ×1
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

- QA notes:
    - Added explicit interpretation bounds (3-8°C delta and ±1.5°C drift) before finish can unlock.
    - Added corrective maintenance and mandatory retest loop that requires fresh logging evidence before re-interpretation.

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
    - `evaluate` → "Yes, baseline is stable and explained" — annotated temperature graph ×1
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
- QA notes:
    - Added an interpretation gate that checks overnight drift (±1.5°C) and requires anomaly explanations before finish.
    - Unexplained spikes route through a correction branch (probe-depth reseat + soil repack) and a mandatory re-capture loop.

## 9) Compare Depth Ground Temps (`geothermal/compare-depth-ground-temps`)

- Quest link: [/quests/geothermal/compare-depth-ground-temps](/quests/geothermal/compare-depth-ground-temps)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `start` → "Run setup checklist." — thermistor logging rig ×1
    - `stage` → "Capture a paired depth log" — thermistor logging rig ×1, Laptop Computer ×1
    - `stage` → "Paired log exported" — temperature log CSV ×1
    - `plot` → "Plot the depth comparison" — temperature log CSV ×1, Laptop Computer ×1
    - `plot` → "Chart ready for interpretation" — temperature line chart ×1
    - `interpret` → "Annotate accepted spread and archive evidence" — temperature line chart ×1, Laptop Computer ×1
    - `interpret` → "Spread confirmed and annotated" — annotated temperature graph ×1
    - `stage-retest` → "Capture corrective paired depth log" — thermistor logging rig ×1, Laptop Computer ×1
    - `stage-retest` → "Corrective paired log exported" — temperature log CSV ×2
    - `plot-retest` → "Plot corrective depth comparison" — temperature log CSV ×2, Laptop Computer ×1
    - `plot-retest` → "Corrective chart ready for interpretation" — temperature line chart ×2
    - `interpret-retest` → "Annotate corrected spread and archive evidence" — temperature line chart ×2, Laptop Computer ×1
    - `interpret-retest` → "Corrected spread confirmed and annotated" — annotated temperature graph ×2
    - `finish` → "Depth survey validated" — annotated temperature graph ×1
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
    - Added explicit pass criteria (deep trace within ±1.5°C while shallow trace swings more) before finish unlock.
    - Added corrective branch for crossed/noisy curves that now enforces a fresh log + re-plot + re-annotation cycle before completion.

## 10) Compare Seasonal Ground Temps (`geothermal/compare-seasonal-ground-temps`)

- Quest link: [/quests/geothermal/compare-seasonal-ground-temps](/quests/geothermal/compare-seasonal-ground-temps)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `safety` → "Safety checks complete and depth marker fixed" — aquarium thermometer (0–50°C) ×1
    - `baseline` → "Capture seasonal baseline trace" — thermistor logging rig ×1, Laptop Computer ×1
    - `baseline` → "Baseline trace logged" — temperature log CSV ×1
    - `compare` → "Capture current-season trace" — thermistor logging rig ×1, Laptop Computer ×1
    - `compare` → "Seasonal comparison dataset ready" — temperature log CSV ×2
    - `interpret` → "Seasonal drift is within bounds" — temperature log CSV ×2
    - `retest` → "Capture corrected seasonal trace" — thermistor logging rig ×1, Laptop Computer ×1
    - `retest` → "Corrected trace logged" — temperature log CSV ×4
    - `interpret-retest` → "Corrected dataset passed" — temperature log CSV ×4
    - `finish` → "Seasonal comparison validated" — temperature log CSV ×2
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
- QA notes:
    - Added baseline and current-season evidence captures at fixed depth before interpretation.
    - Added explicit seasonal pass/fail thresholds (±4°C seasonal delta, ±1.5°C short-term variance).
    - Added corrective reseat and repeat-until-pass retest loop for unstable readings.

## 11) Log Heat Pump Warmup (`geothermal/log-heat-pump-warmup`)

- Quest link: [/quests/geothermal/log-heat-pump-warmup](/quests/geothermal/log-heat-pump-warmup)
- Unlock prerequisite:
    - `requiresQuests`: `geothermal/log-ground-temperature`
- Dialogue `requiresItems` gates:
    - `start` → "Rig and safety checks are complete" — thermistor logging rig ×1, Laptop Computer ×1
    - `stage` → "Capture warmup trace" — thermistor logging rig ×1, Laptop Computer ×1
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
    - `materials` → "Pump and hose routing staged" — submersible water pump ×1
    - `baseline` → "Baseline trace saved" — temperature log CSV ×1, submersible water pump ×1
    - `flush` → "Post-backflush trace saved" — temperature log CSV ×2, submersible water pump ×1
    - `verify` → "Yes, flow is stable now" — temperature log CSV ×2
    - `finish` → "Backflush benchmark logged" — temperature log CSV ×2
- Grants:
    - `materials` → "Issue backflush pump" — submersible water pump ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1
- QA notes:
    - Completion now requires pre/post evidence (two temperature log CSV artifacts) and an explicit flow-stability verification decision.
    - Failed verification routes into a recovery branch (mesh inspection + O-ring reseat) before re-running the flush path.

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
