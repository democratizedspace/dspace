---
title: 'Sysadmin'
slug: 'sysadmin'
---

Sysadmin quests build practical progression through the sysadmin skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Learn Basic Linux Commands](/quests/sysadmin/basic-commands)
2. [Monitor System Resources](/quests/sysadmin/resource-monitoring)
3. [Inspect System Logs](/quests/sysadmin/log-analysis)

## 1) Learn Basic Linux Commands (`sysadmin/basic-commands`)

- Quest link: [/quests/sysadmin/basic-commands](/quests/sysadmin/basic-commands)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `prep` → "Transcript generated" — shell transcript ×1
    - `parse` → "Cheatsheet complete" — command cheatsheet ×1
    - `finish` → "Mission complete" — shell transcript ×1, command cheatsheet ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - basic shell operator badge ×1
- Processes used:
    - [sysadmin-basic-generate-shell-transcript](/processes/sysadmin-basic-generate-shell-transcript)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: shell transcript ×1
    - [sysadmin-basic-compile-command-cheatsheet](/processes/sysadmin-basic-compile-command-cheatsheet)
        - Requires: shell transcript ×1
        - Consumes: none
        - Creates: command cheatsheet ×1

## 2) Monitor System Resources (`sysadmin/resource-monitoring`)

- Quest link: [/quests/sysadmin/resource-monitoring](/quests/sysadmin/resource-monitoring)
- Unlock prerequisite:
    - `requiresQuests`: `sysadmin/basic-commands`
- Dialogue `requiresItems` gates:
    - `local-scan` → "Baseline captured" — resource snapshot ×1
    - `remote-scan` → "Remote telemetry captured" — remote node telemetry report ×1
    - `finish` → "Monitoring mission complete" — resource snapshot ×1, remote node telemetry report ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - observability checkpoint badge ×1
- Processes used:
    - [sysadmin-monitor-capture-local-snapshot](/processes/sysadmin-monitor-capture-local-snapshot)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: resource snapshot ×1
    - [sysadmin-monitor-collect-remote-node-telemetry](/processes/sysadmin-monitor-collect-remote-node-telemetry)
        - Requires: Laptop Computer ×1, Pi cluster node ×1, resource snapshot ×1
        - Consumes: none
        - Creates: remote node telemetry report ×1

## 3) Inspect System Logs (`sysadmin/log-analysis`)

- Quest link: [/quests/sysadmin/log-analysis](/quests/sysadmin/log-analysis)
- Unlock prerequisite:
    - `requiresQuests`: `sysadmin/resource-monitoring`
- Dialogue `requiresItems` gates:
    - `journal-pass` → "Journal report created" — journalctl report ×1
    - `tail-pass` → "Incident extract complete" — incident log extract ×1
    - `finish` → "Log analysis mission complete" — journalctl report ×1, incident log extract ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - incident response analyst badge ×1
- Processes used:
    - [sysadmin-logs-export-journalctl-report](/processes/sysadmin-logs-export-journalctl-report)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: journalctl report ×1
    - [sysadmin-logs-tail-incident-extract](/processes/sysadmin-logs-tail-incident-extract)
        - Requires: journalctl report ×1
        - Consumes: none
        - Creates: incident log extract ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Quiz remediation clarity: wrong-answer branches in `resource-monitoring` and `log-analysis` now use explicit retry prompts (for example, "Retry question 3 with a command-focused answer") so players know which question they are re-entering.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
