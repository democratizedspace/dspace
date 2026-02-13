---
title: 'Electronics'
slug: 'electronics'
---

This page documents the full **Electronics** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

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

## Quest details

### 1) Build a basic LED circuit (`electronics/basic-circuit`)
- Quest link: `/quests/electronics/basic-circuit`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `materials` / Yep, let's assemble it.: solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; resistor color chart (`bf3d2784-d48d-4b12-b12a-75f563b5dc88`) x1; 5 V Power Supply (`828d6c3b-66a5-4064-b221-97630274502b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
- Processes used:
  - [`verify-resistor-color-code`](/processes/verify-resistor-color-code)
    - Requires: 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; resistor color chart (`bf3d2784-d48d-4b12-b12a-75f563b5dc88`) x1
    - Consumes: None
    - Creates: None

### 2) Blink an LED with Arduino (`electronics/arduino-blink`)
- Quest link: `/quests/electronics/arduino-blink`
- Unlock prerequisite (`requiresQuests`): `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
  - Node `materials` / Got it all wired up. What's next?: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; resistor color chart (`bf3d2784-d48d-4b12-b12a-75f563b5dc88`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1
- Processes used:
  - [`arduino-ide-install`](/processes/arduino-ide-install)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None
  - [`arduino-led-blink`](/processes/arduino-led-blink)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None

### 3) Check a battery pack's voltage (`electronics/check-battery-voltage`)
- Quest link: `/quests/electronics/check-battery-voltage`
- Unlock prerequisite (`requiresQuests`): `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
  - Node `measure` / It reads about 12.6 V.: 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
- Processes used:
  - [`measure-battery-voltage`](/processes/measure-battery-voltage)
    - Requires: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: None

### 4) Check LED polarity with a multimeter (`electronics/led-polarity`)
- Quest link: `/quests/electronics/led-polarity`
- Unlock prerequisite (`requiresQuests`): `electronics/check-battery-voltage`
- Dialogue `requiresItems` gates:
  - Node `test` / It lights one way only.: 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
- Processes used:
  - [`check-led-polarity`](/processes/check-led-polarity)
    - Requires: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: None

