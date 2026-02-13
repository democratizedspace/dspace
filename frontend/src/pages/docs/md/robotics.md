---
title: 'Robotics'
slug: 'robotics'
---

Robotics quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Calibrate reflectance sensors (`robotics/reflectance-sensors`)

- Quest link: [/quests/robotics/reflectance-sensors](/quests/robotics/reflectance-sensors)
- Unlock prerequisite:
  - `electronics/light-sensor`
  - `programming/hello-sensor`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 2) Control a Servo Motor (`robotics/servo-control`)

- Quest link: [/quests/robotics/servo-control](/quests/robotics/servo-control)
- Unlock prerequisite:
  - `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `start` → "Gear is ready—let's wire it."
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×4
    - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
    - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
    - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `hookup` → "Wiring is tidy and strain relief is done."
    - b3857812-f50c-4880-810d-c929698599b3 ×1
  - `code` → "Sweep logged and quiet."
    - 8a4ccbcf-ee7d-42ff-bfd8-2ed242379872 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 9018feac-7213-4eef-9654-b06dbd9404ea ×1
- Processes used:
  - [log-servo-sweep](/processes/log-servo-sweep)
    - Requires:
      - b3857812-f50c-4880-810d-c929698599b3 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - Consumes:
      - None
    - Creates:
      - 8a4ccbcf-ee7d-42ff-bfd8-2ed242379872 ×1
  - [wire-servo-test-rig](/processes/wire-servo-test-rig)
    - Requires:
      - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×4
      - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
      - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - Consumes:
      - None
    - Creates:
      - b3857812-f50c-4880-810d-c929698599b3 ×1

---

## 3) Build a line-following robot (`robotics/line-follower`)

- Quest link: [/quests/robotics/line-follower](/quests/robotics/line-follower)
- Unlock prerequisite:
  - `robotics/servo-control`
  - `robotics/reflectance-sensors`
- Dialogue `requiresItems` gates:
  - `parts` → "Hardware assembled."
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 9018feac-7213-4eef-9654-b06dbd9404ea ×1
- Processes used:
  - None

---

## 4) Make a Pan-Tilt Mount (`robotics/pan-tilt`)

- Quest link: [/quests/robotics/pan-tilt](/quests/robotics/pan-tilt)
- Unlock prerequisite:
  - `robotics/servo-control`
- Dialogue `requiresItems` gates:
  - `parts` → "Servos mounted."
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 5) Build a Servo Gripper (`robotics/servo-gripper`)

- Quest link: [/quests/robotics/servo-gripper](/quests/robotics/servo-gripper)
- Unlock prerequisite:
  - `robotics/servo-control`
- Dialogue `requiresItems` gates:
  - `attach` → "Works great"
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 6) Assemble a Servo Arm (`robotics/servo-arm`)

- Quest link: [/quests/robotics/servo-arm](/quests/robotics/servo-arm)
- Unlock prerequisite:
  - `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
  - `start` → "Kit and tools are ready."
    - f69a6eb1-3ef5-4f3e-97e8-5e5f395c2363 ×1
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
    - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
    - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
  - `build` → "Arm swings freely and the gripper opens."
    - 8efbfdc9-3725-46b4-baaf-9b070ca99a5d ×1
  - `tune` → "Calibration saved and joints stay cool."
    - b73ddc8a-b0cf-43ee-8d1e-189e50ac3d96 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-servo-arm-kit](/processes/assemble-servo-arm-kit)
    - Requires:
      - f69a6eb1-3ef5-4f3e-97e8-5e5f395c2363 ×1
      - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
      - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
      - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - Consumes:
      - None
    - Creates:
      - 8efbfdc9-3725-46b4-baaf-9b070ca99a5d ×1
  - [calibrate-servo-arm](/processes/calibrate-servo-arm)
    - Requires:
      - 8efbfdc9-3725-46b4-baaf-9b070ca99a5d ×1
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×4
      - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - Consumes:
      - None
    - Creates:
      - b73ddc8a-b0cf-43ee-8d1e-189e50ac3d96 ×1

---

## 7) Measure distance with an ultrasonic sensor (`robotics/ultrasonic-rangefinder`)

- Quest link: [/quests/robotics/ultrasonic-rangefinder](/quests/robotics/ultrasonic-rangefinder)
- Unlock prerequisite:
  - `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
  - `parts` → "Parts ready. What's next?"
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 9018feac-7213-4eef-9654-b06dbd9404ea ×1
- Processes used:
  - None

---

## 8) Add Obstacle Avoidance (`robotics/obstacle-avoidance`)

- Quest link: [/quests/robotics/obstacle-avoidance](/quests/robotics/obstacle-avoidance)
- Unlock prerequisite:
  - `robotics/line-follower`
  - `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
  - `build` → "It's dodging nicely!"
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 9) Scan with a servo-mounted sensor (`robotics/servo-radar`)

