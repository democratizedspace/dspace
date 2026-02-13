---
title: 'Sysadmin'
slug: 'sysadmin'
---

Sysadmin quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Learn Basic Linux Commands](/quests/sysadmin/basic-commands) (`sysadmin/basic-commands`)
2. [Monitor System Resources](/quests/sysadmin/resource-monitoring) (`sysadmin/resource-monitoring`)
3. [Inspect System Logs](/quests/sysadmin/log-analysis) (`sysadmin/log-analysis`)

---

## 1) Learn Basic Linux Commands (`sysadmin/basic-commands`)

- Quest link: [/quests/sysadmin/basic-commands](/quests/sysadmin/basic-commands)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `prep` → "Transcript generated"
    - 91923542-45d5-46f5-82eb-6367b26ef8cc ×1
  - `parse` → "Cheatsheet complete"
    - f17410cd-8c38-4612-9666-7bd1c399874d ×1
  - `finish` → "Mission complete"
    - 91923542-45d5-46f5-82eb-6367b26ef8cc ×1
    - f17410cd-8c38-4612-9666-7bd1c399874d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d2b39a23-cdfb-428d-a6ed-694ff0c0fc11 ×1
- Processes used:
  - [sysadmin-basic-compile-command-cheatsheet](/processes/sysadmin-basic-compile-command-cheatsheet)
    - Requires:
      - 91923542-45d5-46f5-82eb-6367b26ef8cc ×1
    - Consumes:
      - None
    - Creates:
      - f17410cd-8c38-4612-9666-7bd1c399874d ×1
  - [sysadmin-basic-generate-shell-transcript](/processes/sysadmin-basic-generate-shell-transcript)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 91923542-45d5-46f5-82eb-6367b26ef8cc ×1

---

## 2) Monitor System Resources (`sysadmin/resource-monitoring`)

- Quest link: [/quests/sysadmin/resource-monitoring](/quests/sysadmin/resource-monitoring)
- Unlock prerequisite:
  - `sysadmin/basic-commands`
- Dialogue `requiresItems` gates:
  - `local-scan` → "Baseline captured"
    - f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b ×1
  - `remote-scan` → "Remote telemetry captured"
    - d49faf4f-a228-4738-92da-378a2d766238 ×1
  - `finish` → "Monitoring mission complete"
    - f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b ×1
    - d49faf4f-a228-4738-92da-378a2d766238 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 74a0707b-7292-4ac8-95f2-2b258210064f ×1
- Processes used:
  - [sysadmin-monitor-capture-local-snapshot](/processes/sysadmin-monitor-capture-local-snapshot)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b ×1
  - [sysadmin-monitor-collect-remote-node-telemetry](/processes/sysadmin-monitor-collect-remote-node-telemetry)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
      - f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b ×1
    - Consumes:
      - None
    - Creates:
      - d49faf4f-a228-4738-92da-378a2d766238 ×1

---

## 3) Inspect System Logs (`sysadmin/log-analysis`)

- Quest link: [/quests/sysadmin/log-analysis](/quests/sysadmin/log-analysis)
- Unlock prerequisite:
  - `sysadmin/resource-monitoring`
- Dialogue `requiresItems` gates:
  - `journal-pass` → "Journal report created"
    - 13061ba3-25af-4548-aab5-eee8bffad8fe ×1
  - `tail-pass` → "Incident extract complete"
    - d00078e7-1098-4f78-9a96-9fa1f6ef615c ×1
  - `finish` → "Log analysis mission complete"
    - 13061ba3-25af-4548-aab5-eee8bffad8fe ×1
    - d00078e7-1098-4f78-9a96-9fa1f6ef615c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - aaef54ec-eed4-43d6-a4e4-e1b22fbb5a69 ×1
- Processes used:
  - [sysadmin-logs-export-journalctl-report](/processes/sysadmin-logs-export-journalctl-report)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 13061ba3-25af-4548-aab5-eee8bffad8fe ×1
  - [sysadmin-logs-tail-incident-extract](/processes/sysadmin-logs-tail-incident-extract)
    - Requires:
      - 13061ba3-25af-4548-aab5-eee8bffad8fe ×1
    - Consumes:
      - None
    - Creates:
      - d00078e7-1098-4f78-9a96-9fa1f6ef615c ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `sysadmin/basic-commands` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `sysadmin/basic-commands`: verify prerequisite completion and inventory gates.
  - `sysadmin/resource-monitoring`: verify prerequisite completion and inventory gates.
  - `sysadmin/log-analysis`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
