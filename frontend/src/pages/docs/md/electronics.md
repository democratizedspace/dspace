---
title: 'Electronics'
slug: 'electronics'
---

Electronics quests cover the `electronics` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Build a basic LED circuit](/quests/electronics/basic-circuit)
2. [Blink an LED with Arduino](/quests/electronics/arduino-blink)
3. [Check a battery pack's voltage](/quests/electronics/check-battery-voltage)
4. [Build a Light Sensor](/quests/electronics/light-sensor)
5. [Measure Arduino 5 V output](/quests/electronics/measure-arduino-5v)
6. [Dim an LED with a Potentiometer](/quests/electronics/potentiometer-dimmer)
7. [Sweep a Servo](/quests/electronics/servo-sweep)
8. [Check LED polarity with a multimeter](/quests/electronics/led-polarity)
9. [Measure LED Current](/quests/electronics/measure-led-current)
10. [Read a Thermistor](/quests/electronics/thermistor-reading)
11. [Verify resistor color bands](/quests/electronics/resistor-color-check)
12. [Log Temperature Data](/quests/electronics/data-logger)
13. [Calibrate a Thermometer](/quests/electronics/thermometer-calibration)
14. [Measure a Resistor](/quests/electronics/measure-resistance)
15. [Tin a Soldering Iron](/quests/electronics/tin-soldering-iron)
16. [Plot Temperature Data](/quests/electronics/temperature-plot)
17. [Solder an LED Harness](/quests/electronics/solder-led-harness)
18. [Solder a Wire Connection](/quests/electronics/solder-wire)
19. [Build a Voltage Divider](/quests/electronics/voltage-divider)
20. [Check USB cable continuity](/quests/electronics/continuity-test)
21. [Desolder a component](/quests/electronics/desolder-component)
22. [Test a GFCI Outlet](/quests/electronics/test-gfci-outlet)

## 1) Build a basic LED circuit (`electronics/basic-circuit`)

- Quest link: `/quests/electronics/basic-circuit`
- Unlock prerequisite: `requiresQuests`: ['welcome/howtodoquests']
- Dialogue `requiresItems` gates:
    - `materials` → “Yep, let's assemble it.”: solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, resistor color chart ×1, 5 V Power Supply ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: USB Cable ×1
- Processes used:
    - [`verify-resistor-color-code`](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none

## 2) Blink an LED with Arduino (`electronics/arduino-blink`)

- Quest link: `/quests/electronics/arduino-blink`
- Unlock prerequisite: `requiresQuests`: ['electronics/basic-circuit']
- Dialogue `requiresItems` gates:
    - `materials` → “Got it all wired up. What's next?”: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, resistor color chart ×1, safety goggles ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Servo Motor ×1
- Processes used:
    - [`arduino-ide-install`](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [`arduino-led-blink`](/processes/arduino-led-blink)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: none

## 3) Check a battery pack's voltage (`electronics/check-battery-voltage`)

- Quest link: `/quests/electronics/check-battery-voltage`
- Unlock prerequisite: `requiresQuests`: ['electronics/basic-circuit']
- Dialogue `requiresItems` gates:
    - `measure` → “It reads about 12.6 V.”: 200 Wh battery pack ×1, digital multimeter ×1, safety goggles ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: USB Cable ×1
- Processes used:
    - [`measure-battery-voltage`](/processes/measure-battery-voltage)
        - Requires: digital multimeter ×1, 200 Wh battery pack ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 4) Build a Light Sensor (`electronics/light-sensor`)

- Quest link: `/quests/electronics/light-sensor`
- Unlock prerequisite: `requiresQuests`: ['electronics/basic-circuit']
- Dialogue `requiresItems` gates:
    - `materials` → “Ready to wire!”: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, Photoresistor ×1, 10k Ohm Resistor ×1, USB Type-A to Type-B cable ×1, digital multimeter ×1, safety goggles ×1, anti-static wrist strap ×1, Laptop Computer ×1
    - `wire` → “Wired up and measured.”: digital multimeter ×1, Photoresistor ×1, safety goggles ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`arduino-ide-install`](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [`measure-photoresistor`](/processes/measure-photoresistor)
        - Requires: digital multimeter ×1, Photoresistor ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 5) Measure Arduino 5 V output (`electronics/measure-arduino-5v`)

- Quest link: `/quests/electronics/measure-arduino-5v`
- Unlock prerequisite: `requiresQuests`: ['electronics/arduino-blink']
- Dialogue `requiresItems` gates:
    - `materials` → “Gear ready. Let's measure.”: Arduino Uno ×1, Laptop Computer ×1, USB Type-A to Type-B cable ×1, digital multimeter ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Servo Motor ×1
- Processes used:
    - [`measure-arduino-5v`](/processes/measure-arduino-5v)
        - Requires: Arduino Uno ×1, digital multimeter ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: none

## 6) Dim an LED with a Potentiometer (`electronics/potentiometer-dimmer`)

- Quest link: `/quests/electronics/potentiometer-dimmer`
- Unlock prerequisite: `requiresQuests`: ['electronics/arduino-blink']
- Dialogue `requiresItems` gates:
    - `materials` → “Parts ready!”: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, 5 mm LED ×1, 220 Ohm Resistor ×1, Potentiometer ×1, USB Cable ×1, Laptop Computer ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`arduino-ide-install`](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [`arduino-potentiometer-dimmer`](/processes/arduino-potentiometer-dimmer)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, 5 mm LED ×1, 220 Ohm Resistor ×1, Potentiometer ×1, USB Cable ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: none

## 7) Sweep a Servo (`electronics/servo-sweep`)

- Quest link: `/quests/electronics/servo-sweep`
- Unlock prerequisite: `requiresQuests`: ['electronics/arduino-blink']
- Dialogue `requiresItems` gates:
    - `wire` → “Wired up!”: Arduino Uno ×1, Jumper Wires ×3, USB Cable ×1, Servo Motor ×1, 5 V Power Supply ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`arduino-ide-install`](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [`arduino-servo-sweep`](/processes/arduino-servo-sweep)
        - Requires: Arduino Uno ×1, Servo Motor ×1, 5 V Power Supply ×1, USB Cable ×1, Jumper Wires ×3
        - Consumes: none
        - Creates: none

## 8) Check LED polarity with a multimeter (`electronics/led-polarity`)

- Quest link: `/quests/electronics/led-polarity`
- Unlock prerequisite: `requiresQuests`: ['electronics/check-battery-voltage']
- Dialogue `requiresItems` gates:
    - `test` → “It lights one way only.”: 5 mm LED ×1, digital multimeter ×1, safety goggles ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: USB Cable ×1
- Processes used:
    - [`check-led-polarity`](/processes/check-led-polarity)
        - Requires: digital multimeter ×1, 5 mm LED ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 9) Measure LED Current (`electronics/measure-led-current`)

