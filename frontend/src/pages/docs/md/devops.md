---
title: 'DevOps'
slug: 'devops'
---

DevOps quests focus on reliable infrastructure: deployment, monitoring, security, and backup
habits that keep DSPACE services healthy.

## What this skill covers

- Provisioning hardware and boot media for small clusters.
- Deploying services with Docker Compose or k3s.
- Managing TLS, firewalls, and SSH hardening.
- Setting up logs, monitoring, and automated backups.

## Recommended inventory

- A dedicated node or Raspberry Pi cluster for hands-on deployments.
- SSD boot media and backup storage for resilience testing.
- Monitoring dashboards or log viewers for operations work.

## Quest highlights

- [Prepare first node](/quests/devops/prepare-first-node) builds the base host.
- [Docker compose](/quests/devops/docker-compose) ships a local stack.
- [Enable HTTPS](/quests/devops/enable-https) and
  [Firewall rules](/quests/devops/firewall-rules) secure the perimeter.
- [Monitoring](/quests/devops/monitoring) and [Daily backups](/quests/devops/daily-backups)
  create operational safety nets.

## Best practices

1. Document every change in a runbook or logbook.
2. Automate backups before you need them.
3. Patch and reboot on a schedule to avoid surprise downtime.
4. Keep secrets out of repos and configuration files.

## Where to go next

DevOps pairs well with sysadmin quests for day-to-day system hygiene and incident response.
