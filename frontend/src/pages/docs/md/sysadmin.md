---
title: 'Sysadmin'
slug: 'sysadmin'
---

This page documents the full **Sysadmin** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Learn Basic Linux Commands](/quests/sysadmin/basic-commands) (`sysadmin/basic-commands`)
2. [Monitor System Resources](/quests/sysadmin/resource-monitoring) (`sysadmin/resource-monitoring`)
3. [Inspect System Logs](/quests/sysadmin/log-analysis) (`sysadmin/log-analysis`)

## Quest details

### 1) Learn Basic Linux Commands (`sysadmin/basic-commands`)
- Quest link: `/quests/sysadmin/basic-commands`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `prep` / Transcript generated: shell transcript (`91923542-45d5-46f5-82eb-6367b26ef8cc`) x1
  - Node `parse` / Cheatsheet complete: command cheatsheet (`f17410cd-8c38-4612-9666-7bd1c399874d`) x1
  - Node `finish` / Mission complete: shell transcript (`91923542-45d5-46f5-82eb-6367b26ef8cc`) x1; command cheatsheet (`f17410cd-8c38-4612-9666-7bd1c399874d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: basic shell operator badge (`d2b39a23-cdfb-428d-a6ed-694ff0c0fc11`) x1
- Processes used:
  - [`sysadmin-basic-compile-command-cheatsheet`](/processes/sysadmin-basic-compile-command-cheatsheet)
    - Requires: shell transcript (`91923542-45d5-46f5-82eb-6367b26ef8cc`) x1
    - Consumes: None
    - Creates: command cheatsheet (`f17410cd-8c38-4612-9666-7bd1c399874d`) x1
  - [`sysadmin-basic-generate-shell-transcript`](/processes/sysadmin-basic-generate-shell-transcript)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: shell transcript (`91923542-45d5-46f5-82eb-6367b26ef8cc`) x1

### 2) Monitor System Resources (`sysadmin/resource-monitoring`)
- Quest link: `/quests/sysadmin/resource-monitoring`
- Unlock prerequisite (`requiresQuests`): `sysadmin/basic-commands`
- Dialogue `requiresItems` gates:
  - Node `local-scan` / Baseline captured: resource snapshot (`f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b`) x1
  - Node `remote-scan` / Remote telemetry captured: remote node telemetry report (`d49faf4f-a228-4738-92da-378a2d766238`) x1
  - Node `finish` / Monitoring mission complete: resource snapshot (`f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b`) x1; remote node telemetry report (`d49faf4f-a228-4738-92da-378a2d766238`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: observability checkpoint badge (`74a0707b-7292-4ac8-95f2-2b258210064f`) x1
- Processes used:
  - [`sysadmin-monitor-capture-local-snapshot`](/processes/sysadmin-monitor-capture-local-snapshot)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: resource snapshot (`f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b`) x1
  - [`sysadmin-monitor-collect-remote-node-telemetry`](/processes/sysadmin-monitor-collect-remote-node-telemetry)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; resource snapshot (`f5a1b52f-6c31-4dd1-aeb3-4919cb3d6d4b`) x1
    - Consumes: None
    - Creates: remote node telemetry report (`d49faf4f-a228-4738-92da-378a2d766238`) x1

### 3) Inspect System Logs (`sysadmin/log-analysis`)
- Quest link: `/quests/sysadmin/log-analysis`
- Unlock prerequisite (`requiresQuests`): `sysadmin/resource-monitoring`
- Dialogue `requiresItems` gates:
  - Node `journal-pass` / Journal report created: journalctl report (`13061ba3-25af-4548-aab5-eee8bffad8fe`) x1
  - Node `tail-pass` / Incident extract complete: incident log extract (`d00078e7-1098-4f78-9a96-9fa1f6ef615c`) x1
  - Node `finish` / Log analysis mission complete: journalctl report (`13061ba3-25af-4548-aab5-eee8bffad8fe`) x1; incident log extract (`d00078e7-1098-4f78-9a96-9fa1f6ef615c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: incident response analyst badge (`aaef54ec-eed4-43d6-a4e4-e1b22fbb5a69`) x1
- Processes used:
  - [`sysadmin-logs-export-journalctl-report`](/processes/sysadmin-logs-export-journalctl-report)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: journalctl report (`13061ba3-25af-4548-aab5-eee8bffad8fe`) x1
  - [`sysadmin-logs-tail-incident-extract`](/processes/sysadmin-logs-tail-incident-extract)
    - Requires: journalctl report (`13061ba3-25af-4548-aab5-eee8bffad8fe`) x1
    - Consumes: None
    - Creates: incident log extract (`d00078e7-1098-4f78-9a96-9fa1f6ef615c`) x1

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
