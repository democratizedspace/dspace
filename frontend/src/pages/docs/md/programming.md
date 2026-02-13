---
title: 'Programming'
slug: 'programming'
---

Programming quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Log Temperature Data (`programming/hello-sensor`)

- Quest link: [/quests/programming/hello-sensor](/quests/programming/hello-sensor)
- Unlock prerequisite:
  - `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `bench` → "Parts are placed and powered"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
    - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
    - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `rig` → "Logger is wired and blinking"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
  - `log` → "CSV archived for reuse"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [arduino-thermistor-read](/processes/arduino-thermistor-read)
    - Requires:
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
      - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
      - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
      - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [assemble-thermistor-logger](/processes/assemble-thermistor-logger)
    - Requires:
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×4
      - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
      - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
      - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1

---

## 2) Log Temperature Data (`programming/temp-logger`)

- Quest link: [/quests/programming/temp-logger](/quests/programming/temp-logger)
- Unlock prerequisite:
  - `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
  - `wire` → "Rig is wired and sketch uploaded"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
  - `log` → "CSV saved"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-thermistor-logger](/processes/assemble-thermistor-logger)
    - Requires:
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×4
      - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
      - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
      - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
  - [capture-hourly-temperature-log](/processes/capture-hourly-temperature-log)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1

---

## 3) Compute Average Temperature (`programming/avg-temp`)

- Quest link: [/quests/programming/avg-temp](/quests/programming/avg-temp)
- Unlock prerequisite:
  - `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - `start` → "Load the CSV"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `prep` → "Data looks clean"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - `compute` → "Averages plotted and saved"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
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

## 4) Graph Temperature Logs (`programming/graph-temp`)

- Quest link: [/quests/programming/graph-temp](/quests/programming/graph-temp)
- Unlock prerequisite:
  - `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - `start` → "Let's create a graph."
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `prep` → "My chart looks great!"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1

---

## 5) Clean and graph your temperature logs (`programming/graph-temp-data`)

- Quest link: [/quests/programming/graph-temp-data](/quests/programming/graph-temp-data)
- Unlock prerequisite:
  - `programming/graph-temp`
- Dialogue `requiresItems` gates:
  - `start` → "Show me how."
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - `script` → "Graph generated!"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [refine-temperature-graph](/processes/refine-temperature-graph)
    - Requires:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1

---

## 6) Compute Median Temperature (`programming/median-temp`)

- Quest link: [/quests/programming/median-temp](/quests/programming/median-temp)
- Unlock prerequisite:
  - `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - `code` → "Median calculated!"
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 7) Compute Moving Average Temperature (`programming/moving-avg-temp`)

- Quest link: [/quests/programming/moving-avg-temp](/quests/programming/moving-avg-temp)
- Unlock prerequisite:
  - `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - `code` → "Moving average computed!"
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 8) Plot Temperature Data via CLI (`programming/plot-temp-cli`)

- Quest link: [/quests/programming/plot-temp-cli](/quests/programming/plot-temp-cli)
- Unlock prerequisite:
  - `programming/temp-logger`
- Dialogue `requiresItems` gates:
  - `start` → "Show me the script"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `script` → "The chart is rendered"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1

---

## 9) Compute Temperature Standard Deviation (`programming/stddev-temp`)

- Quest link: [/quests/programming/stddev-temp](/quests/programming/stddev-temp)
- Unlock prerequisite:
  - `programming/median-temp`
- Dialogue `requiresItems` gates:
  - `code` → "Deviation computed!"
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 10) Calibrate a Thermistor (`programming/thermistor-calibration`)

- Quest link: [/quests/programming/thermistor-calibration](/quests/programming/thermistor-calibration)
- Unlock prerequisite:
  - `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - `wire` → "Hardware ready"
    - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 11) Serve a Web Page (`programming/web-server`)

- Quest link: [/quests/programming/web-server](/quests/programming/web-server)
- Unlock prerequisite:
  - `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - `start` → "I'll prep the page assets"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `prep` → "Chart exported beside index.html"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
  - `serve` → "Page serves without console errors"
    - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [plot-temperature-data](/processes/plot-temperature-data)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed ×1

---

## 12) Serve JSON Data (`programming/json-endpoint`)

- Quest link: [/quests/programming/json-endpoint](/quests/programming/json-endpoint)
- Unlock prerequisite:
  - `programming/web-server`
