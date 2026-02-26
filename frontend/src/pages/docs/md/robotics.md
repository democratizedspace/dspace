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
    - `bench` → "Hardware bench is ready." — Arduino Uno ×1, ultrasonic distance sensor ×1, Wheel Encoder ×1
    - `calibrate` → "I logged the floor/line min-max values." — Arduino Uno ×1
    - `interpretation` → "PASS: thresholds are stable enough for motion tests." — Arduino Uno ×1
    - `validate` → "Validation pass recorded." — Wheel Encoder ×1
    - `retest` → "Two consecutive passes succeeded; threshold is stable in motion." — Wheel Encoder ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dScience ×1
- Processes used:
    - [calibrate-reflectance-sensors](/processes/calibrate-reflectance-sensors)
        - Requires: Arduino Uno ×1, ultrasonic distance sensor ×1
        - Consumes: none
        - Creates: none
    - [validate-line-thresholds](/processes/validate-line-thresholds)
        - Requires: Arduino Uno ×1, Wheel Encoder ×1
        - Consumes: none
        - Creates: none
- QA notes:
    - Includes an interpretation gate with explicit PASS/FAIL branch before motion validation.
    - Out-of-range branch loops through corrective actions (cleaning, height/glare adjustments) and mandatory re-test.

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
    - `threshold-setup` → "Baseline tune is ready." — Servo Motor ×2
    - `pid-setup` → "PID baseline is uploaded." — Servo Motor ×2
    - `safety-check` → "Safety checks done; begin timed passes." — Servo Motor ×2
    - `evidence` → "Three clean laps recorded; line follower is ready." — Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 3D Printed Phone Stand ×1
- Processes used:
    - None
- QA notes:
    - Supports two strategies (threshold-first and PID-first), then converges through safety checks.
    - Completion is gated on a mechanics-backed evidence step: three clean laps without leaving tape.
    - Includes a troubleshooting loop for drift, oscillation, and wiring/speed-limit recovery.

## 4) Make a Pan-Tilt Mount (`robotics/pan-tilt`)

- Quest link: [/quests/robotics/pan-tilt](/quests/robotics/pan-tilt)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-control`
- Dialogue `requiresItems` gates:
    - `parts` → "Servos mounted and cable paths cleared." — Servo Motor ×2
    - `safety` → "Safety checks pass; run sweep validation." — Servo Motor ×2
    - `sweep-test` → "Sweep log captured with stable center return." — Servo Motor ×2
    - `evidence` → "Pan-tilt mount validated and ready for sensor payloads." — Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds strategy branching for assembly order (pan-first vs tilt-first) before convergence.
    - Adds an explicit safety gate and tolerance-based evidence requirement (<3° center error).
    - Adds a troubleshooting loop for binding, jitter, and hard-stop impacts before closure.

## 5) Build a Servo Gripper (`robotics/servo-gripper`)

- Quest link: [/quests/robotics/servo-gripper](/quests/robotics/servo-gripper)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-control`
- Dialogue `requiresItems` gates:
    - `start` → "Bench-fit first for easier linkage tuning." — Servo Motor ×1, precision screwdriver set ×1
    - `start` → "Mount directly on the robot to test fit in place." — Servo Motor ×1, anti-static wrist strap ×1
    - `bench-fit` → "Bench-fit passes and linkage motion is smooth." — Servo Motor ×1
    - `direct-mount` → "Direct mount is secure and clears the frame." — Servo Motor ×1
    - `safety-check` → "Safety checks done; run grip-cycle validation." — Servo Motor ×1
    - `evidence` → "Grip-cycle evidence recorded; gripper ready." — Servo Motor ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds non-linear pathing with bench-first vs direct-mount build strategies.
    - Adds a pinch-point safety gate with conservative servo travel limits before validation.
    - Adds a troubleshooting loop for binding/stalls and requires repeatable grip-cycle evidence.

## 6) Assemble a Servo Arm (`robotics/servo-arm`)

