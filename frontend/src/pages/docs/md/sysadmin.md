---
title: 'Sysadmin'
slug: 'sysadmin'
---

Sysadmin quests cover the `sysadmin` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Learn Basic Linux Commands](/quests/sysadmin/basic-commands)
2. [Monitor System Resources](/quests/sysadmin/resource-monitoring)
3. [Inspect System Logs](/quests/sysadmin/log-analysis)

## 1) Learn Basic Linux Commands (`sysadmin/basic-commands`)

- Quest link: `/quests/sysadmin/basic-commands`
- Unlock prerequisite: `requiresQuests`: ['welcome/howtodoquests']
- Dialogue `requiresItems` gates:
    - `prep` → “Transcript generated”: shell transcript ×1
    - `parse` → “Cheatsheet complete”: command cheatsheet ×1
    - `finish` → “Mission complete”: shell transcript ×1, command cheatsheet ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: basic shell operator badge ×1
- Processes used:
    - [`sysadmin-basic-compile-command-cheatsheet`](/processes/sysadmin-basic-compile-command-cheatsheet)
        - Requires: shell transcript ×1
        - Consumes: none
        - Creates: command cheatsheet ×1
    - [`sysadmin-basic-generate-shell-transcript`](/processes/sysadmin-basic-generate-shell-transcript)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: shell transcript ×1

## 2) Monitor System Resources (`sysadmin/resource-monitoring`)

- Quest link: `/quests/sysadmin/resource-monitoring`
- Unlock prerequisite: `requiresQuests`: ['sysadmin/basic-commands']
- Dialogue `requiresItems` gates:
    - `local-scan` → “Baseline captured”: resource snapshot ×1
    - `remote-scan` → “Remote telemetry captured”: remote node telemetry report ×1
    - `finish` → “Monitoring mission complete”: resource snapshot ×1, remote node telemetry report ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: observability checkpoint badge ×1
- Processes used:
    - [`sysadmin-monitor-capture-local-snapshot`](/processes/sysadmin-monitor-capture-local-snapshot)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: resource snapshot ×1
    - [`sysadmin-monitor-collect-remote-node-telemetry`](/processes/sysadmin-monitor-collect-remote-node-telemetry)
        - Requires: Laptop Computer ×1, Pi cluster node ×1, resource snapshot ×1
        - Consumes: none
        - Creates: remote node telemetry report ×1

## 3) Inspect System Logs (`sysadmin/log-analysis`)

- Quest link: `/quests/sysadmin/log-analysis`
- Unlock prerequisite: `requiresQuests`: ['sysadmin/resource-monitoring']
- Dialogue `requiresItems` gates:
    - `journal-pass` → “Journal report created”: journalctl report ×1
    - `tail-pass` → “Incident extract complete”: incident log extract ×1
    - `finish` → “Log analysis mission complete”: journalctl report ×1, incident log extract ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: incident response analyst badge ×1
- Processes used:
    - [`sysadmin-logs-export-journalctl-report`](/processes/sysadmin-logs-export-journalctl-report)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: journalctl report ×1
    - [`sysadmin-logs-tail-incident-extract`](/processes/sysadmin-logs-tail-incident-extract)
        - Requires: journalctl report ×1
        - Consumes: none
        - Creates: incident log extract ×1

## QA flow notes

- Cross-quest dependencies:
    - `sysadmin/basic-commands` unlocks after: welcome/howtodoquests
    - `sysadmin/resource-monitoring` unlocks after: sysadmin/basic-commands
    - `sysadmin/log-analysis` unlocks after: sysadmin/resource-monitoring
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes: none found in this tree.
