---
title: 'Electronics'
slug: 'electronics'
---

Electronics quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Build a basic LED circuit](/quests/electronics/basic-circuit) (`electronics/basic-circuit`)
2. [Blink an LED with Arduino](/quests/electronics/arduino-blink) (`electronics/arduino-blink`)
3. [Check a battery pack's voltage](/quests/electronics/check-battery-voltage) (`electronics/check-battery-voltage`)
4. [Check LED polarity with a multimeter](/quests/electronics/led-polarity) (`electronics/led-polarity`)
5. [Build a Light Sensor](/quests/electronics/light-sensor) (`electronics/light-sensor`)
6. [Measure Arduino 5 V output](/quests/electronics/measure-arduino-5v) (`electronics/measure-arduino-5v`)
7. [Measure LED Current](/quests/electronics/measure-led-current) (`electronics/measure-led-current`)
8. [Dim an LED with a Potentiometer](/quests/electronics/potentiometer-dimmer) (`electronics/potentiometer-dimmer`)
9. [Verify resistor color bands](/quests/electronics/resistor-color-check) (`electronics/resistor-color-check`)
10. [Measure a Resistor](/quests/electronics/measure-resistance) (`electronics/measure-resistance`)
11. [Sweep a Servo](/quests/electronics/servo-sweep) (`electronics/servo-sweep`)
12. [Read a Thermistor](/quests/electronics/thermistor-reading) (`electronics/thermistor-reading`)
13. [Log Temperature Data](/quests/electronics/data-logger) (`electronics/data-logger`)
14. [Plot Temperature Data](/quests/electronics/temperature-plot) (`electronics/temperature-plot`)
15. [Calibrate a Thermometer](/quests/electronics/thermometer-calibration) (`electronics/thermometer-calibration`)
16. [Tin a Soldering Iron](/quests/electronics/soldering-intro) (`electronics/tin-soldering-iron`)
17. [Solder an LED Harness](/quests/electronics/solder-led-harness) (`electronics/solder-led-harness`)
18. [Solder a Wire Connection](/quests/electronics/solder-wire) (`electronics/solder-wire`)
19. [Check USB cable continuity](/quests/electronics/continuity-test) (`electronics/continuity-test`)
20. [Desolder a component](/quests/electronics/desolder-component) (`electronics/desolder-component`)
21. [Test a GFCI Outlet](/quests/electronics/test-gfci-outlet) (`electronics/test-gfci-outlet`)
22. [Build a Voltage Divider](/quests/electronics/voltage-divider) (`electronics/voltage-divider`)

---

## 1) Build a basic LED circuit (`electronics/basic-circuit`)

- Quest link: [/quests/electronics/basic-circuit](/quests/electronics/basic-circuit)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `materials` → "Yep, let's assemble it."
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - bf3d2784-d48d-4b12-b12a-75f563b5dc88 ×1
    - 828d6c3b-66a5-4064-b221-97630274502b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
- Processes used:
  - None

---

## 2) Blink an LED with Arduino (`electronics/arduino-blink`)

- Quest link: [/quests/electronics/arduino-blink](/quests/electronics/arduino-blink)
- Unlock prerequisite:
  - `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
  - `materials` → "Got it all wired up. What's next?"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - bf3d2784-d48d-4b12-b12a-75f563b5dc88 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
- Processes used:
  - [arduino-ide-install](/processes/arduino-ide-install)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [arduino-led-blink](/processes/arduino-led-blink)
    - Requires:
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
      - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
      - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
      - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 3) Check a battery pack's voltage (`electronics/check-battery-voltage`)

- Quest link: [/quests/electronics/check-battery-voltage](/quests/electronics/check-battery-voltage)
- Unlock prerequisite:
  - `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
  - `measure` → "It reads about 12.6 V."
    - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
- Processes used:
  - None

---

## 4) Check LED polarity with a multimeter (`electronics/led-polarity`)

- Quest link: [/quests/electronics/led-polarity](/quests/electronics/led-polarity)
- Unlock prerequisite:
  - `electronics/check-battery-voltage`
- Dialogue `requiresItems` gates:
  - `test` → "It lights one way only."
    - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
- Processes used:
  - None

---

## 5) Build a Light Sensor (`electronics/light-sensor`)

- Quest link: [/quests/electronics/light-sensor](/quests/electronics/light-sensor)
- Unlock prerequisite:
  - `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
  - `materials` → "Ready to wire!"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
    - 6301ff22-49c9-468b-88aa-cafedfd5dcd3 ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
    - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `wire` → "Wired up and measured."
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - 6301ff22-49c9-468b-88aa-cafedfd5dcd3 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [arduino-ide-install](/processes/arduino-ide-install)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 6) Measure Arduino 5 V output (`electronics/measure-arduino-5v`)

- Quest link: [/quests/electronics/measure-arduino-5v](/quests/electronics/measure-arduino-5v)
- Unlock prerequisite:
  - `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `materials` → "Gear ready. Let's measure."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
- Processes used:
  - None

---

## 7) Measure LED Current (`electronics/measure-led-current`)

- Quest link: [/quests/electronics/measure-led-current](/quests/electronics/measure-led-current)
- Unlock prerequisite:
  - `electronics/light-sensor`
- Dialogue `requiresItems` gates:
  - `setup` → "Meter in series."
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - 828d6c3b-66a5-4064-b221-97630274502b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
- Processes used:
  - None

---

## 8) Dim an LED with a Potentiometer (`electronics/potentiometer-dimmer`)

- Quest link: [/quests/electronics/potentiometer-dimmer](/quests/electronics/potentiometer-dimmer)
- Unlock prerequisite:
  - `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `materials` → "Parts ready!"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
    - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - 2a767901-6d4d-4a90-b520-50f0076a9c7d ×1
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [arduino-ide-install](/processes/arduino-ide-install)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [arduino-potentiometer-dimmer](/processes/arduino-potentiometer-dimmer)
    - Requires:
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
      - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
      - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
      - 2a767901-6d4d-4a90-b520-50f0076a9c7d ×1
      - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 9) Verify resistor color bands (`electronics/resistor-color-check`)

- Quest link: [/quests/electronics/resistor-color-check](/quests/electronics/resistor-color-check)
- Unlock prerequisite:
  - `electronics/measure-led-current`
- Dialogue `requiresItems` gates:
  - `check` → "Confirmed 220 Ω."
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - bf3d2784-d48d-4b12-b12a-75f563b5dc88 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
- Processes used:
  - None

---

## 10) Measure a Resistor (`electronics/measure-resistance`)

- Quest link: [/quests/electronics/measure-resistance](/quests/electronics/measure-resistance)
- Unlock prerequisite:
  - `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
  - `measure` → "It reads about what the color bands predicted."
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 11) Sweep a Servo (`electronics/servo-sweep`)

