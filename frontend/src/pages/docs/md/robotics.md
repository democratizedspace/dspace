---
title: 'Robotics'
slug: 'robotics'
---

Robotics quests cover the `robotics` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Calibrate reflectance sensors](/quests/robotics/reflectance-sensors)
2. [Control a Servo Motor](/quests/robotics/servo-control)
3. [Measure distance with an ultrasonic sensor](/quests/robotics/ultrasonic-rangefinder)
4. [Build a line-following robot](/quests/robotics/line-follower)
5. [Make a Pan-Tilt Mount](/quests/robotics/pan-tilt)
6. [Build a Servo Gripper](/quests/robotics/servo-gripper)
7. [Add Obstacle Avoidance](/quests/robotics/obstacle-avoidance)
8. [Scan with a servo-mounted sensor](/quests/robotics/servo-radar)
9. [Assemble a Servo Arm](/quests/robotics/servo-arm)
10. [Add Wheel Encoders](/quests/robotics/wheel-encoders)
11. [Track distance with wheel encoders](/quests/robotics/odometry-basics)
12. [Balance with a gyroscope](/quests/robotics/gyro-balance)
13. [Navigate a Simple Maze](/quests/robotics/maze-navigation)

## 1) Calibrate reflectance sensors (`robotics/reflectance-sensors`)

- Quest link: `/quests/robotics/reflectance-sensors`
- Unlock prerequisite: `requiresQuests`: ['electronics/light-sensor', 'programming/hello-sensor']
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 2) Control a Servo Motor (`robotics/servo-control`)

- Quest link: `/quests/robotics/servo-control`
- Unlock prerequisite: `requiresQuests`: ['electronics/arduino-blink']
- Dialogue `requiresItems` gates:
    - `start` → “Gear is ready—let's wire it.”: Servo Motor ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, USB Type-A to Type-B cable ×1, precision screwdriver set ×1, anti-static wrist strap ×1, Laptop Computer ×1
    - `hookup` → “Wiring is tidy and strain relief is done.”: servo test rig ×1
    - `code` → “Sweep logged and quiet.”: servo sweep log ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: 3D Printed Phone Stand ×1
- Processes used:
    - [`log-servo-sweep`](/processes/log-servo-sweep)
        - Requires: servo test rig ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: servo sweep log ×1
    - [`wire-servo-test-rig`](/processes/wire-servo-test-rig)
        - Requires: Servo Motor ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, precision screwdriver set ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: servo test rig ×1

## 3) Measure distance with an ultrasonic sensor (`robotics/ultrasonic-rangefinder`)

- Quest link: `/quests/robotics/ultrasonic-rangefinder`
- Unlock prerequisite: `requiresQuests`: ['electronics/arduino-blink']
- Dialogue `requiresItems` gates:
    - `parts` → “Parts ready. What's next?”: Servo Motor ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: 3D Printed Phone Stand ×1
- Processes used:
    - None

## 4) Build a line-following robot (`robotics/line-follower`)

- Quest link: `/quests/robotics/line-follower`
- Unlock prerequisite: `requiresQuests`: ['robotics/servo-control', 'robotics/reflectance-sensors']
- Dialogue `requiresItems` gates:
    - `parts` → “Hardware assembled.”: Servo Motor ×2
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: 3D Printed Phone Stand ×1
- Processes used:
    - None

## 5) Make a Pan-Tilt Mount (`robotics/pan-tilt`)

- Quest link: `/quests/robotics/pan-tilt`
- Unlock prerequisite: `requiresQuests`: ['robotics/servo-control']
- Dialogue `requiresItems` gates:
    - `parts` → “Servos mounted.”: Servo Motor ×2
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 6) Build a Servo Gripper (`robotics/servo-gripper`)

- Quest link: `/quests/robotics/servo-gripper`
- Unlock prerequisite: `requiresQuests`: ['robotics/servo-control']
- Dialogue `requiresItems` gates:
    - `attach` → “Works great”: Servo Motor ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 7) Add Obstacle Avoidance (`robotics/obstacle-avoidance`)

- Quest link: `/quests/robotics/obstacle-avoidance`
- Unlock prerequisite: `requiresQuests`: ['robotics/line-follower', 'robotics/ultrasonic-rangefinder']
- Dialogue `requiresItems` gates:
    - `build` → “It's dodging nicely!”: Servo Motor ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 8) Scan with a servo-mounted sensor (`robotics/servo-radar`)