- Quest link: [/quests/robotics/servo-radar](/quests/robotics/servo-radar)
- Unlock prerequisite:
  - `robotics/pan-tilt`
  - `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
  - `start` → "Parts staged and strapped in."
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
    - 17edf3f2-8b4a-4c62-b3f5-c17236d53430 ×1
    - f22293ab-0553-4f6f-8377-093f2a1351c8 ×1
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - d1105b87-8185-4a30-ba55-406384be169f ×1
    - 3cd82744-d2aa-414e-9f03-80024b624066 ×6
    - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
  - `build` → "Rig moves smoothly with no pinched wires."
    - 054d7c58-0e39-4f60-b072-e62cd5e879cf ×1
  - `code` → "Sweep complete!"
    - 9f2109f5-59c8-4309-8a6c-3c60be744985 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [build-pan-tilt-ultrasonic](/processes/build-pan-tilt-ultrasonic)
    - Requires:
      - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
      - 17edf3f2-8b4a-4c62-b3f5-c17236d53430 ×1
      - f22293ab-0553-4f6f-8377-093f2a1351c8 ×1
      - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
      - d1105b87-8185-4a30-ba55-406384be169f ×1
      - 3cd82744-d2aa-414e-9f03-80024b624066 ×6
      - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
      - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - Consumes:
      - None
    - Creates:
      - 054d7c58-0e39-4f60-b072-e62cd5e879cf ×1
  - [scan-room-ultrasonic](/processes/scan-room-ultrasonic)
    - Requires:
      - 054d7c58-0e39-4f60-b072-e62cd5e879cf ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - d30d7a65-bd11-42a2-89c1-2828e990a3b2 ×1
    - Consumes:
      - None
    - Creates:
      - 9f2109f5-59c8-4309-8a6c-3c60be744985 ×1

---

## 10) Add Wheel Encoders (`robotics/wheel-encoders`)

- Quest link: [/quests/robotics/wheel-encoders](/quests/robotics/wheel-encoders)
- Unlock prerequisite:
  - `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
  - `mount` → "Installed and reading pulses!"
    - 71fafa9a-3998-4763-a63a-279acc4ca603 ×2
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
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

## 11) Track distance with wheel encoders (`robotics/odometry-basics`)

- Quest link: [/quests/robotics/odometry-basics](/quests/robotics/odometry-basics)
- Unlock prerequisite:
  - `robotics/wheel-encoders`
- Dialogue `requiresItems` gates:
  - `wire` → "Wired and safe."
    - 71fafa9a-3998-4763-a63a-279acc4ca603 ×2
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 12) Balance with a gyroscope (`robotics/gyro-balance`)

- Quest link: [/quests/robotics/gyro-balance](/quests/robotics/gyro-balance)
- Unlock prerequisite:
  - `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
  - `parts` → "Parts ready."
    - 72b4448e-27d9-4746-bd3a-967ff13f501b ×1
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 13) Navigate a Simple Maze (`robotics/maze-navigation`)

- Quest link: [/quests/robotics/maze-navigation](/quests/robotics/maze-navigation)
- Unlock prerequisite:
  - `robotics/obstacle-avoidance`
  - `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
  - `program` → "It made it through!"
    - e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2
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
  - `robotics/reflectance-sensors` depends on external quests: `electronics/light-sensor`, `programming/hello-sensor`.
  - `robotics/servo-control` depends on external quests: `electronics/arduino-blink`.
  - `robotics/ultrasonic-rangefinder` depends on external quests: `electronics/arduino-blink`.
- Progression integrity checks:
  - `robotics/reflectance-sensors`: verify prerequisite completion and inventory gates.
  - `robotics/servo-control`: verify prerequisite completion and inventory gates (notable count gates: 3cd82744-d2aa-414e-9f03-80024b624066 ×4).
  - `robotics/line-follower`: verify prerequisite completion and inventory gates (notable count gates: e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2).
  - `robotics/pan-tilt`: verify prerequisite completion and inventory gates (notable count gates: e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2).
  - `robotics/servo-gripper`: verify prerequisite completion and inventory gates.
  - `robotics/servo-arm`: verify prerequisite completion and inventory gates (notable count gates: e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2).
  - `robotics/ultrasonic-rangefinder`: verify prerequisite completion and inventory gates.
  - `robotics/obstacle-avoidance`: verify prerequisite completion and inventory gates.
  - `robotics/servo-radar`: verify prerequisite completion and inventory gates (notable count gates: e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2, 3cd82744-d2aa-414e-9f03-80024b624066 ×6).
  - `robotics/wheel-encoders`: verify prerequisite completion and inventory gates (notable count gates: 71fafa9a-3998-4763-a63a-279acc4ca603 ×2).
  - `robotics/odometry-basics`: verify prerequisite completion and inventory gates (notable count gates: 71fafa9a-3998-4763-a63a-279acc4ca603 ×2).
  - `robotics/gyro-balance`: verify prerequisite completion and inventory gates (notable count gates: e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2).
  - `robotics/maze-navigation`: verify prerequisite completion and inventory gates (notable count gates: e976bae6-e33c-428a-a20d-0aa8fde13c6c ×2).
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