- Quest link: [/quests/electronics/servo-sweep](/quests/electronics/servo-sweep)
- Unlock prerequisite:
  - `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `wire` → "Wired up!"
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
    - 828d6c3b-66a5-4064-b221-97630274502b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [arduino-ide-install](/processes/arduino-ide-install)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 12) Read a Thermistor (`electronics/thermistor-reading`)

- Quest link: [/quests/electronics/thermistor-reading](/quests/electronics/thermistor-reading)
- Unlock prerequisite:
  - `electronics/potentiometer-dimmer`
- Dialogue `requiresItems` gates:
  - `wire` → "Circuit ready."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×3
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [arduino-ide-install](/processes/arduino-ide-install)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 13) Log Temperature Data (`electronics/data-logger`)

- Quest link: [/quests/electronics/data-logger](/quests/electronics/data-logger)
- Unlock prerequisite:
  - `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
  - `setup` → "Hardware ready"
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - 5a6bb713-ed34-4463-94ee-cfe7b8faa45c ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
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

## 14) Plot Temperature Data (`electronics/temperature-plot`)

- Quest link: [/quests/electronics/temperature-plot](/quests/electronics/temperature-plot)
- Unlock prerequisite:
  - `electronics/data-logger`
- Dialogue `requiresItems` gates:
  - `prep` → "Log file copied."
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
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

