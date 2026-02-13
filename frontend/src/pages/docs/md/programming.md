---
title: 'Programming'
slug: 'programming'
---

This page documents the full **Programming** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Log Temperature Data](/quests/programming/hello-sensor) (`programming/hello-sensor`)
2. [Log Temperature Data](/quests/programming/temp-logger) (`programming/temp-logger`)
3. [Compute Average Temperature](/quests/programming/avg-temp) (`programming/avg-temp`)
4. [Graph Temperature Logs](/quests/programming/graph-temp) (`programming/graph-temp`)
5. [Clean and graph your temperature logs](/quests/programming/graph-temp-data) (`programming/graph-temp-data`)
6. [Compute Median Temperature](/quests/programming/median-temp) (`programming/median-temp`)
7. [Compute Moving Average Temperature](/quests/programming/moving-avg-temp) (`programming/moving-avg-temp`)
8. [Plot Temperature Data via CLI](/quests/programming/plot-temp-cli) (`programming/plot-temp-cli`)
9. [Compute Temperature Standard Deviation](/quests/programming/stddev-temp) (`programming/stddev-temp`)
10. [Calibrate a Thermistor](/quests/programming/thermistor-calibration) (`programming/thermistor-calibration`)
11. [Serve a Web Page](/quests/programming/web-server) (`programming/web-server`)
12. [Serve JSON Data](/quests/programming/json-endpoint) (`programming/json-endpoint`)
13. [Serve JSON Data](/quests/programming/json-api) (`programming/json-api`)
14. [Accept POST Data](/quests/programming/http-post) (`programming/http-post`)
15. [Serve Temperature as JSON](/quests/programming/temp-json-api) (`programming/temp-json-api`)
16. [Serve a live temperature graph](/quests/programming/temp-graph) (`programming/temp-graph`)
17. [Set Temperature Alert](/quests/programming/temp-alert) (`programming/temp-alert`)
18. [Email Temperature Alert](/quests/programming/temp-email) (`programming/temp-email`)

## Quest details

### 1) Log Temperature Data (`programming/hello-sensor`)
- Quest link: `/quests/programming/hello-sensor`
- Unlock prerequisite (`requiresQuests`): `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - Node `bench` / Parts are placed and powered: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `rig` / Logger is wired and blinking: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - Node `log` / CSV archived for reuse: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None
  - [`assemble-thermistor-logger`](/processes/assemble-thermistor-logger)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - [`capture-hourly-temperature-log`](/processes/capture-hourly-temperature-log)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1

### 2) Log Temperature Data (`programming/temp-logger`)
- Quest link: `/quests/programming/temp-logger`
- Unlock prerequisite (`requiresQuests`): `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
  - Node `wire` / Rig is wired and sketch uploaded: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1
  - Node `log` / CSV saved: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
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

### 3) Compute Average Temperature (`programming/avg-temp`)
- Quest link: `/quests/programming/avg-temp`
- Unlock prerequisite (`requiresQuests`): `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - Node `start` / Load the CSV: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `prep` / Data looks clean: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - Node `compute` / Averages plotted and saved: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - [`refine-temperature-graph`](/processes/refine-temperature-graph)
    - Requires: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1

### 4) Graph Temperature Logs (`programming/graph-temp`)
- Quest link: `/quests/programming/graph-temp`
- Unlock prerequisite (`requiresQuests`): `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - Node `start` / Let's create a graph.: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `prep` / My chart looks great!: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1

### 5) Clean and graph your temperature logs (`programming/graph-temp-data`)
- Quest link: `/quests/programming/graph-temp-data`
- Unlock prerequisite (`requiresQuests`): `programming/graph-temp`
- Dialogue `requiresItems` gates:
  - Node `start` / Show me how.: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - Node `script` / Graph generated!: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`refine-temperature-graph`](/processes/refine-temperature-graph)
    - Requires: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1

