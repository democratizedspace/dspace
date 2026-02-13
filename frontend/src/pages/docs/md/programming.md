---
title: 'Programming'
slug: 'programming'
---

Programming quests build practical progression through the programming skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Log Temperature Data](/quests/programming/hello-sensor)
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

## 1) Log Temperature Data (`programming/hello-sensor`)

- Quest link: [/quests/programming/hello-sensor](/quests/programming/hello-sensor)
- Unlock prerequisite:
  - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `bench` → "Parts are placed and powered" — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
  - `rig` → "Logger is wired and blinking" — thermistor logging rig ×1
  - `log` → "CSV archived for reuse" — temperature log CSV ×1
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
  - `log` → "CSV saved" — temperature log CSV ×1
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

## 4) Graph Temperature Logs (`programming/graph-temp`)

- Quest link: [/quests/programming/graph-temp](/quests/programming/graph-temp)
- Unlock prerequisite:
  - `requiresQuests`: `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - `start` → "Let's create a graph." — temperature log CSV ×1
  - `prep` → "My chart looks great!" — temperature line chart ×1
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

## 5) Clean and graph your temperature logs (`programming/graph-temp-data`)

- Quest link: [/quests/programming/graph-temp-data](/quests/programming/graph-temp-data)
- Unlock prerequisite:
  - `requiresQuests`: `programming/graph-temp`
- Dialogue `requiresItems` gates:
  - `start` → "Show me how." — temperature line chart ×1
  - `script` → "Graph generated!" — annotated temperature graph ×1
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

## 6) Compute Median Temperature (`programming/median-temp`)

- Quest link: [/quests/programming/median-temp](/quests/programming/median-temp)
- Unlock prerequisite:
  - `requiresQuests`: `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - `code` → "Median calculated!" — Raspberry Pi 5 board ×1
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
  - `code` → "Moving average computed!" — Raspberry Pi 5 board ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 8) Plot Temperature Data via CLI (`programming/plot-temp-cli`)

- Quest link: [/quests/programming/plot-temp-cli](/quests/programming/plot-temp-cli)
- Unlock prerequisite:
  - `requiresQuests`: `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - `start` → "Show me the script" — temperature log CSV ×1
  - `script` → "The chart is rendered" — temperature line chart ×1
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

## 9) Compute Temperature Standard Deviation (`programming/stddev-temp`)

- Quest link: [/quests/programming/stddev-temp](/quests/programming/stddev-temp)
- Unlock prerequisite:
  - `requiresQuests`: `programming/median-temp`
- Dialogue `requiresItems` gates:
  - `code` → "Deviation computed!" — Raspberry Pi 5 board ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 10) Calibrate a Thermistor (`programming/thermistor-calibration`)

- Quest link: [/quests/programming/thermistor-calibration](/quests/programming/thermistor-calibration)
- Unlock prerequisite:
  - `requiresQuests`: `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - `wire` → "Hardware ready" — Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 11) Serve a Web Page (`programming/web-server`)

- Quest link: [/quests/programming/web-server](/quests/programming/web-server)
- Unlock prerequisite:
  - `requiresQuests`: `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - `start` → "I'll prep the page assets" — temperature log CSV ×1, Laptop Computer ×1
  - `prep` → "Chart exported beside index.html" — temperature line chart ×1
  - `serve` → "Page serves without console errors" — temperature line chart ×1, Raspberry Pi 5 board ×1
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

## 12) Serve JSON Data (`programming/json-endpoint`)

- Quest link: [/quests/programming/json-endpoint](/quests/programming/json-endpoint)
- Unlock prerequisite:
  - `requiresQuests`: `programming/web-server`
- Dialogue `requiresItems` gates:
  - `start` → "Ready to add an API" — temperature log CSV ×1, thermistor logging rig ×1, Raspberry Pi 5 board ×1
  - `wire` → "Serial feed is stable" — thermistor logging rig ×1, Raspberry Pi 5 board ×1
  - `publish` → "Endpoint returns 200 with JSON body" — live temperature JSON endpoint ×1
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
  - `start` → "Design the payloads" — live temperature JSON endpoint ×1, temperature log CSV ×1
  - `stats` → "Stats are returned with each response" — annotated temperature graph ×1
  - `publish` → "Dashboard and docs are live" — live temperature dashboard ×1, live temperature JSON endpoint ×1
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
  - `code` → "POST endpoint working!" — Raspberry Pi 5 board ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 15) Serve Temperature as JSON (`programming/temp-json-api`)

- Quest link: [/quests/programming/temp-json-api](/quests/programming/temp-json-api)
- Unlock prerequisite:
  - `requiresQuests`: `programming/json-api`
- Dialogue `requiresItems` gates:
  - `start` → "Sounds great." — temperature log CSV ×1, thermistor logging rig ×1, Raspberry Pi 5 board ×1
  - `code` → "Endpoint streaming data!" — live temperature JSON endpoint ×1
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
  - `script` → "Alert works!" — aquarium thermometer (0–50°C) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## 18) Email Temperature Alert (`programming/temp-email`)

- Quest link: [/quests/programming/temp-email](/quests/programming/temp-email)
- Unlock prerequisite:
  - `requiresQuests`: `programming/temp-alert`
- Dialogue `requiresItems` gates:
  - `code` → "Email sent!" — aquarium thermometer (0–50°C) ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - cured compost bucket ×1
- Processes used:
  - None

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
