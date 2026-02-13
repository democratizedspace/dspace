---
title: 'Robotics'
slug: 'robotics'
---

This page documents the full **Robotics** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Calibrate reflectance sensors](/quests/robotics/reflectance-sensors) (`robotics/reflectance-sensors`)
2. [Control a Servo Motor](/quests/robotics/servo-control) (`robotics/servo-control`)
3. [Build a line-following robot](/quests/robotics/line-follower) (`robotics/line-follower`)
4. [Make a Pan-Tilt Mount](/quests/robotics/pan-tilt) (`robotics/pan-tilt`)
5. [Build a Servo Gripper](/quests/robotics/servo-gripper) (`robotics/servo-gripper`)
6. [Assemble a Servo Arm](/quests/robotics/servo-arm) (`robotics/servo-arm`)
7. [Measure distance with an ultrasonic sensor](/quests/robotics/ultrasonic-rangefinder) (`robotics/ultrasonic-rangefinder`)
8. [Add Obstacle Avoidance](/quests/robotics/obstacle-avoidance) (`robotics/obstacle-avoidance`)
9. [Scan with a servo-mounted sensor](/quests/robotics/servo-radar) (`robotics/servo-radar`)
10. [Add Wheel Encoders](/quests/robotics/wheel-encoders) (`robotics/wheel-encoders`)
11. [Track distance with wheel encoders](/quests/robotics/odometry-basics) (`robotics/odometry-basics`)
12. [Balance with a gyroscope](/quests/robotics/gyro-balance) (`robotics/gyro-balance`)
13. [Navigate a Simple Maze](/quests/robotics/maze-navigation) (`robotics/maze-navigation`)

## Quest details

### 1) Calibrate reflectance sensors (`robotics/reflectance-sensors`)
- Quest link: `/quests/robotics/reflectance-sensors`
- Unlock prerequisite (`requiresQuests`): `electronics/light-sensor`, `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - None
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 2) Control a Servo Motor (`robotics/servo-control`)
- Quest link: `/quests/robotics/servo-control`
- Unlock prerequisite (`requiresQuests`): `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - Node `start` / Gear is ready—let's wire it.: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `hookup` / Wiring is tidy and strain relief is done.: servo test rig (`b3857812-f50c-4880-810d-c929698599b3`) x1
  - Node `code` / Sweep logged and quiet.: servo sweep log (`8a4ccbcf-ee7d-42ff-bfd8-2ed242379872`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: 3D Printed Phone Stand (`9018feac-7213-4eef-9654-b06dbd9404ea`) x1
- Processes used:
  - [`log-servo-sweep`](/processes/log-servo-sweep)
    - Requires: servo test rig (`b3857812-f50c-4880-810d-c929698599b3`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
    - Consumes: None
    - Creates: servo sweep log (`8a4ccbcf-ee7d-42ff-bfd8-2ed242379872`) x1
  - [`wire-servo-test-rig`](/processes/wire-servo-test-rig)
    - Requires: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
    - Consumes: None
    - Creates: servo test rig (`b3857812-f50c-4880-810d-c929698599b3`) x1

### 3) Build a line-following robot (`robotics/line-follower`)
- Quest link: `/quests/robotics/line-follower`
- Unlock prerequisite (`requiresQuests`): `robotics/servo-control`, `robotics/reflectance-sensors`
- Dialogue `requiresItems` gates:
  - Node `parts` / Hardware assembled.: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: 3D Printed Phone Stand (`9018feac-7213-4eef-9654-b06dbd9404ea`) x1
- Processes used:
  - None

### 4) Make a Pan-Tilt Mount (`robotics/pan-tilt`)
- Quest link: `/quests/robotics/pan-tilt`
- Unlock prerequisite (`requiresQuests`): `robotics/servo-control`
- Dialogue `requiresItems` gates:
  - Node `parts` / Servos mounted.: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 5) Build a Servo Gripper (`robotics/servo-gripper`)
- Quest link: `/quests/robotics/servo-gripper`
- Unlock prerequisite (`requiresQuests`): `robotics/servo-control`
- Dialogue `requiresItems` gates:
  - Node `attach` / Works great: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 6) Assemble a Servo Arm (`robotics/servo-arm`)
