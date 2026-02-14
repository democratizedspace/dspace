---
title: 'Robotics'
slug: 'robotics'
---

Robotics quests build practical progression through the robotics skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Calibrate reflectance sensors](/quests/robotics/reflectance-sensors)
2. [Control a Servo Motor](/quests/robotics/servo-control)
3. [Build a line-following robot](/quests/robotics/line-follower)
4. [Make a Pan-Tilt Mount](/quests/robotics/pan-tilt)
5. [Build a Servo Gripper](/quests/robotics/servo-gripper)
6. [Assemble a Servo Arm](/quests/robotics/servo-arm)
7. [Measure distance with an ultrasonic sensor](/quests/robotics/ultrasonic-rangefinder)
8. [Add Obstacle Avoidance](/quests/robotics/obstacle-avoidance)
9. [Scan with a servo-mounted sensor](/quests/robotics/servo-radar)
10. [Add Wheel Encoders](/quests/robotics/wheel-encoders)
11. [Track distance with wheel encoders](/quests/robotics/odometry-basics)
12. [Balance with a gyroscope](/quests/robotics/gyro-balance)
13. [Navigate a Simple Maze](/quests/robotics/maze-navigation)

## 1) Calibrate reflectance sensors (`robotics/reflectance-sensors`)

- Quest link: [/quests/robotics/reflectance-sensors](/quests/robotics/reflectance-sensors)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/light-sensor`, `programming/hello-sensor`
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 2) Control a Servo Motor (`robotics/servo-control`)

- Quest link: [/quests/robotics/servo-control](/quests/robotics/servo-control)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `start` → "Gear is ready—let's wire it." — Servo Motor ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, USB Type-A to Type-B cable ×1, precision screwdriver set ×1, anti-static wrist strap ×1, Laptop Computer ×1
    - `hookup` → "Wiring is tidy and strain relief is done." — servo test rig ×1
    - `code` → "Sweep logged and quiet." — servo sweep log ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 3D Printed Phone Stand ×1
- Processes used:
    - [wire-servo-test-rig](/processes/wire-servo-test-rig)
        - Requires: Servo Motor ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×4, precision screwdriver set ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: servo test rig ×1
    - [log-servo-sweep](/processes/log-servo-sweep)
        - Requires: servo test rig ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: servo sweep log ×1

## 3) Build a line-following robot (`robotics/line-follower`)

- Quest link: [/quests/robotics/line-follower](/quests/robotics/line-follower)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-control`, `robotics/reflectance-sensors`
- Dialogue `requiresItems` gates:
    - `parts` → "Hardware assembled." — Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 3D Printed Phone Stand ×1
- Processes used:
    - None

## 4) Make a Pan-Tilt Mount (`robotics/pan-tilt`)

- Quest link: [/quests/robotics/pan-tilt](/quests/robotics/pan-tilt)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-control`
- Dialogue `requiresItems` gates:
    - `parts` → "Servos mounted." — Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 5) Build a Servo Gripper (`robotics/servo-gripper`)

- Quest link: [/quests/robotics/servo-gripper](/quests/robotics/servo-gripper)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-control`
- Dialogue `requiresItems` gates:
    - `attach` → "Works great" — Servo Motor ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 6) Assemble a Servo Arm (`robotics/servo-arm`)

- Quest link: [/quests/robotics/servo-arm](/quests/robotics/servo-arm)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
    - `start` → "Kit and tools are ready." — two-servo arm kit ×1, Servo Motor ×2, precision screwdriver set ×1, anti-static wrist strap ×1
    - `build` → "Arm swings freely and the gripper opens." — assembled servo arm ×1
    - `tune` → "Calibration saved and joints stay cool." — calibrated servo arm ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [assemble-servo-arm-kit](/processes/assemble-servo-arm-kit)
        - Requires: two-servo arm kit ×1, Servo Motor ×2, precision screwdriver set ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: assembled servo arm ×1
    - [calibrate-servo-arm](/processes/calibrate-servo-arm)
        - Requires: assembled servo arm ×1, Arduino Uno ×1, Jumper Wires ×4, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: calibrated servo arm ×1

## 7) Measure distance with an ultrasonic sensor (`robotics/ultrasonic-rangefinder`)

- Quest link: [/quests/robotics/ultrasonic-rangefinder](/quests/robotics/ultrasonic-rangefinder)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `parts` → "Parts ready. What's next?" — Servo Motor ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 3D Printed Phone Stand ×1
- Processes used:
    - None

## 8) Add Obstacle Avoidance (`robotics/obstacle-avoidance`)

- Quest link: [/quests/robotics/obstacle-avoidance](/quests/robotics/obstacle-avoidance)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/line-follower`, `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
    - `build` → "It's dodging nicely!" — Servo Motor ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 9) Scan with a servo-mounted sensor (`robotics/servo-radar`)

- Quest link: [/quests/robotics/servo-radar](/quests/robotics/servo-radar)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/pan-tilt`, `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
    - `start` → "Parts staged and strapped in." — Servo Motor ×2, ultrasonic distance sensor ×1, pan-tilt servo bracket ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×6, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
    - `build` → "Rig moves smoothly with no pinched wires." — pan-tilt ultrasonic rig ×1
    - `code` → "Sweep complete!" — ultrasonic sweep map ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [build-pan-tilt-ultrasonic](/processes/build-pan-tilt-ultrasonic)
        - Requires: Servo Motor ×2, ultrasonic distance sensor ×1, pan-tilt servo bracket ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×6, precision screwdriver set ×1, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: pan-tilt ultrasonic rig ×1
    - [scan-room-ultrasonic](/processes/scan-room-ultrasonic)
        - Requires: pan-tilt ultrasonic rig ×1, Laptop Computer ×1, anti-static wrist strap ×1
        - Consumes: none
        - Creates: ultrasonic sweep map ×1

## 10) Add Wheel Encoders (`robotics/wheel-encoders`)

- Quest link: [/quests/robotics/wheel-encoders](/quests/robotics/wheel-encoders)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
    - `mount` → "Installed and reading pulses!" — Wheel Encoder ×2, Arduino Uno ×1, safety goggles ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 11) Track distance with wheel encoders (`robotics/odometry-basics`)

- Quest link: [/quests/robotics/odometry-basics](/quests/robotics/odometry-basics)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/wheel-encoders`
- Dialogue `requiresItems` gates:
    - `wire` → "Wired and safe." — Wheel Encoder ×2, Arduino Uno ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 12) Balance with a gyroscope (`robotics/gyro-balance`)

- Quest link: [/quests/robotics/gyro-balance](/quests/robotics/gyro-balance)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
    - `parts` → "Parts ready." — Arduino Uno ×1, Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 13) Navigate a Simple Maze (`robotics/maze-navigation`)

- Quest link: [/quests/robotics/maze-navigation](/quests/robotics/maze-navigation)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/obstacle-avoidance`, `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
    - `program` → "It made it through!" — Servo Motor ×2
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