- Quest link: [/quests/robotics/servo-arm](/quests/robotics/servo-arm)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
    - `start` → "Kit and tools are ready." — two-servo arm kit ×1, Servo Motor ×2, precision screwdriver set ×1, anti-static wrist strap ×1
    - `base-first` → "Arm swings freely and the gripper opens." — assembled servo arm ×1
    - `elbow-first` → "Assembly complete and movement is unobstructed." — assembled servo arm ×1
    - `safety-check` → "Calibration saved and joints stay cool." — calibrated servo arm ×1
    - `evidence` → "Cycle evidence logged; arm is production-ready." — calibrated servo arm ×1
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
- QA notes:
    - Adds assembly-order branching (base-first vs elbow-first) before convergence.
    - Adds explicit safety checks (soft limits + e-stop reachability) before tuning evidence.
    - Adds a recovery loop for snagging/overheating and requires repeatable pick-place cycle proof.

## 7) Measure distance with an ultrasonic sensor (`robotics/ultrasonic-rangefinder`)

- Quest link: [/quests/robotics/ultrasonic-rangefinder](/quests/robotics/ultrasonic-rangefinder)
- Unlock prerequisite:
    - `requiresQuests`: `electronics/arduino-blink`
- Dialogue `requiresItems` gates:
    - `bench-setup` → "Bench wiring is complete." — ultrasonic distance sensor ×1
    - `mounted-setup` → "Robot-mounted wiring is complete." — ultrasonic distance sensor ×1
    - `safety-check` → "Safety checks complete; start distance sampling." — ultrasonic distance sensor ×1
    - `measurement` → "Distance readings are stable across all target ranges." — ultrasonic distance sensor ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - 3D Printed Phone Stand ×1
- Processes used:
    - None
- QA notes:
    - Adds non-linear setup paths (bench-first vs integration-first) before measurement collection.
    - Adds a domain safety gate covering polarity checks and collision-risk handling before ping tests.
    - Recovery loop handles noisy echoes with required corrective actions and re-validation.

## 8) Add Obstacle Avoidance (`robotics/obstacle-avoidance`)

- Quest link: [/quests/robotics/obstacle-avoidance](/quests/robotics/obstacle-avoidance)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/line-follower`, `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
    - `build` → "Wiring and avoidance routine are ready." — Servo Motor ×1
    - `safety` → "Safety checks pass; run the obstacle course." — Servo Motor ×1
    - `evidence` → "Three clean runs logged; obstacle avoidance is field-ready." — Servo Motor ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds a strategy fork (conservative vs agile detection profiles) before convergence.
    - Adds a safety stop-distance gate before full-speed obstacle runs.
    - Adds a troubleshooting loop for false triggers/collisions and a three-run evidence requirement.

## 9) Scan with a servo-mounted sensor (`robotics/servo-radar`)