- Quest link: `/quests/electronics/measure-led-current`
- Unlock prerequisite: `requiresQuests`: ['electronics/light-sensor']
- Dialogue `requiresItems` gates:
    - `setup` → “Meter in series.”: digital multimeter ×1, solderless breadboard ×1, Jumper Wires ×2, 5 mm LED ×1, 220 Ohm Resistor ×1, 5 V Power Supply ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: USB Cable ×1
- Processes used:
    - None

## 10) Read a Thermistor (`electronics/thermistor-reading`)

- Quest link: `/quests/electronics/thermistor-reading`
- Unlock prerequisite: `requiresQuests`: ['electronics/potentiometer-dimmer']
- Dialogue `requiresItems` gates:
    - `wire` → “Circuit ready.”: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, Laptop Computer ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`arduino-ide-install`](/processes/arduino-ide-install)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: none
    - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
        - Requires: Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×3, USB Cable ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1
        - Consumes: none
        - Creates: none

## 11) Verify resistor color bands (`electronics/resistor-color-check`)

- Quest link: `/quests/electronics/resistor-color-check`
- Unlock prerequisite: `requiresQuests`: ['electronics/measure-led-current']
- Dialogue `requiresItems` gates:
    - `check` → “Confirmed 220 Ω.”: 220 Ohm Resistor ×1, resistor color chart ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: USB Cable ×1