- Dialogue `requiresItems` gates:
  - `start` → "Ready to add an API"
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
  - `wire` → "Serial feed is stable"
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
  - `publish` → "Endpoint returns 200 with JSON body"
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [deploy-temperature-json-endpoint](/processes/deploy-temperature-json-endpoint)
    - Requires:
      - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
      - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
      - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
    - Consumes:
      - None
    - Creates:
      - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
  - [pyserial-install](/processes/pyserial-install)
    - Requires:
      - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [raspberry-pi-serial-log](/processes/raspberry-pi-serial-log)
    - Requires:
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
      - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 13) Serve JSON Data (`programming/json-api`)

- Quest link: [/quests/programming/json-api](/quests/programming/json-api)
- Unlock prerequisite:
  - `programming/web-server`
  - `programming/json-endpoint`
  - `programming/avg-temp`
- Dialogue `requiresItems` gates:
  - `start` → "Design the payloads"
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
  - `stats` → "Stats are returned with each response"
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
  - `publish` → "Dashboard and docs are live"
    - c377a2ff-1391-4ad8-a150-1e4531067406 ×1
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
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

## 14) Accept POST Data (`programming/http-post`)

- Quest link: [/quests/programming/http-post](/quests/programming/http-post)
- Unlock prerequisite:
  - `programming/json-api`
- Dialogue `requiresItems` gates:
  - `code` → "POST endpoint working!"
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 15) Serve Temperature as JSON (`programming/temp-json-api`)

- Quest link: [/quests/programming/temp-json-api](/quests/programming/temp-json-api)
- Unlock prerequisite:
  - `programming/json-api`
- Dialogue `requiresItems` gates:
  - `start` → "Sounds great."
    - d06c9f8d-6553-4f3c-9e10-05e1cf33a6b8 ×1
    - e62dca47-fba6-4ad5-abd4-95dd41f5f4c2 ×1
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
  - `code` → "Endpoint streaming data!"
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
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

## 16) Serve a live temperature graph (`programming/temp-graph`)

- Quest link: [/quests/programming/temp-graph](/quests/programming/temp-graph)
- Unlock prerequisite:
  - `programming/graph-temp-data`
  - `programming/temp-json-api`
- Dialogue `requiresItems` gates:
  - `start` → "Show me how."
    - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
    - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `code` → "Graph generated!"
    - c377a2ff-1391-4ad8-a150-1e4531067406 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [publish-live-temperature-graph](/processes/publish-live-temperature-graph)
    - Requires:
      - f763cb7d-4e1a-4146-b304-4d8bfde4df86 ×1
      - 50360fd0-e296-4ef8-a3a9-00e049318166 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - c377a2ff-1391-4ad8-a150-1e4531067406 ×1

---

## 17) Set Temperature Alert (`programming/temp-alert`)

- Quest link: [/quests/programming/temp-alert](/quests/programming/temp-alert)
- Unlock prerequisite:
  - `programming/temp-graph`
- Dialogue `requiresItems` gates:
  - `script` → "Alert works!"
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 18) Email Temperature Alert (`programming/temp-email`)

- Quest link: [/quests/programming/temp-email](/quests/programming/temp-email)
- Unlock prerequisite:
  - `programming/temp-alert`
- Dialogue `requiresItems` gates:
  - `code` → "Email sent!"
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
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
  - `programming/hello-sensor` depends on external quests: `electronics/arduino-blink`.
  - `programming/temp-logger` depends on external quests: `electronics/thermistor-reading`.
- Progression integrity checks:
  - `programming/hello-sensor`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×3).
  - `programming/temp-logger`: verify prerequisite completion and inventory gates.
  - `programming/avg-temp`: verify prerequisite completion and inventory gates.
  - `programming/graph-temp`: verify prerequisite completion and inventory gates.
  - `programming/graph-temp-data`: verify prerequisite completion and inventory gates.
  - `programming/median-temp`: verify prerequisite completion and inventory gates.
  - `programming/moving-avg-temp`: verify prerequisite completion and inventory gates.
  - `programming/plot-temp-cli`: verify prerequisite completion and inventory gates.
  - `programming/stddev-temp`: verify prerequisite completion and inventory gates.
  - `programming/thermistor-calibration`: verify prerequisite completion and inventory gates.
  - `programming/web-server`: verify prerequisite completion and inventory gates.
  - `programming/json-endpoint`: verify prerequisite completion and inventory gates.
  - `programming/json-api`: verify prerequisite completion and inventory gates.
  - `programming/http-post`: verify prerequisite completion and inventory gates.
  - `programming/temp-json-api`: verify prerequisite completion and inventory gates.
  - `programming/temp-graph`: verify prerequisite completion and inventory gates.
  - `programming/temp-alert`: verify prerequisite completion and inventory gates.
  - `programming/temp-email`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