### 6) Compute Median Temperature (`programming/median-temp`)
- Quest link: `/quests/programming/median-temp`
- Unlock prerequisite (`requiresQuests`): `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - Node `code` / Median calculated!: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 7) Compute Moving Average Temperature (`programming/moving-avg-temp`)
- Quest link: `/quests/programming/moving-avg-temp`
- Unlock prerequisite (`requiresQuests`): `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - Node `code` / Moving average computed!: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 8) Plot Temperature Data via CLI (`programming/plot-temp-cli`)
- Quest link: `/quests/programming/plot-temp-cli`
- Unlock prerequisite (`requiresQuests`): `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - Node `start` / Show me the script: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `script` / The chart is rendered: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1

### 9) Compute Temperature Standard Deviation (`programming/stddev-temp`)
- Quest link: `/quests/programming/stddev-temp`
- Unlock prerequisite (`requiresQuests`): `programming/median-temp`
- Dialogue `requiresItems` gates:
  - Node `code` / Deviation computed!: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 10) Calibrate a Thermistor (`programming/thermistor-calibration`)
- Quest link: `/quests/programming/thermistor-calibration`
- Unlock prerequisite (`requiresQuests`): `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - Node `wire` / Hardware ready: Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 11) Serve a Web Page (`programming/web-server`)
- Quest link: `/quests/programming/web-server`
- Unlock prerequisite (`requiresQuests`): `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - Node `start` / I'll prep the page assets: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `prep` / Chart exported beside index.html: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1
  - Node `serve` / Page serves without console errors: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1

### 12) Serve JSON Data (`programming/json-endpoint`)
- Quest link: `/quests/programming/json-endpoint`
- Unlock prerequisite (`requiresQuests`): `programming/web-server`
- Dialogue `requiresItems` gates:
  - Node `start` / Ready to add an API: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
  - Node `wire` / Serial feed is stable: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
  - Node `publish` / Endpoint returns 200 with JSON body: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`deploy-temperature-json-endpoint`](/processes/deploy-temperature-json-endpoint)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
    - Consumes: None
    - Creates: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
  - [`pyserial-install`](/processes/pyserial-install)
    - Requires: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
    - Consumes: None
    - Creates: None
  - [`raspberry-pi-serial-log`](/processes/raspberry-pi-serial-log)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
    - Consumes: None
    - Creates: None

### 13) Serve JSON Data (`programming/json-api`)
- Quest link: `/quests/programming/json-api`
- Unlock prerequisite (`requiresQuests`): `programming/web-server`, `programming/json-endpoint`, `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - Node `start` / Design the payloads: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1; temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1
  - Node `stats` / Stats are returned with each response: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1
  - Node `publish` / Dashboard and docs are live: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1; live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`publish-live-temperature-graph`](/processes/publish-live-temperature-graph)
    - Requires: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1; annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1
  - [`refine-temperature-graph`](/processes/refine-temperature-graph)
    - Requires: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1

### 14) Accept POST Data (`programming/http-post`)
- Quest link: `/quests/programming/http-post`
- Unlock prerequisite (`requiresQuests`): `programming/json-api`
- Dialogue `requiresItems` gates:
  - Node `code` / POST endpoint working!: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 15) Serve Temperature as JSON (`programming/temp-json-api`)
- Quest link: `/quests/programming/temp-json-api`
- Unlock prerequisite (`requiresQuests`): `programming/json-api`
- Dialogue `requiresItems` gates:
  - Node `start` / Sounds great.: temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
  - Node `code` / Endpoint streaming data!: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`deploy-temperature-json-endpoint`](/processes/deploy-temperature-json-endpoint)
    - Requires: thermistor logging rig (`e62dca47-fba6-4ad5-abd4-95dd41f5f4c2`) x1; temperature log CSV (`d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
    - Consumes: None
    - Creates: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1

### 16) Serve a live temperature graph (`programming/temp-graph`)
- Quest link: `/quests/programming/temp-graph`
- Unlock prerequisite (`requiresQuests`): `programming/graph-temp-data`, `programming/temp-json-api`
- Dialogue `requiresItems` gates:
  - Node `start` / Show me how.: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1; annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `code` / Graph generated!: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`publish-live-temperature-graph`](/processes/publish-live-temperature-graph)
    - Requires: live temperature JSON endpoint (`f763cb7d-4e1a-4146-b304-4d8bfde4df86`) x1; annotated temperature graph (`50360fd0-e296-4ef8-a3a9-00e049318166`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: live temperature dashboard (`c377a2ff-1391-4ad8-a150-1e4531067406`) x1

### 17) Set Temperature Alert (`programming/temp-alert`)
- Quest link: `/quests/programming/temp-alert`
- Unlock prerequisite (`requiresQuests`): `programming/temp-graph`
- Dialogue `requiresItems` gates:
  - Node `script` / Alert works!: aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 18) Email Temperature Alert (`programming/temp-email`)
- Quest link: `/quests/programming/temp-email`
- Unlock prerequisite (`requiresQuests`): `programming/temp-alert`
- Dialogue `requiresItems` gates:
  - Node `code` / Email sent!: aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

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