- Processes used:
    - [`verify-resistor-color-code`](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none

## 12) Log Temperature Data (`electronics/data-logger`)

- Quest link: `/quests/electronics/data-logger`
- Unlock prerequisite: `requiresQuests`: ['electronics/thermistor-reading']
- Dialogue `requiresItems` gates:
    - `setup` → “Hardware ready”: USB Cable ×1, Raspberry Pi 5 board ×1, Arduino Uno ×1, Thermistor (10k NTC) ×1, 10k Ohm Resistor ×1, safety goggles ×1, anti-static wrist strap ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`pyserial-install`](/processes/pyserial-install)
        - Requires: Raspberry Pi 5 board ×1
        - Consumes: none
        - Creates: none
    - [`raspberry-pi-serial-log`](/processes/raspberry-pi-serial-log)
        - Requires: Arduino Uno ×1, Raspberry Pi 5 board ×1, USB Cable ×1
        - Consumes: none
        - Creates: none

## 13) Calibrate a Thermometer (`electronics/thermometer-calibration`)

- Quest link: `/quests/electronics/thermometer-calibration`
- Unlock prerequisite: `requiresQuests`: ['electronics/thermistor-reading']
- Dialogue `requiresItems` gates:
    - `start` → “Thermometer ready”: aquarium thermometer (0–50°C) ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 14) Measure a Resistor (`electronics/measure-resistance`)

- Quest link: `/quests/electronics/measure-resistance`
- Unlock prerequisite: `requiresQuests`: ['electronics/resistor-color-check']
- Dialogue `requiresItems` gates:
    - `measure` → “It reads about what the color bands predicted.”: digital multimeter ×1, 220 Ohm Resistor ×1, safety goggles ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`measure-resistance`](/processes/measure-resistance)
        - Requires: digital multimeter ×1, 220 Ohm Resistor ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 15) Tin a Soldering Iron (`electronics/tin-soldering-iron`)

- Quest link: `/quests/electronics/tin-soldering-iron`
- Unlock prerequisite: `requiresQuests`: ['electronics/resistor-color-check']
- Dialogue `requiresItems` gates:
    - `start` → “Iron is heating up.”: soldering iron kit ×1, helping hands ×1, silicone soldering mat ×1, brass tip cleaner ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 16) Plot Temperature Data (`electronics/temperature-plot`)

- Quest link: `/quests/electronics/temperature-plot`
- Unlock prerequisite: `requiresQuests`: ['electronics/data-logger']
- Dialogue `requiresItems` gates:
    - `prep` → “Log file copied.”: USB Cable ×1, Raspberry Pi 5 board ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`plot-temperature-data`](/processes/plot-temperature-data)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: temperature line chart ×1

## 17) Solder an LED Harness (`electronics/solder-led-harness`)

- Quest link: `/quests/electronics/solder-led-harness`
- Unlock prerequisite: `requiresQuests`: ['electronics/tin-soldering-iron']
- Dialogue `requiresItems` gates:
    - `prep` → “LED harness soldered and cool”: safety goggles ×1, soldering iron kit ×1, 5 mm LED ×1, 220 Ohm Resistor ×1, Jumper Wires ×2
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: soldered jumper wire ×1
- Processes used:
    - [`solder-led-resistor`](/processes/solder-led-resistor)
        - Requires: soldering iron kit ×1
        - Consumes: 5 mm LED ×1, 220 Ohm Resistor ×1, Jumper Wires ×2
        - Creates: LED indicator module ×1

## 18) Solder a Wire Connection (`electronics/solder-wire`)

- Quest link: `/quests/electronics/solder-wire`
- Unlock prerequisite: `requiresQuests`: ['electronics/tin-soldering-iron']
- Dialogue `requiresItems` gates:
    - `prep` → “Wire joined and cool”: safety goggles ×1, soldering iron kit ×1, wire stripper ×1, Jumper Wires ×2, heat-shrink tubing ×5, flux pen ×1, brass tip cleaner ×1, heat gun ×1, solder fume extractor ×1, needle-nose pliers ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: soldered jumper wire ×1
- Processes used:
    - [`solder-wire-connection`](/processes/solder-wire-connection)
        - Requires: soldering iron kit ×1, safety goggles ×1, flux pen ×1, helping hands ×1, lead-free solder spool ×1, Jumper Wires ×2
        - Consumes: heat-shrink tubing ×5
        - Creates: none
    - [`strip-jumper-wire`](/processes/strip-jumper-wire)
        - Requires: wire stripper ×1, Jumper Wires ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 19) Build a Voltage Divider (`electronics/voltage-divider`)

