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
16. [Tin a Soldering Iron](/quests/electronics/soldering-intro)
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
    - USB Cable ×1
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
    - Servo Motor ×1
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
    - `test` → "It lights one way only." — 5 mm LED ×1, digital multimeter ×1, safety goggles ×1
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
    - `wire` → "Wired up and measured." — digital multimeter ×1, Photoresistor ×1, safety goggles ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
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
    - USB Cable ×1
- Processes used:
    - None

## 8) Dim an LED with a Potentiometer (`electronics/potentiometer-dimmer`)

- Quest link: [/quests/electronics/potentiometer-dimmer](/quests/electronics/potentiometer-dimmer)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `materials` → "Parts ready!" — Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, 5 mm LED ×1, 220 Ohm Resistor ×1, Potentiometer ×1, USB Cable ×1, Laptop Computer ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
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
    - `check` → "Confirmed 220 Ω." — 220 Ohm Resistor ×1, resistor color chart ×1
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
    - `measure` → "It reads about what the color bands predicted." — digital multimeter ×1, 220 Ohm Resistor ×1, safety goggles ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
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
    - `wire` → "Wired up!" — Arduino Uno ×1, Jumper Wires ×3, USB Cable ×1, Servo Motor ×1, 5 V Power Supply ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
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
    - cured compost bucket ×1
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

## 14) Plot Temperature Data (`electronics/temperature-plot`)

- Quest link: [/quests/electronics/temperature-plot](/quests/electronics/temperature-plot)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/data-logger`
- Dialogue `requiresItems` gates:
    - `prep` → "Log file copied." — USB Cable ×1, Raspberry Pi 5 board ×1
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

## 15) Calibrate a Thermometer (`electronics/thermometer-calibration`)

- Quest link: [/quests/electronics/thermometer-calibration](/quests/electronics/thermometer-calibration)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
    - `start` → "Thermometer ready" — aquarium thermometer (0–50°C) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 16) Tin a Soldering Iron (`electronics/soldering-intro`)

- Quest link: [/quests/electronics/soldering-intro](/quests/electronics/soldering-intro)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
    - `start` → "Iron is heating up." — soldering iron kit ×1, helping hands ×1, silicone soldering mat ×1, brass tip cleaner ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 17) Solder an LED Harness (`electronics/solder-led-harness`)

- Quest link: [/quests/electronics/solder-led-harness](/quests/electronics/solder-led-harness)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
    - `prep` → "LED harness soldered and cool" — safety goggles ×1, soldering iron kit ×1, 5 mm LED ×1, 220 Ohm Resistor ×1, Jumper Wires ×2
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
    - `prep` → "Wire joined and cool" — safety goggles ×1, soldering iron kit ×1, wire stripper ×1, Jumper Wires ×2, heat-shrink tubing ×5, flux pen ×1, brass tip cleaner ×1, heat gun ×1, solder fume extractor ×1, needle-nose pliers ×1
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
    - GFCI outlet tester ×1
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
    - cured compost bucket ×1
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
    - `plug` → "Outlet passed." — GFCI outlet tester ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
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
    - `build` → "Resistors placed" — solderless breadboard ×1, 220 Ohm Resistor ×1, 10k Ohm Resistor ×1, Jumper Wires ×2, 5 V Power Supply ×1, digital multimeter ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [verify-resistor-color-code](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
