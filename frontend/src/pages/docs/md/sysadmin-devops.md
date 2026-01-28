---
title: 'Sysadmin & DevOps'
slug: 'sysadmin-devops'
---

Sysadmin and DevOps quests are about keeping real systems reliable: secure shells, monitor logs,
ship updates, and automate backups.

## What you learn

- How to navigate Linux, inspect logs, and monitor resource usage
- How to harden servers with firewalls, SSH policies, and automatic updates
- How to deploy DSPACE in Docker or k3s and keep it running

## Quest trailheads

- [Learn Basic Linux Commands](/quests/sysadmin/basic-commands)
- [Inspect System Logs](/quests/sysadmin/log-analysis)
- [Monitor System Resources](/quests/sysadmin/resource-monitoring)
- [Launch DSPACE in Docker](/quests/devops/docker-compose)
- [Set Up a CI Pipeline](/quests/devops/ci-pipeline)
- [Configure Firewall Rules](/quests/devops/firewall-rules)

## Key gear

- Laptop Computer for SSH sessions and configuration work
- Raspberry Pi 5 board for local testing and automation
- External backup SSD for snapshots and recovery drills
- PoE+ switch for managed network lab setups

## Common pitfalls

- Making changes without capturing the current configuration state
- Leaving SSH exposed without key-based auth or firewall rules
- Skipping backup restores to verify that they actually work

## Next steps

- Pair deployments with [Backups](/docs/backups) guidance.
- Review hosting basics in [Self-hosting](/docs/self-hosting).
