---
title: 'Programming'
slug: 'programming'
---

Programming quests build practical progression through the programming skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Set Up Temperature Logger](/quests/programming/hello-sensor)
2. [Log Temperature Data](/quests/programming/temp-logger)
3. [Compute Average Temperature](/quests/programming/avg-temp)
4. [Graph Temperature Logs](/quests/programming/graph-temp)
5. [Clean and graph your temperature logs](/quests/programming/graph-temp-data)
6. [Compute Median Temperature](/quests/programming/median-temp)
7. [Compute Moving Average Temperature](/quests/programming/moving-avg-temp)
8. [Plot Temperature Data via CLI](/quests/programming/plot-temp-cli)
9. [Compute Temperature Standard Deviation](/quests/programming/stddev-temp)
10. [Calibrate a Thermistor](/quests/programming/thermistor-calibration)
11. [Serve a Web Page](/quests/programming/web-server)
12. [Serve JSON Data](/quests/programming/json-endpoint)
13. [Serve JSON Data](/quests/programming/json-api)
14. [Accept POST Data](/quests/programming/http-post)
15. [Serve Temperature as JSON](/quests/programming/temp-json-api)
16. [Serve a live temperature graph](/quests/programming/temp-graph)
17. [Set Temperature Alert](/quests/programming/temp-alert)
18. [Email Temperature Alert](/quests/programming/temp-email)

## 1) Set Up Temperature Logger (`programming/hello-sensor`)

- Quest link: [/quests/programming/hello-sensor](/quests/programming/hello-sensor)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `bench` → "Parts are placed and powered" — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
    - `bench-fix` → "Bench is safe and stable now" — Arduino Uno ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
    - `rig` → "Logger is wired and blinking" — thermistor logging rig ×1
    - `rig-recover` → "Signal is stable; retry the rig step" — thermistor logging rig ×1
    - `log` → "CSV archived for reuse" — temperature log CSV ×1
    - `verify-log` → "Log passes QA checks" — temperature log CSV ×1, thermistor logging rig ×1
    - `log-retry` → "Re-test the replacement CSV" — temperature log CSV ×1
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
    - [assemble-thermistor-logger](/processes/assemble-thermistor-logger)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: thermistor logging rig ×1
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1

## 2) Log Temperature Data (`programming/temp-logger`)

- Quest link: [/quests/programming/temp-logger](/quests/programming/temp-logger)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
    - `wire` → "Rig is wired and sketch uploaded" — thermistor logging rig ×1
    - `log` → "CSV captured for review" — temperature log CSV ×1
    - `interpret` → "Range and cadence pass review" — temperature log CSV ×1, thermistor logging rig ×1
    - `recover` → "New CSV ready for re-test" — temperature log CSV ×2
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

## 3) Compute Average Temperature (`programming/avg-temp`)

- Quest link: [/quests/programming/avg-temp](/quests/programming/avg-temp)
- Unlock prerequisite:
    - `requiresQuests`: `programming/temp-logger`
- Dialogue `requiresItems` gates:
    - `start` → "Load the CSV" — temperature log CSV ×1
    - `prep` → "Data looks clean" — temperature line chart ×1
    - `compute` → "Averages plotted and saved" — annotated temperature graph ×1
    - `interpret` → "Average is within expected range and documented" — temperature line chart ×1, annotated temperature graph ×1
    - `retest` → "Re-test with fresh log + rebuilt graph artifacts" — temperature log CSV ×2, annotated temperature graph ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1

## 4) Graph Temperature Logs (`programming/graph-temp`)

- Quest link: [/quests/programming/graph-temp](/quests/programming/graph-temp)
- Unlock prerequisite:
    - `requiresQuests`: `programming/temp-logger`
- Dialogue `requiresItems` gates:
    - `start` → "Let's create a graph." — temperature log CSV ×1
    - `prep` → "Chart exported for review" — temperature line chart ×1
    - `interpret` → "Trend and bounds look healthy" — temperature line chart ×1
    - `triage` → "I corrected wiring and re-ran the graph" — annotated temperature graph ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1

## 5) Clean and graph your temperature logs (`programming/graph-temp-data`)

- Quest link: [/quests/programming/graph-temp-data](/quests/programming/graph-temp-data)
- Unlock prerequisite:
    - `requiresQuests`: `programming/graph-temp`
- Dialogue `requiresItems` gates:
    - `start` → "I'll stage the cleanup run." — temperature line chart ×1, temperature log CSV ×1
    - `prep` → "Annotated graph exported" — annotated temperature graph ×1
    - `interpret` → "Graph is in-range and cadence is stable" — annotated temperature graph ×1, temperature line chart ×1
    - `triage` → "Wiring corrected; rerun annotated graph" — temperature line chart ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1

## 6) Compute Median Temperature (`programming/median-temp`)