## 15) Calibrate a Thermometer (`electronics/thermometer-calibration`)

- Quest link: [/quests/electronics/thermometer-calibration](/quests/electronics/thermometer-calibration)
- Unlock prerequisite:
  - `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
  - `start` → "Thermometer ready"
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

## 16) Tin a Soldering Iron (`electronics/tin-soldering-iron`)

- Quest link: [/quests/electronics/soldering-intro](/quests/electronics/soldering-intro)
- Unlock prerequisite:
  - `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
  - `start` → "Iron is heating up."
    - 4379a2f8-7cec-4bea-949b-ad50514d36ff ×1
    - 87f670ce-3630-42bb-84c0-9243cf630d05 ×1
    - cd0e1512-9b4e-4450-92ab-b298852ca5e7 ×1
    - 3dbf1701-5cc0-4443-b9bf-4275b33513d0 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 17) Solder an LED Harness (`electronics/solder-led-harness`)

- Quest link: [/quests/electronics/solder-led-harness](/quests/electronics/solder-led-harness)
- Unlock prerequisite:
  - `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
  - `prep` → "LED harness soldered and cool"
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 4379a2f8-7cec-4bea-949b-ad50514d36ff ×1
    - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - f6bb2c1a-0001-46bd-998a-388a488b5b5c ×1
- Processes used:
  - [solder-led-resistor](/processes/solder-led-resistor)
    - Requires:
      - 4379a2f8-7cec-4bea-949b-ad50514d36ff ×1
    - Consumes:
      - 48cf736e-184c-4bd1-b9b0-15b7e9721646 ×1
      - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - Creates:
      - 6da4a788-b743-4682-8dbe-f23d71435aa4 ×1

---

## 18) Solder a Wire Connection (`electronics/solder-wire`)

- Quest link: [/quests/electronics/solder-wire](/quests/electronics/solder-wire)
- Unlock prerequisite:
  - `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
  - `prep` → "Wire joined and cool"
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 4379a2f8-7cec-4bea-949b-ad50514d36ff ×1
    - 6a3772b6-2550-434f-89f9-2eb53d5b139f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - 96083990-f333-4e42-ab04-7eb2a234570e ×5
    - dad7f853-ccc9-40be-b226-89272708db84 ×1
    - 3dbf1701-5cc0-4443-b9bf-4275b33513d0 ×1
    - a8f184ec-c9d0-4a4b-b6a1-c58c1c297b26 ×1
    - 593fc442-f437-4449-94e5-17b7b4625c41 ×1
    - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - f6bb2c1a-0001-46bd-998a-388a488b5b5c ×1
- Processes used:
  - [solder-wire-connection](/processes/solder-wire-connection)
    - Requires:
      - 4379a2f8-7cec-4bea-949b-ad50514d36ff ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - dad7f853-ccc9-40be-b226-89272708db84 ×1
      - 87f670ce-3630-42bb-84c0-9243cf630d05 ×1
      - 3b3d40e9-24bc-419e-97b6-a32dcf3e27f1 ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - Consumes:
      - 96083990-f333-4e42-ab04-7eb2a234570e ×5
    - Creates:
      - None
  - [strip-jumper-wire](/processes/strip-jumper-wire)
    - Requires:
      - 6a3772b6-2550-434f-89f9-2eb53d5b139f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 19) Check USB cable continuity (`electronics/continuity-test`)

- Quest link: [/quests/electronics/continuity-test](/quests/electronics/continuity-test)
- Unlock prerequisite:
  - `electronics/solder-wire`