- Quest link: `/quests/robotics/servo-arm`
- Unlock prerequisite (`requiresQuests`): `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
  - Node `start` / Kit and tools are ready.: two-servo arm kit (`f69a6eb1-3ef5-4f3e-97e8-5e5f395c2363`) x1; Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
  - Node `build` / Arm swings freely and the gripper opens.: assembled servo arm (`8efbfdc9-3725-46b4-baaf-9b070ca99a5d`) x1
  - Node `tune` / Calibration saved and joints stay cool.: calibrated servo arm (`b73ddc8a-b0cf-43ee-8d1e-189e50ac3d96`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-servo-arm-kit`](/processes/assemble-servo-arm-kit)
    - Requires: two-servo arm kit (`f69a6eb1-3ef5-4f3e-97e8-5e5f395c2363`) x1; Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
    - Consumes: None
    - Creates: assembled servo arm (`8efbfdc9-3725-46b4-baaf-9b070ca99a5d`) x1
  - [`calibrate-servo-arm`](/processes/calibrate-servo-arm)
    - Requires: assembled servo arm (`8efbfdc9-3725-46b4-baaf-9b070ca99a5d`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x4; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
    - Consumes: None
    - Creates: calibrated servo arm (`b73ddc8a-b0cf-43ee-8d1e-189e50ac3d96`) x1

### 7) Measure distance with an ultrasonic sensor (`robotics/ultrasonic-rangefinder`)
- Quest link: `/quests/robotics/ultrasonic-rangefinder`
- Unlock prerequisite (`requiresQuests`): `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - Node `parts` / Parts ready. What's next?: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: 3D Printed Phone Stand (`9018feac-7213-4eef-9654-b06dbd9404ea`) x1
- Processes used:
  - None

### 8) Add Obstacle Avoidance (`robotics/obstacle-avoidance`)
- Quest link: `/quests/robotics/obstacle-avoidance`
- Unlock prerequisite (`requiresQuests`): `robotics/line-follower`, `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
  - Node `build` / It's dodging nicely!: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 9) Scan with a servo-mounted sensor (`robotics/servo-radar`)
- Quest link: `/quests/robotics/servo-radar`
- Unlock prerequisite (`requiresQuests`): `robotics/pan-tilt`, `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
  - Node `start` / Parts staged and strapped in.: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2; ultrasonic distance sensor (`17edf3f2-8b4a-4c62-b3f5-c17236d53430`) x1; pan-tilt servo bracket (`f22293ab-0553-4f6f-8377-093f2a1351c8`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x6; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
  - Node `build` / Rig moves smoothly with no pinched wires.: pan-tilt ultrasonic rig (`054d7c58-0e39-4f60-b072-e62cd5e879cf`) x1
  - Node `code` / Sweep complete!: ultrasonic sweep map (`9f2109f5-59c8-4309-8a6c-3c60be744985`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`build-pan-tilt-ultrasonic`](/processes/build-pan-tilt-ultrasonic)
    - Requires: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2; ultrasonic distance sensor (`17edf3f2-8b4a-4c62-b3f5-c17236d53430`) x1; pan-tilt servo bracket (`f22293ab-0553-4f6f-8377-093f2a1351c8`) x1; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; solderless breadboard (`d1105b87-8185-4a30-ba55-406384be169f`) x1; Jumper Wires (`3cd82744-d2aa-414e-9f03-80024b624066`) x6; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
    - Consumes: None
    - Creates: pan-tilt ultrasonic rig (`054d7c58-0e39-4f60-b072-e62cd5e879cf`) x1
  - [`scan-room-ultrasonic`](/processes/scan-room-ultrasonic)
    - Requires: pan-tilt ultrasonic rig (`054d7c58-0e39-4f60-b072-e62cd5e879cf`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; anti-static wrist strap (`d30d7a65-bd11-42a2-89c1-2828e990a3b2`) x1
    - Consumes: None
    - Creates: ultrasonic sweep map (`9f2109f5-59c8-4309-8a6c-3c60be744985`) x1

### 10) Add Wheel Encoders (`robotics/wheel-encoders`)
- Quest link: `/quests/robotics/wheel-encoders`
- Unlock prerequisite (`requiresQuests`): `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
  - Node `mount` / Installed and reading pulses!: Wheel Encoder (`71fafa9a-3998-4763-a63a-279acc4ca603`) x2; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 11) Track distance with wheel encoders (`robotics/odometry-basics`)
- Quest link: `/quests/robotics/odometry-basics`
- Unlock prerequisite (`requiresQuests`): `robotics/wheel-encoders`
- Dialogue `requiresItems` gates:
  - Node `wire` / Wired and safe.: Wheel Encoder (`71fafa9a-3998-4763-a63a-279acc4ca603`) x2; Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 12) Balance with a gyroscope (`robotics/gyro-balance`)
- Quest link: `/quests/robotics/gyro-balance`
- Unlock prerequisite (`requiresQuests`): `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
  - Node `parts` / Parts ready.: Arduino Uno (`72b4448e-27d9-4746-bd3a-967ff13f501b`) x1; Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 13) Navigate a Simple Maze (`robotics/maze-navigation`)
- Quest link: `/quests/robotics/maze-navigation`
- Unlock prerequisite (`requiresQuests`): `robotics/obstacle-avoidance`, `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
  - Node `program` / It made it through!: Servo Motor (`e976bae6-e33c-428a-a20d-0aa8fde13c6c`) x2
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