- Quest link: [/quests/robotics/servo-radar](/quests/robotics/servo-radar)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/pan-tilt`, `robotics/ultrasonic-rangefinder`
- Dialogue `requiresItems` gates:
    - `start` → "Run a fast coarse sweep first, then refine hotspots." — Servo Motor ×2, ultrasonic distance sensor ×1, pan-tilt servo bracket ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×6, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
    - `start` → "Run a slower high-resolution sweep for cleaner maps." — Servo Motor ×2, ultrasonic distance sensor ×1, pan-tilt servo bracket ×1, Arduino Uno ×1, solderless breadboard ×1, Jumper Wires ×6, USB Type-A to Type-B cable ×1, Laptop Computer ×1, anti-static wrist strap ×1
    - `build` → "Rig moves smoothly with no pinched wires." — pan-tilt ultrasonic rig ×1
    - `safety-check` → "Safety checks complete; start mapped scans." — pan-tilt ultrasonic rig ×1
    - `scan` → "Sweep logs and map annotations are ready." — ultrasonic sweep map ×1
    - `evidence` → "Sweep parity achieved: map is consistent and documented." — ultrasonic sweep map ×1
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
- QA notes:
    - Adds explicit strategy branching (coarse-first vs high-resolution-first sweep plans).
    - Adds a safety checkpoint before mapped scans and a documented evidence gate for consistency.
    - Adds recovery handling for sweep dropouts, cross-talk, and wiring faults with mandatory re-scan.

## 10) Add Wheel Encoders (`robotics/wheel-encoders`)

- Quest link: [/quests/robotics/wheel-encoders](/quests/robotics/wheel-encoders)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/servo-gripper`
- Dialogue `requiresItems` gates:
    - `start` → "Mount hardware first, then wire signals." — Wheel Encoder ×2, Arduino Uno ×1, safety goggles ×1
    - `start` → "Route and label signal harness first, then mount." — Wheel Encoder ×2, Arduino Uno ×1, safety goggles ×1
    - `mount-first` → "Mount-first path complete; wiring is clear of moving parts." — Wheel Encoder ×2
    - `wire-first` → "Wire-first path complete; channels are labeled and stable." — Wheel Encoder ×2
    - `safety-check` → "Safety checks done; begin pulse validation runs." — Wheel Encoder ×2, Arduino Uno ×1
    - `evidence` → "Installed and pulse parity verified." — Wheel Encoder ×2, Arduino Uno ×1, safety goggles ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds strategy branching (mount-first vs wire-first) and convergence through a safety gate.
    - Adds operational safety checks (wheels lifted, cutoff access, low PWM) before powered tests.
    - Adds a troubleshooting loop and parity-evidence requirement across repeated straight-line runs.

## 11) Track distance with wheel encoders (`robotics/odometry-basics`)

- Quest link: [/quests/robotics/odometry-basics](/quests/robotics/odometry-basics)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/wheel-encoders`
- Dialogue `requiresItems` gates:
    - `wire` → "Wiring is clean and secured." — Wheel Encoder ×2, Arduino Uno ×1
    - `safety-check` → "Safety checks done; capture baseline odometry." — Wheel Encoder ×2
    - `baseline-run` → "Baseline log captured for all three passes." — Wheel Encoder ×2, Arduino Uno ×1
    - `interpret` → "Pass confirmed and logged: odometry baseline is ready for navigation." — Wheel Encoder ×2, Arduino Uno ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds strategy branching (1-meter tape test vs square-loop drift test) before calibration.
    - Adds a safety gate and mechanics-backed baseline logging requirement before interpretation.
    - Adds troubleshooting/recovery for pulse noise, wheel slip, and calibration drift with re-test loops.

## 12) Balance with a gyroscope (`robotics/gyro-balance`)

- Quest link: [/quests/robotics/gyro-balance](/quests/robotics/gyro-balance)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
    - `parts` → "Hardware is staged and strain-relieved." — Arduino Uno ×1, Servo Motor ×2
    - `safety-check` → "Safety setup complete; begin tuning." — Arduino Uno ×1
    - `tune` → "Tuning log is complete and stable." — Servo Motor ×2
    - `evidence` → "Three clean balance holds recorded; gyro balance is validated." — Arduino Uno ×1, Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds non-linear setup options (P-only baseline vs full PID-first) before tuning.
    - Adds a safety gate for low-speed trials, soft catch zones, and emergency-stop readiness.
    - Adds recovery loop for drift/oscillation plus a consecutive-holds evidence gate.

## 13) Navigate a Simple Maze (`robotics/maze-navigation`)

- Quest link: [/quests/robotics/maze-navigation](/quests/robotics/maze-navigation)
- Unlock prerequisite:
    - `requiresQuests`: `robotics/obstacle-avoidance`, `robotics/odometry-basics`
- Dialogue `requiresItems` gates:
    - `strategy` → "Decision tree loaded and tested in dry-run mode." — Servo Motor ×2
    - `safety` → "Safety limits set; begin full maze attempts." — Servo Motor ×2
    - `evidence` → "Two clean clears recorded; maze navigation is validated." — Servo Motor ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None
- QA notes:
    - Adds two route-planning strategies before convergence into shared validation.
    - Adds operational timeout/manual-stop safety checks before full maze attempts.
    - Adds a dead-end troubleshooting loop and requires two clean maze clears as evidence.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