- Quest link: `/quests/robotics/servo-radar`
- Unlock prerequisite: `requiresQuests`: ['robotics/pan-tilt', 'robotics/ultrasonic-rangefinder']
- Dialogue `requiresItems` gates:
    - `start` → “Parts staged and strapped in.”: Servo Motor ×2, ultrasonic distance sensor ×1, pan-tilt servo bracket ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×6, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
    - `build` → “Rig moves smoothly with no pinched wires.”: pan-tilt ultrasonic rig ×1
    - `code` → “Sweep complete!”: ultrasonic sweep map ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`build-pan-tilt-ultrasonic`](/processes/build-pan-tilt-ultrasonic)
        - Requires: Servo Motor ×2, ultrasonic distance sensor ×1, pan-tilt servo bracket ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×6, precision screwdriver set ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: pan-tilt ultrasonic rig ×1
    - [`scan-room-ultrasonic`](/processes/scan-room-ultrasonic)
        - Requires: pan-tilt ultrasonic rig ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: ultrasonic sweep map ×1

## 9) Assemble a Servo Arm (`robotics/servo-arm`)

- Quest link: `/quests/robotics/servo-arm`
- Unlock prerequisite: `requiresQuests`: ['robotics/servo-gripper']
- Dialogue `requiresItems` gates:
    - `start` → “Kit and tools are ready.”: two-servo arm kit ×1, Servo Motor ×2, precision screwdriver set ×1, anti-static wrist strap ×1
    - `build` → “Arm swings freely and the gripper opens.”: assembled servo arm ×1
    - `tune` → “Calibration saved and joints stay cool.”: calibrated servo arm ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`assemble-servo-arm-kit`](/processes/assemble-servo-arm-kit)
        - Requires: two-servo arm kit ×1, Servo Motor ×2, precision screwdriver set ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: assembled servo arm ×1
    - [`calibrate-servo-arm`](/processes/calibrate-servo-arm)
        - Requires: assembled servo arm ×1, Arduino Uno ×1, Jumper Wires ×4, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: calibrated servo arm ×1

## 10) Add Wheel Encoders (`robotics/wheel-encoders`)

- Quest link: `/quests/robotics/wheel-encoders`
- Unlock prerequisite: `requiresQuests`: ['robotics/servo-gripper']
- Dialogue `requiresItems` gates:
    - `mount` → “Installed and reading pulses!”: Wheel Encoder ×2, Arduino Uno ×1, safety goggles ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 11) Track distance with wheel encoders (`robotics/odometry-basics`)

- Quest link: `/quests/robotics/odometry-basics`
- Unlock prerequisite: `requiresQuests`: ['robotics/wheel-encoders']
- Dialogue `requiresItems` gates:
    - `wire` → “Wired and safe.”: Wheel Encoder ×2, Arduino Uno ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 12) Balance with a gyroscope (`robotics/gyro-balance`)

- Quest link: `/quests/robotics/gyro-balance`
- Unlock prerequisite: `requiresQuests`: ['robotics/odometry-basics']
- Dialogue `requiresItems` gates:
    - `parts` → “Parts ready.”: Arduino Uno ×1, Servo Motor ×2
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 13) Navigate a Simple Maze (`robotics/maze-navigation`)

- Quest link: `/quests/robotics/maze-navigation`
- Unlock prerequisite: `requiresQuests`: ['robotics/obstacle-avoidance', 'robotics/odometry-basics']
- Dialogue `requiresItems` gates:
    - `program` → “It made it through!”: Servo Motor ×2
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## QA flow notes

- Cross-quest dependencies:
    - `robotics/reflectance-sensors` unlocks after: electronics/light-sensor, programming/hello-sensor
    - `robotics/servo-control` unlocks after: electronics/arduino-blink
    - `robotics/ultrasonic-rangefinder` unlocks after: electronics/arduino-blink
    - `robotics/line-follower` unlocks after: robotics/servo-control, robotics/reflectance-sensors
    - `robotics/pan-tilt` unlocks after: robotics/servo-control
    - `robotics/servo-gripper` unlocks after: robotics/servo-control
    - `robotics/obstacle-avoidance` unlocks after: robotics/line-follower, robotics/ultrasonic-rangefinder
    - `robotics/servo-radar` unlocks after: robotics/pan-tilt, robotics/ultrasonic-rangefinder
    - `robotics/servo-arm` unlocks after: robotics/servo-gripper
    - `robotics/wheel-encoders` unlocks after: robotics/servo-gripper
    - `robotics/odometry-basics` unlocks after: robotics/wheel-encoders
    - `robotics/gyro-balance` unlocks after: robotics/odometry-basics
    - `robotics/maze-navigation` unlocks after: robotics/obstacle-avoidance, robotics/odometry-basics
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes: none found in this tree.
