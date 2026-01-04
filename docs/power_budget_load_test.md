# Power budget and load test (Raspberry Pi cluster)

This note captures the power budget expectations for the sugarkube Raspberry Pi cluster and how to
run a safe load test before attaching additional nodes or peripherals.

## Baseline budget

- Raspberry Pi 5 with active cooling and PoE+ hat: plan for **5V @ 5A (25W)** per node under
  sustained CPU/GPU load.
- Nine-node cluster worst case: **~225W**. Add 15–20% headroom for boot-time spikes, USB
  peripherals, and PoE line losses.
- Use PoE+ switches with per-port budgets ≥30W and a total budget that covers the cluster plus
  uplink gear.

## Load test scenario

1. Power one node at a time and confirm stable voltage (≥4.9V under load) before adding the next.
2. After all nodes are online, run concurrent stress workloads (`stress-ng --cpu 4 --vm 2 --timeout
   10m`) across the pool to simulate peak demand.
3. Monitor switch telemetry and per-node sensors (INA219/`vcgencmd measure_volts`) for brownouts or
   throttling.

## Mitigation tips

- If voltage sags below 4.9V or PoE ports brown out, reduce simultaneous booting, move nodes to a
  second switch/PSU, or cap CPU frequencies temporarily.
- Keep USB storage and high-draw peripherals on externally powered hubs.
- Use staggered boot in sugarkube (power up control plane first, then workers) to avoid inrush
  overloads.
- Document the measured draw per node and switch so future upgrades can compare against a known
  baseline.
