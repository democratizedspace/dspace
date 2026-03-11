---
title: 'Electronics'
slug: 'electronics'
---

Electronics quests build practical progression through the electronics skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Build a basic LED circuit](/quests/electronics/basic-circuit)
2. [Blink an LED with Arduino](/quests/electronics/arduino-blink)
3. [Check a battery pack's voltage](/quests/electronics/check-battery-voltage)
4. [Check LED polarity with a multimeter](/quests/electronics/led-polarity)
5. [Build a Light Sensor](/quests/electronics/light-sensor)
6. [Measure Arduino 5 V output](/quests/electronics/measure-arduino-5v)
7. [Measure LED Current](/quests/electronics/measure-led-current)
8. [Dim an LED with a Potentiometer](/quests/electronics/potentiometer-dimmer)
9. [Verify resistor color bands](/quests/electronics/resistor-color-check)
10. [Measure a Resistor](/quests/electronics/measure-resistance)
11. [Sweep a Servo](/quests/electronics/servo-sweep)
12. [Read a Thermistor](/quests/electronics/thermistor-reading)
13. [Log Temperature Data](/quests/electronics/data-logger)
14. [Plot Temperature Data](/quests/electronics/temperature-plot)
15. [Calibrate a Thermometer](/quests/electronics/thermometer-calibration)
16. [Tin a Soldering Iron](/quests/electronics/tin-soldering-iron)
17. [Solder an LED Harness](/quests/electronics/solder-led-harness)
18. [Solder a Wire Connection](/quests/electronics/solder-wire)
19. [Check USB cable continuity](/quests/electronics/continuity-test)
20. [Desolder a component](/quests/electronics/desolder-component)
21. [Test a GFCI Outlet](/quests/electronics/test-gfci-outlet)
22. [Build a Voltage Divider](/quests/electronics/voltage-divider)

## 1) Build a basic LED circuit (`electronics/basic-circuit`)

- Quest link: [/quests/electronics/basic-circuit](/quests/electronics/basic-circuit)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `materials` → "I have the parts and goggles." — solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, resistor color chart ×1, 5 V Power Supply ×1, safety goggles ×1
    - Non-linear flow: main assembly path plus alternate LED-polarity diagnostic path before verification.
    - Troubleshooting loop: failed light/flicker routes to a power-off correction branch and mandatory retry.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dChat ×1, dUSD ×1000
- Processes used:
    - [verify-resistor-color-code](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none
    - [check-led-polarity](/processes/check-led-polarity)
        - Requires: digital multimeter ×1, 5 mm LED ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 2) Blink an LED with Arduino (`electronics/arduino-blink`)

- Quest link: [/quests/electronics/arduino-blink](/quests/electronics/arduino-blink)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
    - `materials` → "Parts are ready and the board is still unplugged." — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, resistor color chart ×1, safety goggles ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
    - Non-linear flow: preflight path can branch to a full rewire checkpoint before upload.
    - Evidence gate: upload must be followed by an observation log confirming stable ~1 s blink cadence.
    - Troubleshooting loop: wrong cadence routes to disconnect-first diagnostics, then mandatory re-test.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - [arduino-ide-install](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [arduino-led-blink](/processes/arduino-led-blink)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: none

## 3) Check a battery pack's voltage (`electronics/check-battery-voltage`)

- Quest link: [/quests/electronics/check-battery-voltage](/quests/electronics/check-battery-voltage)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
    - `setup` → "Meter setup is confirmed." — 200 Wh battery pack ×1, digital multimeter ×1, safety goggles ×1
    - Measurement interpretation gate: reading is classified against explicit 12.4-13.6 V pass bounds.
    - Recovery branch: out-of-range values trigger quarantine + timed re-test or a safety-stop completion path.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - [measure-battery-voltage](/processes/measure-battery-voltage)
        - Requires: digital multimeter ×1, 200 Wh battery pack ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 4) Check LED polarity with a multimeter (`electronics/led-polarity`)

- Quest link: [/quests/electronics/led-polarity](/quests/electronics/led-polarity)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/check-battery-voltage`
- Dialogue `requiresItems` gates:
    - `diode-test` → "It lights one way only." — 5 mm LED ×1, digital multimeter ×1, safety goggles ×1
    - Evidence gate: diode-mode test must produce one-way glow (or 1.7-2.2 V forward drop) before completion unlocks.
    - Troubleshooting loop: no-glow/OL-both-ways routes through setup diagnostics and retry before closure.
    - Safety branch: heat/smoke anomalies force an immediate stop path and component quarantine.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - [check-led-polarity](/processes/check-led-polarity)
        - Requires: digital multimeter ×1, 5 mm LED ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 5) Build a Light Sensor (`electronics/light-sensor`)

- Quest link: [/quests/electronics/light-sensor](/quests/electronics/light-sensor)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
    - `materials` → "Ready to wire!" — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, Photoresistor ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, digital multimeter ×1, safety goggles ×1, anti-static wrist strap ×1, Laptop Computer ×1
    - `wire` → "Wired and baseline measured." — digital multimeter ×1, Photoresistor ×1, safety goggles ×1
    - Non-linear validation: branch between room-light shading and controlled flashlight sweep strategies.
    - Evidence gate: each strategy requires three logged A0 samples with a clear trend before finish.
    - Troubleshooting loop: unstable or flat readings route to unplug-first rewire/baud diagnostics and retry.
    - Safety branch: unresolved instability can end via safe-stop with powered-hardware shutdown guidance.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - [arduino-ide-install](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [measure-photoresistor](/processes/measure-photoresistor)
        - Requires: digital multimeter ×1, Photoresistor ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 6) Measure Arduino 5 V output (`electronics/measure-arduino-5v`)

- Quest link: [/quests/electronics/measure-arduino-5v](/quests/electronics/measure-arduino-5v)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `materials` → "Gear ready. Capture baseline." — Arduino Uno ×1, Laptop Computer ×1, USB Type-A to Type-B cable ×1, digital multimeter ×1, safety goggles ×1
    - Measurement gate: reading is interpreted against an explicit 4.85-5.15 V pass window.
    - Out-of-range branch: disconnect-first corrective checks and mandatory re-test loop before completion.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Servo Motor ×1
- Processes used:
    - [measure-arduino-5v](/processes/measure-arduino-5v)
        - Requires: Arduino Uno ×1, digital multimeter ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: none

## 7) Measure LED Current (`electronics/measure-led-current`)

- Quest link: [/quests/electronics/measure-led-current](/quests/electronics/measure-led-current)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/light-sensor`
- Dialogue `requiresItems` gates:
    - `setup` → "Meter in series." — digital multimeter ×1, solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, 5 V Power Supply ×1
    - `interpret-pass` → "Power is off and meter removed safely." — repeats the full meter+circuit toolchain to enforce evidence-backed closeout.
    - Measurement gate: explicit 12-22 mA pass window before completion.
    - Troubleshooting loop: out-of-range/unstable current branches to disconnect-first corrective checks and mandatory re-test.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Servo Motor ×1
- Processes used:
    - None

## 8) Dim an LED with a Potentiometer (`electronics/potentiometer-dimmer`)

- Quest link: [/quests/electronics/potentiometer-dimmer](/quests/electronics/potentiometer-dimmer)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `materials` → "Parts ready for the standard wiring path." — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, 5 mm LED ×1, 220 Ohm Resistor ×1, Potentiometer ×1, USB Cable ×1, Laptop Computer ×1
    - `materials` → "Potentiometer pins are cramped; show me a safer alternate layout." — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, 5 mm LED ×1, 220 Ohm Resistor ×1, Potentiometer ×1, USB Cable ×1, Laptop Computer ×1
    - `verify-wiring` → "Checklist passed; safe to power up." — 5 mm LED ×1, 220 Ohm Resistor ×1
    - Branching/troubleshooting: main and fallback wiring paths both converge to a safety checklist; faults route through `troubleshoot` and mandatory re-verification.
    - Evidence gate: completion now requires a low/medium/high brightness demonstration before `finish`.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Servo Motor ×1
- Processes used:
    - [arduino-ide-install](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [arduino-potentiometer-dimmer](/processes/arduino-potentiometer-dimmer)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, 5 mm LED ×1, 220 Ohm Resistor ×1, Potentiometer ×1, USB Cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: none

## 9) Verify resistor color bands (`electronics/resistor-color-check`)

- Quest link: [/quests/electronics/resistor-color-check](/quests/electronics/resistor-color-check)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/measure-led-current`
- Dialogue `requiresItems` gates:
    - `prepare` → "Tools ready and resistor isolated." — 220 Ohm Resistor ×1, resistor color chart ×1
    - `measure` → "Measurement recorded." — digital multimeter ×1
    - Measurement gate: decode expected tolerance first, then interpret measured evidence against a 209-231 Ω pass window.
    - Corrective loop: out-of-range or unstable readings route through `corrective` and must re-test before closure.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - [verify-resistor-color-code](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none

## 10) Measure a Resistor (`electronics/measure-resistance`)

- Quest link: [/quests/electronics/measure-resistance](/quests/electronics/measure-resistance)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
    - `measure` → "Reading is inside 209-231 Ω." — digital multimeter ×1, 220 Ohm Resistor ×1, safety goggles ×1
    - `measure` → "Reading is outside 209-231 Ω or keeps drifting." — digital multimeter ×1, 220 Ohm Resistor ×1
    - Measurement gate: completion requires interpreting a 220 Ω ±5% pass window (209-231 Ω).
    - Troubleshooting loop: out-of-range or unstable values require cleanup + re-test, with a safe-stop branch if readings remain unsafe.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - [measure-resistance](/processes/measure-resistance)
        - Requires: digital multimeter ×1, 220 Ohm Resistor ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 11) Sweep a Servo (`electronics/servo-sweep`)

- Quest link: [/quests/electronics/servo-sweep](/quests/electronics/servo-sweep)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `plan-path` → "Use the bench wiring path." — Arduino Uno ×1, Jumper Wires ×3, Servo Motor ×1
    - `plan-path` → "Use the external-supply path for safer current headroom." — Arduino Uno ×1, Jumper Wires ×3, Servo Motor ×1, 5 V Power Supply ×1
    - `verify-safe-state` → "Safety checks passed." — USB Cable ×1, Servo Motor ×1
    - Branching/troubleshooting: bench or external power wiring paths feed a safety checkpoint; jitter/binding routes through `recovery` and a re-verify loop.
    - Evidence gate: completion requires two stable 0°→180° sweeps without reset, stall, or heating.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Servo Motor ×1
- Processes used:
    - [arduino-ide-install](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [arduino-servo-sweep](/processes/arduino-servo-sweep)
        - Requires: Arduino Uno ×1, Servo Motor ×1, 5 V Power Supply ×1, USB Cable ×1, Jumper Wires ×3
        - Consumes: none
        - Creates: none

## 12) Read a Thermistor (`electronics/thermistor-reading`)

- Quest link: [/quests/electronics/thermistor-reading](/quests/electronics/thermistor-reading)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/potentiometer-dimmer`
- Dialogue `requiresItems` gates:
    - `wire` → "Wiring complete." — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, Laptop Computer ×1
    - Safety branch: preflight can route to a rewire checkpoint before any powered sampling.
    - Evidence gate: capture and log three readings over one minute with an expected 15-35 °C room range.
    - Troubleshooting loop: unstable/out-of-range readings force disconnect-first corrections and re-test.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - soldered jumper wire ×1
- Processes used:
    - [arduino-ide-install](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [arduino-thermistor-read](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none

## 13) Log Temperature Data (`electronics/data-logger`)

- Quest link: [/quests/electronics/data-logger](/quests/electronics/data-logger)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
    - `setup` → "Hardware ready" — USB Cable ×1, Raspberry Pi 5 board ×1, Arduino Uno ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, safety goggles ×1, anti-static wrist strap ×1
    - Logging gate: `temps.csv` must include timestamp, sensor_id, temp_c, and status at 1-minute cadence for at least 10 rows.
    - Anomaly branch: ALERT entries require corrective action and a 5-minute follow-up verification window.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Motor Award ×1
- Processes used:
    - [pyserial-install](/processes/pyserial-install)
        - Requires: Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: none
    - [raspberry-pi-serial-log](/processes/raspberry-pi-serial-log)
        - Requires: Arduino Uno ×1, Raspberry Pi 5 board ×1, USB Cable ×1
        - Consumes: none
        - Creates: none

## 14) Plot Temperature Data (`electronics/temperature-plot`)

- Quest link: [/quests/electronics/temperature-plot](/quests/electronics/temperature-plot)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/data-logger`
- Dialogue `requiresItems` gates:
    - `prep` → "Log file copied." — USB Cable ×1, Raspberry Pi 5 board ×1
    - `interpret` → "In-band and stable (>=90% inside 18-30 C, no >5 C jumps)." — repeats logging hardware as completion evidence.
    - Troubleshooting branch: out-of-band data routes through corrective wiring/timestamp checks and a mandatory re-plot loop.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Motor Award ×1
- Processes used:
    - [plot-temperature-data](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1

## 15) Calibrate a Thermometer (`electronics/thermometer-calibration`)

- Quest link: [/quests/electronics/thermometer-calibration](/quests/electronics/thermometer-calibration)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
    - `start` → "Thermometer ready" — aquarium thermometer (0–50°C) ×1
    - `interpret-pass` → "Calibration evidence captured." — thermometer evidence required at closeout.
    - Troubleshooting branch: out-of-tolerance bath readings require corrective adjustments and full re-test loop before finish.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Motor Award ×1
- Processes used:
    - None

## 16) Tin a Soldering Iron (`electronics/tin-soldering-iron`)

- Quest link: [/quests/electronics/tin-soldering-iron](/quests/electronics/tin-soldering-iron)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
    - `start` → "Iron is heating up." — soldering iron kit ×1, helping hands ×1, silicone soldering mat ×1, brass tip cleaner ×1
    - `verify-tip` → "Verified: stable tinning achieved." — repeats station/tool evidence for closeout proof.
    - Troubleshooting branches: unsafe station setup and oxidized/pitted tip paths now force recovery + re-verify loops.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - USB Cable ×1
- Processes used:
    - None

## 17) Solder an LED Harness (`electronics/solder-led-harness`)

- Quest link: [/quests/electronics/solder-led-harness](/quests/electronics/solder-led-harness)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
    - `prep` → "Parts staged and polarity checked." — safety goggles ×1, soldering iron kit ×1, 5 mm LED ×1, 220 Ohm Resistor ×1, wire stripper ×1, flux pen ×1, helping hands ×1, heat-shrink tubing ×5, Jumper Wires ×2
    - `branch-choice` → "Use helping hands for stable joints." — helping hands ×1
    - `verify` → "Pass: polarity and tug-test verified." — requires safety goggles ×1, soldering iron kit ×1, flux pen ×1, and LED indicator module ×1 as post-process evidence before closeout.
    - Troubleshooting/safety: failed joints route through `rework`; unsafe conditions route through `safety-reset` before any retry.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - soldered jumper wire ×1
- Processes used:
    - [solder-led-resistor](/processes/solder-led-resistor)
        - Requires: soldering iron kit ×1
        - Consumes: 5 mm LED ×1, 220 Ohm Resistor ×1, Jumper Wires ×2
        - Creates: LED indicator module ×1

## 18) Solder a Wire Connection (`electronics/solder-wire`)

- Quest link: [/quests/electronics/solder-wire](/quests/electronics/solder-wire)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
    - `prep` → "Wires stripped; select splice method." — safety goggles ×1, soldering iron kit ×1, wire stripper ×1, Jumper Wires ×2, heat-shrink tubing ×5, flux pen ×1, brass tip cleaner ×1, heat gun ×1, solder fume extractor ×1, needle-nose pliers ×1
    - `verify` → "Pass: insulation and mechanical checks verified." — repeats splice-tool evidence before finish, excluding consumed heat-shrink tubing.
    - Troubleshooting/safety: weak splice or exposed strands route through `fault`; smoke/heat risk routes through `safety-reset` and restart (no direct completion from abort).
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - soldered jumper wire ×1
- Processes used:
    - [strip-jumper-wire](/processes/strip-jumper-wire)
        - Requires: wire stripper ×1, Jumper Wires ×1, safety goggles ×1
        - Consumes: none
        - Creates: none
    - [solder-wire-connection](/processes/solder-wire-connection)
        - Requires: soldering iron kit ×1, safety goggles ×1, flux pen ×1, helping hands ×1, lead-free solder spool ×1, Jumper Wires ×2
        - Consumes: heat-shrink tubing ×5
        - Creates: none

## 19) Check USB cable continuity (`electronics/continuity-test`)

- Quest link: [/quests/electronics/continuity-test](/quests/electronics/continuity-test)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/solder-wire`
- Dialogue `requiresItems` gates:
    - `probe` → "It beeped and read near zero ohms." — digital multimeter ×1, USB Cable ×1, safety goggles ×1, wire cutters ×1, electrical tape ×1
    - `interpret` → "All conductors checked and logged." — repeats continuity tools as completion evidence.
    - Troubleshooting branch: failed/intermittent continuity routes to safe trim/insulate/retest loop before finish.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - soldered jumper wire ×1
- Processes used:
    - [test-cable-continuity](/processes/test-cable-continuity)
        - Requires: digital multimeter ×1, USB Cable ×1, wire cutters ×1
        - Consumes: none
        - Creates: none

## 20) Desolder a component (`electronics/desolder-component`)

- Quest link: [/quests/electronics/desolder-component](/quests/electronics/desolder-component)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/solder-wire`
- Dialogue `requiresItems` gates:
    - `desolder` → "Pads look clear and the resistor lifted cleanly." — soldering iron kit ×1, safety goggles ×1, desoldering pump ×1, solder wick ×1, flux pen ×1
    - Verification gate: pass requires clean pad/traces inspection before finish.
    - Troubleshooting branch: bridged pads route through cooldown + short heat-cycle rework loop.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - soldered jumper wire ×1
- Processes used:
    - [desolder-through-hole](/processes/desolder-through-hole)
        - Requires: soldering iron kit ×1, desoldering pump ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 21) Test a GFCI Outlet (`electronics/test-gfci-outlet`)

- Quest link: [/quests/electronics/test-gfci-outlet](/quests/electronics/test-gfci-outlet)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/continuity-test`
- Dialogue `requiresItems` gates:
    - `prep-check` → "Bounds logged; begin cycle." — GFCI outlet tester ×1
    - `measure-cycle` → "Observed normal pattern + trip ≤1s + stable reset." — GFCI outlet tester ×1
    - `corrective-loop` → "Correction complete; rerun full cycle." — GFCI outlet tester ×1
    - `interpret-pass` → "Results logged with tester evidence." — GFCI outlet tester ×1
    - Troubleshooting/safety: anomalies route through explicit fault classification + breaker-off correction loop; persistent hazard routes to `safety-abort`.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - GFCI outlet tester ×1
- Processes used:
    - [test-gfci-outlet](/processes/test-gfci-outlet)
        - Requires: GFCI outlet tester ×1
        - Consumes: none
        - Creates: none

## 22) Build a Voltage Divider (`electronics/voltage-divider`)

- Quest link: [/quests/electronics/voltage-divider](/quests/electronics/voltage-divider)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
    - `build` → "Divider assembled and probes clipped." — solderless breadboard ×1, 220 Ohm Resistor ×1, 10k Ohm Resistor ×1, Jumper Wires ×2, 5 V Power Supply ×1, digital multimeter ×1
    - `measure` → "Two measurements recorded." — digital multimeter ×1
    - Measurement gate: completion requires explicit threshold interpretation (2.40-2.60 V, max 0.05 V drift across two readings).
    - Corrective loop: out-of-range or drifting values route through power-down rewiring and mandatory re-test.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Servo Motor ×1
- Processes used:
    - [verify-resistor-color-code](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