- Dialogue `requiresItems` gates:
  - `probe` → "It beeped and read near zero ohms."
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
    - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - 946bc4dd-32ee-434c-a8ed-d70cdce617f4 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5562d728-8e62-43b2-9b3d-77cebd2ab481 ×1
- Processes used:
  - [test-cable-continuity](/processes/test-cable-continuity)
    - Requires:
      - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
      - fb60696a-6c94-4e5e-9277-b62377ee6d73 ×1
      - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 20) Desolder a component (`electronics/desolder-component`)

- Quest link: [/quests/electronics/desolder-component](/quests/electronics/desolder-component)
- Unlock prerequisite:
  - `electronics/solder-wire`
- Dialogue `requiresItems` gates:
  - `desolder` → "Component removed."
    - 4379a2f8-7cec-4bea-949b-ad50514d36ff ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 6f2bbb48-8620-4f22-b487-d1d7db34ab22 ×1
    - 526817d2-996a-4d80-b5fc-4a0a5eb9ca03 ×1
    - dad7f853-ccc9-40be-b226-89272708db84 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 21) Test a GFCI Outlet (`electronics/test-gfci-outlet`)

- Quest link: [/quests/electronics/test-gfci-outlet](/quests/electronics/test-gfci-outlet)
- Unlock prerequisite:
  - `electronics/continuity-test`
- Dialogue `requiresItems` gates:
  - `plug` → "Outlet passed."
    - 5562d728-8e62-43b2-9b3d-77cebd2ab481 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [test-gfci-outlet](/processes/test-gfci-outlet)
    - Requires:
      - 5562d728-8e62-43b2-9b3d-77cebd2ab481 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 22) Build a Voltage Divider (`electronics/voltage-divider`)

- Quest link: [/quests/electronics/voltage-divider](/quests/electronics/voltage-divider)
- Unlock prerequisite:
  - `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
  - `build` → "Resistors placed"
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
    - ffe0b74a-f111-4d66-b4c3-d82965a976ac ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×2
    - 828d6c3b-66a5-4064-b221-97630274502b ×1
    - 5127e156-3009-4db4-85ac-e3ea070b68f2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [verify-resistor-color-code](/processes/verify-resistor-color-code)
    - Requires:
      - 037e6065-68a7-4ad1-9b0b-7778ecfe0662 ×1
      - bf3d2784-d48d-4b12-b12a-75f563b5dc88 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## QA flow notes

- Cross-quest dependencies:
  - `electronics/basic-circuit` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `electronics/basic-circuit`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×2).
  - `electronics/arduino-blink`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×2).
  - `electronics/check-battery-voltage`: verify prerequisite completion and inventory gates.
  - `electronics/led-polarity`: verify prerequisite completion and inventory gates.
  - `electronics/light-sensor`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×3).
  - `electronics/measure-arduino-5v`: verify prerequisite completion and inventory gates.
  - `electronics/measure-led-current`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×2).
  - `electronics/potentiometer-dimmer`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×3).
  - `electronics/resistor-color-check`: verify prerequisite completion and inventory gates.
  - `electronics/measure-resistance`: verify prerequisite completion and inventory gates.
  - `electronics/servo-sweep`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×3).
  - `electronics/thermistor-reading`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×3).
  - `electronics/data-logger`: verify prerequisite completion and inventory gates.
  - `electronics/temperature-plot`: verify prerequisite completion and inventory gates.
  - `electronics/thermometer-calibration`: verify prerequisite completion and inventory gates.
  - `electronics/tin-soldering-iron`: verify prerequisite completion and inventory gates.
  - `electronics/solder-led-harness`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×2).
  - `electronics/solder-wire`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×2, 96083990-f333-4e42-ab04-7eb2a234570e ×5).
  - `electronics/continuity-test`: verify prerequisite completion and inventory gates.
  - `electronics/desolder-component`: verify prerequisite completion and inventory gates.
  - `electronics/test-gfci-outlet`: verify prerequisite completion and inventory gates.
  - `electronics/voltage-divider`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×2).
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