- Quest link: [/quests/programming/median-temp](/quests/programming/median-temp)
- Unlock prerequisite:
    - `requiresQuests`: `programming/avg-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Use my latest logger export" — temperature log CSV ×1
    - `collect` → "Dataset passes sanity checks" — Raspberry Pi 5 board ×1, temperature log CSV ×1
    - `repair` → "Cleaned file is ready for re-check" — temperature log CSV ×1
    - `compute` → "Median report generated" — Raspberry Pi 5 board ×1
    - `verify` → "Median is within expected range" — Raspberry Pi 5 board ×1, temperature log CSV ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 7) Compute Moving Average Temperature (`programming/moving-avg-temp`)

- Quest link: [/quests/programming/moving-avg-temp](/quests/programming/moving-avg-temp)
- Unlock prerequisite:
    - `requiresQuests`: `programming/avg-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Use the latest logger export." — temperature log CSV ×1
    - `prep` → "Baseline plot ready" — temperature line chart ×1
    - `interpret` → "Trend is smooth and in-bounds" — aquarium thermometer (0–50°C) ×1, temperature line chart ×1
    - `retest` → "Re-test corrected output" — annotated temperature graph ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1

## 8) Plot Temperature Data via CLI (`programming/plot-temp-cli`)

- Quest link: [/quests/programming/plot-temp-cli](/quests/programming/plot-temp-cli)
- Unlock prerequisite:
    - `requiresQuests`: `programming/temp-logger`
- Dialogue `requiresItems` gates:
    - `start` → "Stage the CLI run" — temperature log CSV ×1
    - `prep` → "Baseline chart exported" — temperature line chart ×1
    - `interpret` → "Plot is stable and in expected range" — temperature line chart ×1
    - `retest` → "Re-check regenerated chart" — temperature log CSV ×2, temperature line chart ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1

## 9) Compute Temperature Standard Deviation (`programming/stddev-temp`)