- Quest link: `/quests/electronics/voltage-divider`
- Unlock prerequisite: `requiresQuests`: ['electronics/tin-soldering-iron']
- Dialogue `requiresItems` gates:
    - `build` → “Resistors placed”: solderless breadboard ×1, 220 Ohm Resistor ×1, 10k Ohm Resistor ×1, Jumper Wires ×2, 5 V Power Supply ×1, digital multimeter ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`verify-resistor-color-code`](/processes/verify-resistor-color-code)
        - Requires: 220 Ohm Resistor ×1, resistor color chart ×1
        - Consumes: none
        - Creates: none

## 20) Check USB cable continuity (`electronics/continuity-test`)

- Quest link: `/quests/electronics/continuity-test`
- Unlock prerequisite: `requiresQuests`: ['electronics/solder-wire']
- Dialogue `requiresItems` gates:
    - `probe` → “It beeped and read near zero ohms.”: digital multimeter ×1, USB Cable ×1, safety goggles ×1, wire cutters ×1, electrical tape ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: GFCI outlet tester ×1
- Processes used:
    - [`test-cable-continuity`](/processes/test-cable-continuity)
        - Requires: digital multimeter ×1, USB Cable ×1, wire cutters ×1
        - Consumes: none
        - Creates: none

## 21) Desolder a component (`electronics/desolder-component`)

- Quest link: `/quests/electronics/desolder-component`
- Unlock prerequisite: `requiresQuests`: ['electronics/solder-wire']
- Dialogue `requiresItems` gates:
    - `desolder` → “Component removed.”: soldering iron kit ×1, safety goggles ×1, desoldering pump ×1, solder wick ×1, flux pen ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`desolder-through-hole`](/processes/desolder-through-hole)
        - Requires: soldering iron kit ×1, desoldering pump ×1, safety goggles ×1
        - Consumes: none
        - Creates: none

## 22) Test a GFCI Outlet (`electronics/test-gfci-outlet`)

- Quest link: `/quests/electronics/test-gfci-outlet`
- Unlock prerequisite: `requiresQuests`: ['electronics/continuity-test']
- Dialogue `requiresItems` gates:
    - `plug` → “Outlet passed.”: GFCI outlet tester ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`test-gfci-outlet`](/processes/test-gfci-outlet)
        - Requires: GFCI outlet tester ×1
        - Consumes: none
        - Creates: none

## QA flow notes

- Cross-quest dependencies:
    - `electronics/basic-circuit` unlocks after: welcome/howtodoquests
    - `electronics/arduino-blink` unlocks after: electronics/basic-circuit
    - `electronics/check-battery-voltage` unlocks after: electronics/basic-circuit
    - `electronics/light-sensor` unlocks after: electronics/basic-circuit
    - `electronics/measure-arduino-5v` unlocks after: electronics/arduino-blink
    - `electronics/potentiometer-dimmer` unlocks after: electronics/arduino-blink
    - `electronics/servo-sweep` unlocks after: electronics/arduino-blink
    - `electronics/led-polarity` unlocks after: electronics/check-battery-voltage
    - `electronics/measure-led-current` unlocks after: electronics/light-sensor
    - `electronics/thermistor-reading` unlocks after: electronics/potentiometer-dimmer
    - `electronics/resistor-color-check` unlocks after: electronics/measure-led-current
    - `electronics/data-logger` unlocks after: electronics/thermistor-reading
    - `electronics/thermometer-calibration` unlocks after: electronics/thermistor-reading
    - `electronics/measure-resistance` unlocks after: electronics/resistor-color-check
    - `electronics/tin-soldering-iron` unlocks after: electronics/resistor-color-check
    - `electronics/temperature-plot` unlocks after: electronics/data-logger
    - `electronics/solder-led-harness` unlocks after: electronics/tin-soldering-iron
    - `electronics/solder-wire` unlocks after: electronics/tin-soldering-iron
    - `electronics/voltage-divider` unlocks after: electronics/tin-soldering-iron
    - `electronics/continuity-test` unlocks after: electronics/solder-wire
    - `electronics/desolder-component` unlocks after: electronics/solder-wire
    - `electronics/test-gfci-outlet` unlocks after: electronics/continuity-test
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `arduino-ide-install` is reused in 5 quests (electronics/arduino-blink, electronics/light-sensor, electronics/potentiometer-dimmer, electronics/servo-sweep, electronics/thermistor-reading)
    - Process `verify-resistor-color-code` is reused in 3 quests (electronics/basic-circuit, electronics/resistor-color-check, electronics/voltage-divider)