### 5) Build a Light Sensor (`electronics/light-sensor`)
- Quest link: `/quests/electronics/light-sensor`
- Unlock prerequisite (`requiresQuests`): `electronics/basic-circuit`
- Dialogue `requiresItems` gates:
  - Node `materials` / Ready to wire!: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; Photoresistor (`6301ff22-49c9-468b-88aa-cafedfd5dcd3`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `wire` / Wired up and measured.: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; Photoresistor (`6301ff22-49c9-468b-88aa-cafedfd5dcd3`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-ide-install`](/processes/arduino-ide-install)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None
  - [`measure-photoresistor`](/processes/measure-photoresistor)
    - Requires: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; Photoresistor (`6301ff22-49c9-468b-88aa-cafedfd5dcd3`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: None

### 6) Measure Arduino 5 V output (`electronics/measure-arduino-5v`)
- Quest link: `/quests/electronics/measure-arduino-5v`
- Unlock prerequisite (`requiresQuests`): `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - Node `materials` / Gear ready. Let's measure.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1
- Processes used:
  - [`measure-arduino-5v`](/processes/measure-arduino-5v)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None

### 7) Measure LED Current (`electronics/measure-led-current`)
- Quest link: `/quests/electronics/measure-led-current`
- Unlock prerequisite (`requiresQuests`): `electronics/light-sensor`
- Dialogue `requiresItems` gates:
  - Node `setup` / Meter in series.: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; 5 V Power Supply (`828d6c3b-66a5-4064-b221-97630274502b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
- Processes used:
  - None

### 8) Dim an LED with a Potentiometer (`electronics/potentiometer-dimmer`)
- Quest link: `/quests/electronics/potentiometer-dimmer`
- Unlock prerequisite (`requiresQuests`): `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - Node `materials` / Parts ready!: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; Potentiometer (`2a767901-6d4d-4a90-b520-50f0076a9c7d`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-ide-install`](/processes/arduino-ide-install)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None
  - [`arduino-potentiometer-dimmer`](/processes/arduino-potentiometer-dimmer)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; Potentiometer (`2a767901-6d4d-4a90-b520-50f0076a9c7d`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None

### 9) Verify resistor color bands (`electronics/resistor-color-check`)
- Quest link: `/quests/electronics/resistor-color-check`
- Unlock prerequisite (`requiresQuests`): `electronics/measure-led-current`
- Dialogue `requiresItems` gates:
  - Node `check` / Confirmed 220 Ω.: 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; resistor color chart (`bf3d2784-d48d-4b12-b12a-75f563b5dc88`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
- Processes used:
  - [`verify-resistor-color-code`](/processes/verify-resistor-color-code)
    - Requires: 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; resistor color chart (`bf3d2784-d48d-4b12-b12a-75f563b5dc88`) x1
    - Consumes: None
    - Creates: None

### 10) Measure a Resistor (`electronics/measure-resistance`)
- Quest link: `/quests/electronics/measure-resistance`
- Unlock prerequisite (`requiresQuests`): `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
  - Node `measure` / It reads about what the color bands predicted.: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-resistance`](/processes/measure-resistance)
    - Requires: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: None

### 11) Sweep a Servo (`electronics/servo-sweep`)
- Quest link: `/quests/electronics/servo-sweep`
- Unlock prerequisite (`requiresQuests`): `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - Node `wire` / Wired up!: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1; 5 V Power Supply (`828d6c3b-66a5-4064-b221-97630274502b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-ide-install`](/processes/arduino-ide-install)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None
  - [`arduino-servo-sweep`](/processes/arduino-servo-sweep)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1; 5 V Power Supply (`828d6c3b-66a5-4064-b221-97630274502b`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3
    - Consumes: None
    - Creates: None

### 12) Read a Thermistor (`electronics/thermistor-reading`)
- Quest link: `/quests/electronics/thermistor-reading`
- Unlock prerequisite (`requiresQuests`): `electronics/potentiometer-dimmer`
- Dialogue `requiresItems` gates:
  - Node `wire` / Circuit ready.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`arduino-ide-install`](/processes/arduino-ide-install)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: None
  - [`arduino-thermistor-read`](/processes/arduino-thermistor-read)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x3; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1
    - Consumes: None
    - Creates: None

### 13) Log Temperature Data (`electronics/data-logger`)
- Quest link: `/quests/electronics/data-logger`
- Unlock prerequisite (`requiresQuests`): `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
  - Node `setup` / Hardware ready: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Thermistor (10k NTC) (`5a6bb713-ed34-4463-94ee-cfe7b8faa45c`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`pyserial-install`](/processes/pyserial-install)
    - Requires: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
    - Consumes: None
    - Creates: None
  - [`raspberry-pi-serial-log`](/processes/raspberry-pi-serial-log)
    - Requires: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1
    - Consumes: None
    - Creates: None

### 14) Plot Temperature Data (`electronics/temperature-plot`)
- Quest link: `/quests/electronics/temperature-plot`
- Unlock prerequisite (`requiresQuests`): `electronics/data-logger`
- Dialogue `requiresItems` gates:
  - Node `prep` / Log file copied.: USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`plot-temperature-data`](/processes/plot-temperature-data)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: temperature line chart (`e7d1cd7d-e014-43a1-b1c8-9b7fb39deeed`) x1

### 15) Calibrate a Thermometer (`electronics/thermometer-calibration`)
- Quest link: `/quests/electronics/thermometer-calibration`
- Unlock prerequisite (`requiresQuests`): `electronics/thermistor-reading`
- Dialogue `requiresItems` gates:
  - Node `start` / Thermometer ready: aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 16) Tin a Soldering Iron (`electronics/tin-soldering-iron`)
- Quest link: `/quests/electronics/soldering-intro`
- Unlock prerequisite (`requiresQuests`): `electronics/resistor-color-check`
- Dialogue `requiresItems` gates:
  - Node `start` / Iron is heating up.: soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1; helping hands (`87f670ce-3630-42bb-84c0-9243cf630d05`) x1; silicone soldering mat (`cd0e1512-9b4e-4450-92ab-b298852ca5e7`) x1; brass tip cleaner (`3dbf1701-5cc0-4443-b9bf-4275b33513d0`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 17) Solder an LED Harness (`electronics/solder-led-harness`)
- Quest link: `/quests/electronics/solder-led-harness`
- Unlock prerequisite (`requiresQuests`): `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
  - Node `prep` / LED harness soldered and cool: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1; 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: soldered jumper wire (`f6bb2c1a-0001-46bd-998a-388a488b5b5c`) x1
- Processes used:
  - [`solder-led-resistor`](/processes/solder-led-resistor)
    - Requires: soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1
    - Consumes: 5 mm LED (`48cf736e-184c-4bd1-b9b0-15b7e9721646`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2
    - Creates: LED indicator module (`6da4a788-b743-4682-8dbe-f23d71435aa4`) x1

### 18) Solder a Wire Connection (`electronics/solder-wire`)
- Quest link: `/quests/electronics/solder-wire`
- Unlock prerequisite (`requiresQuests`): `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
  - Node `prep` / Wire joined and cool: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1; wire stripper (`6a3772b6-2550-434f-89f9-2eb53d5b139f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2; heat-shrink tubing (`96083990-f333-4e42-ab04-7eb2a234570e`) x5; flux pen (`dad7f853-ccc9-40be-b226-89272708db84`) x1; brass tip cleaner (`3dbf1701-5cc0-4443-b9bf-4275b33513d0`) x1; heat gun (`a8f184ec-c9d0-4a4b-b6a1-c58c1c297b26`) x1; solder fume extractor (`593fc442-f437-4449-94e5-17b7b4625c41`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: soldered jumper wire (`f6bb2c1a-0001-46bd-998a-388a488b5b5c`) x1
- Processes used:
  - [`solder-wire-connection`](/processes/solder-wire-connection)
    - Requires: soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; flux pen (`dad7f853-ccc9-40be-b226-89272708db84`) x1; helping hands (`87f670ce-3630-42bb-84c0-9243cf630d05`) x1; lead-free solder spool (`3b3d40e9-24bc-419e-97b6-a32dcf3e27f1`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2
    - Consumes: heat-shrink tubing (`96083990-f333-4e42-ab04-7eb2a234570e`) x5
    - Creates: None
  - [`strip-jumper-wire`](/processes/strip-jumper-wire)
    - Requires: wire stripper (`6a3772b6-2550-434f-89f9-2eb53d5b139f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: None

### 19) Check USB cable continuity (`electronics/continuity-test`)
- Quest link: `/quests/electronics/continuity-test`
- Unlock prerequisite (`requiresQuests`): `electronics/solder-wire`
- Dialogue `requiresItems` gates:
  - Node `probe` / It beeped and read near zero ohms.: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1; electrical tape (`946bc4dd-32ee-434c-a8ed-d70cdce617f4`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: GFCI outlet tester (`5562d728-8e62-43b2-9b3d-77cebd2ab481`) x1
- Processes used:
  - [`test-cable-continuity`](/processes/test-cable-continuity)
    - Requires: digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1; USB Cable (`fb60696a-6c94-4e5e-9277-b62377ee6d73`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
    - Consumes: None
    - Creates: None

### 20) Desolder a component (`electronics/desolder-component`)
- Quest link: `/quests/electronics/desolder-component`
- Unlock prerequisite (`requiresQuests`): `electronics/solder-wire`
- Dialogue `requiresItems` gates:
  - Node `desolder` / Component removed.: soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; desoldering pump (`6f2bbb48-8620-4f22-b487-d1d7db34ab22`) x1; solder wick (`526817d2-996a-4d80-b5fc-4a0a5eb9ca03`) x1; flux pen (`dad7f853-ccc9-40be-b226-89272708db84`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`desolder-through-hole`](/processes/desolder-through-hole)
    - Requires: soldering iron kit (`4379a2f8-7cec-4bea-949b-ad50514d36ff`) x1; desoldering pump (`6f2bbb48-8620-4f22-b487-d1d7db34ab22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: None

### 21) Test a GFCI Outlet (`electronics/test-gfci-outlet`)
- Quest link: `/quests/electronics/test-gfci-outlet`
- Unlock prerequisite (`requiresQuests`): `electronics/continuity-test`
- Dialogue `requiresItems` gates:
  - Node `plug` / Outlet passed.: GFCI outlet tester (`5562d728-8e62-43b2-9b3d-77cebd2ab481`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`test-gfci-outlet`](/processes/test-gfci-outlet)
    - Requires: GFCI outlet tester (`5562d728-8e62-43b2-9b3d-77cebd2ab481`) x1
    - Consumes: None
    - Creates: None

### 22) Build a Voltage Divider (`electronics/voltage-divider`)
- Quest link: `/quests/electronics/voltage-divider`
- Unlock prerequisite (`requiresQuests`): `electronics/tin-soldering-iron`
- Dialogue `requiresItems` gates:
  - Node `build` / Resistors placed: solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; 10k Ohm Resistor (`ffe0b74a-f111-4d66-b4c3-d82965a976ac`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x2; 5 V Power Supply (`828d6c3b-66a5-4064-b221-97630274502b`) x1; digital multimeter (`5127e156-3009-4db4-85ac-e3ea070b68f2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`verify-resistor-color-code`](/processes/verify-resistor-color-code)
    - Requires: 220 Ohm Resistor (`037e6065-68a7-4ad1-9b0b-7778ecfe0662`) x1; resistor color chart (`bf3d2784-d48d-4b12-b12a-75f563b5dc88`) x1
    - Consumes: None
    - Creates: None

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