- Quest link: [/quests/programming/stddev-temp](/quests/programming/stddev-temp)
- Unlock prerequisite:
    - `requiresQuests`: `programming/median-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Load the latest dataset" — temperature log CSV ×1
    - `prep` → "Deviation report generated" — temperature line chart ×1
    - `interpret` → "Deviation is in expected band and documented" — temperature line chart ×1
    - `retest` → "Re-test with the new log" — temperature log CSV ×2, temperature line chart ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
        - Requires: thermistor logging rig ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: temperature log CSV ×1

## 10) Calibrate a Thermistor (`programming/thermistor-calibration`)

- Quest link: [/quests/programming/thermistor-calibration](/quests/programming/thermistor-calibration)
- Unlock prerequisite:
    - `requiresQuests`: `programming/hello-sensor`
- Dialogue `requiresItems` gates:
    - `wire` → "Hardware ready" — Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, Arduino Uno ×1
    - `rewire` → "Wiring corrected, retry calibration setup" — Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
    - `baseline` → "Baseline noted and reference stable" — Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
    - `adjust` → "Adjusted values look consistent" — Arduino Uno ×1, Thermistor (10k NTC) ×1
    - `drift` → "Retry coefficient adjustment" — Arduino Uno ×1
    - `verify` → "Calibration passes repeated verification" — Arduino Uno ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
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

## 11) Serve a Web Page (`programming/web-server`)

- Quest link: [/quests/programming/web-server](/quests/programming/web-server)
- Unlock prerequisite:
    - `requiresQuests`: `programming/hello-sensor`
- Dialogue `requiresItems` gates:
    - `start` → "I'll prep static assets and dependencies." — temperature log CSV ×1, Laptop Computer ×1
    - `prep` → "Assets ready for server launch" — temperature line chart ×1
    - `deploy` → "Service passes remote checks" — temperature line chart ×1, Raspberry Pi 5 board ×1
    - `recover` → "Patched config; re-run remote checks" — annotated temperature graph ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1

## 12) Serve JSON Data (`programming/json-endpoint`)

- Quest link: [/quests/programming/json-endpoint](/quests/programming/json-endpoint)
- Unlock prerequisite:
    - `requiresQuests`: `programming/web-server`
- Dialogue `requiresItems` gates:
    - `start` → "Plan endpoint hardening" — temperature log CSV ×1, thermistor logging rig ×1, Raspberry Pi 5 board ×1
    - `wire` → "Three clean reads captured; proceed to endpoint deploy" — thermistor logging rig ×1, Raspberry Pi 5 board ×1, temperature log CSV ×1
    - `recover-serial` → "Serial stream is stable again" — temperature log CSV ×2
    - `publish` → "Endpoint deployed; run contract checks" — live temperature JSON endpoint ×1
    - `verify` → "Both healthy and failure-mode checks pass" — live temperature JSON endpoint ×1, temperature log CSV ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [pyserial-install](/processes/pyserial-install)
        - Requires: Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: none
    - [raspberry-pi-serial-log](/processes/raspberry-pi-serial-log)
        - Requires: Arduino Uno ×1, Raspberry Pi 5 board ×1, USB Cable ×1
        - Consumes: none
        - Creates: none
    - [deploy-temperature-json-endpoint](/processes/deploy-temperature-json-endpoint)
        - Requires: thermistor logging rig ×1, temperature log CSV ×1, Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: live temperature JSON endpoint ×1

## 13) Serve JSON Data (`programming/json-api`)

- Quest link: [/quests/programming/json-api](/quests/programming/json-api)
- Unlock prerequisite:
    - `requiresQuests`: `programming/web-server`, `programming/json-endpoint`, `programming/avg-temp`
- Dialogue `requiresItems` gates:
    - `start` → "Design payload contracts" — live temperature JSON endpoint ×1, temperature log CSV ×1
    - `stats` → "Stats payload passes contract review" — annotated temperature graph ×1, temperature log CSV ×1
    - `schema-recovery` → "Schema is repaired; re-run stats validation" — temperature log CSV ×2
    - `publish` → "Dashboard and docs published" — live temperature dashboard ×1, live temperature JSON endpoint ×1
    - `verify` → "Both happy-path and stale-data checks pass" — live temperature dashboard ×1, annotated temperature graph ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [refine-temperature-graph](/processes/refine-temperature-graph)
        - Requires: temperature line chart ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: annotated temperature graph ×1
    - [publish-live-temperature-graph](/processes/publish-live-temperature-graph)
        - Requires: live temperature JSON endpoint ×1, annotated temperature graph ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: live temperature dashboard ×1

## 14) Accept POST Data (`programming/http-post`)

- Quest link: [/quests/programming/http-post](/quests/programming/http-post)
- Unlock prerequisite:
    - `requiresQuests`: `programming/json-api`
- Dialogue `requiresItems` gates:
    - `start` → "I'm ready" — live temperature JSON endpoint ×1, Raspberry Pi 5 board ×1
    - `schema` → "Server returns 201 for valid payloads" — live temperature JSON endpoint ×1
    - `recover` → "Hardening patch applied; retest" — Raspberry Pi 5 board ×1
    - `verify` → "Both tests behave as expected" — live temperature JSON endpoint ×1, Raspberry Pi 5 board ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [deploy-temperature-json-endpoint](/processes/deploy-temperature-json-endpoint)
        - Requires: thermistor logging rig ×1, temperature log CSV ×1, Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: live temperature JSON endpoint ×1

## 15) Serve Temperature as JSON (`programming/temp-json-api`)

- Quest link: [/quests/programming/temp-json-api](/quests/programming/temp-json-api)
- Unlock prerequisite:
    - `requiresQuests`: `programming/json-api`
- Dialogue `requiresItems` gates:
    - `start` → "Sounds great." — temperature log CSV ×1, thermistor logging rig ×1, Raspberry Pi 5 board ×1
    - `code` → "Endpoint streaming data; let's validate the response." — live temperature JSON endpoint ×1
    - `interpret` → "Samples stayed in-range and coherent." — live temperature JSON endpoint ×1
    - `out-of-range` → "Applied fixes; redeploy and re-test `/temp`." — Raspberry Pi 5 board ×1
- QA note: Added explicit pass/fail interpretation bounds (10°C-35°C) and an out-of-range troubleshooting loop before finish.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [deploy-temperature-json-endpoint](/processes/deploy-temperature-json-endpoint)
        - Requires: thermistor logging rig ×1, temperature log CSV ×1, Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: live temperature JSON endpoint ×1

## 16) Serve a live temperature graph (`programming/temp-graph`)

- Quest link: [/quests/programming/temp-graph](/quests/programming/temp-graph)
- Unlock prerequisite:
    - `requiresQuests`: `programming/graph-temp-data`, `programming/temp-json-api`
- Dialogue `requiresItems` gates:
    - `start` → "Show me how." — live temperature JSON endpoint ×1, annotated temperature graph ×1, Laptop Computer ×1
    - `code` → "Graph generated!" — live temperature dashboard ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [publish-live-temperature-graph](/processes/publish-live-temperature-graph)
        - Requires: live temperature JSON endpoint ×1, annotated temperature graph ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: live temperature dashboard ×1

## 17) Set Temperature Alert (`programming/temp-alert`)

- Quest link: [/quests/programming/temp-alert](/quests/programming/temp-alert)
- Unlock prerequisite:
    - `requiresQuests`: `programming/temp-graph`
- Dialogue `requiresItems` gates:
    - `start` → "I'll define the alert thresholds." — temperature log CSV ×1
    - `prep` → "Validation log captured" — temperature log CSV ×2
    - `interpret` → "Alert behavior matches policy" — aquarium thermometer (0–50°C) ×1, temperature log CSV ×1
    - `tune` → "Policy tuned; rerun alert validation" — temperature line chart ×1
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

## 18) Email Temperature Alert (`programming/temp-email`)

- Quest link: [/quests/programming/temp-email](/quests/programming/temp-email)
- Unlock prerequisite:
    - `requiresQuests`: `programming/temp-alert`
- Dialogue `requiresItems` gates:
    - `start` → "Configure alert thresholds" — temperature log CSV ×1
    - `prep` → "Email alert arrived with timestamp" — temperature log CSV ×1
    - `interpret` → "Alert timing and threshold behavior are correct" — temperature log CSV ×1
    - `retest` → "Re-validate email behavior" — temperature log CSV ×2
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

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
