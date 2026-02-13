---
title: 'DevOps'
slug: 'devops'
---

DevOps quests cover the `devops` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Plan Your Pi Cluster](/quests/devops/pi-cluster-hardware)
2. [Prepare the First Node](/quests/devops/prepare-first-node)
3. [Launch DSPACE in Docker](/quests/devops/docker-compose)
4. [Boot from SSD](/quests/devops/ssd-boot)
5. [Set Up a CI Pipeline](/quests/devops/ci-pipeline)
6. [Deploy with k3s](/quests/devops/k3s-deploy)
7. [Run a Private Docker Registry](/quests/devops/private-registry)
8. [Set Up Monitoring](/quests/devops/monitoring)
9. [Enable Automatic Updates](/quests/devops/auto-updates)
10. [Configure Daily Backups](/quests/devops/daily-backups)
11. [Configure Firewall Rules](/quests/devops/firewall-rules)
12. [Secure the Cluster with HTTPS](/quests/devops/enable-https)
13. [Set Up Log Rotation](/quests/devops/log-maintenance)
14. [Harden SSH Access](/quests/devops/ssh-hardening)
15. [Block SSH Brute Force](/quests/devops/fail2ban)

## 1) Plan Your Pi Cluster (`devops/pi-cluster-hardware`)

- Quest link: `/quests/devops/pi-cluster-hardware`
- Unlock prerequisite: `requiresQuests`: ['sysadmin/basic-commands']
- Dialogue `requiresItems` gates:
    - `list` → “I've gathered the parts.”: Raspberry Pi 5 board ×1, M.2 PoE+ HAT ×1, 1TB 2230 M.2 SSD ×1, 64GB microSD card ×1, PoE+ switch ×1, Ethernet cable ×1, fan case ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 2) Prepare the First Node (`devops/prepare-first-node`)

- Quest link: `/quests/devops/prepare-first-node`
- Unlock prerequisite: `requiresQuests`: ['devops/pi-cluster-hardware']
- Dialogue `requiresItems` gates:
    - `start` → “Card flashed and booted.”: flashed microSD card ×1
    - `update` → “System updated.”: Raspberry Pi 5 board ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`flash-sd-card`](/processes/flash-sd-card)
        - Requires: Laptop Computer ×1
        - Consumes: 64GB microSD card ×1
        - Creates: flashed microSD card ×1

## 3) Launch DSPACE in Docker (`devops/docker-compose`)

- Quest link: `/quests/devops/docker-compose`
- Unlock prerequisite: `requiresQuests`: ['devops/prepare-first-node']
- Dialogue `requiresItems` gates:
    - `start` → “Container running.”: Pi cluster node ×1
    - `tunnel` → “Tunnel online.”: PoE+ switch ×1, Ethernet cable ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`create-cloudflare-tunnel`](/processes/create-cloudflare-tunnel)
        - Requires: PoE+ switch ×1, Ethernet cable ×1
        - Consumes: none
        - Creates: none
    - [`run-docker-compose`](/processes/run-docker-compose)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 4) Boot from SSD (`devops/ssd-boot`)

- Quest link: `/quests/devops/ssd-boot`
- Unlock prerequisite: `requiresQuests`: ['devops/prepare-first-node']
- Dialogue `requiresItems` gates:
    - `clone` → “Clone complete.”: bootable 1TB SSD ×1
    - `move` → “Booted from SSD.”: Pi cluster node ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`assemble-pi-node`](/processes/assemble-pi-node)
        - Requires: none
        - Consumes: Raspberry Pi 5 board ×1, M.2 PoE+ HAT ×1, bootable 1TB SSD ×1, fan case ×1
        - Creates: Pi cluster node ×1
    - [`clone-os-to-ssd`](/processes/clone-os-to-ssd)
        - Requires: none
        - Consumes: flashed microSD card ×1, 1TB 2230 M.2 SSD ×1
        - Creates: bootable 1TB SSD ×1

## 5) Set Up a CI Pipeline (`devops/ci-pipeline`)

- Quest link: `/quests/devops/ci-pipeline`
- Unlock prerequisite: `requiresQuests`: ['devops/docker-compose']
- Dialogue `requiresItems` gates:
    - `edit` → “Workflow added.”: CI workflow file ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`create-ci-workflow`](/processes/create-ci-workflow)
        - Requires: GitHub repository ×1
        - Consumes: none
        - Creates: CI workflow file ×1

## 6) Deploy with k3s (`devops/k3s-deploy`)

- Quest link: `/quests/devops/k3s-deploy`
- Unlock prerequisite: `requiresQuests`: ['devops/docker-compose']
- Dialogue `requiresItems` gates:
    - `install` → “Token ready.”: Pi cluster node ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`join-k3s-cluster`](/processes/join-k3s-cluster)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 7) Run a Private Docker Registry (`devops/private-registry`)

- Quest link: `/quests/devops/private-registry`
- Unlock prerequisite: `requiresQuests`: ['devops/docker-compose']
- Dialogue `requiresItems` gates:
    - `deploy` → “Images pushed.”: Pi cluster node ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`run-docker-compose`](/processes/run-docker-compose)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 8) Set Up Monitoring (`devops/monitoring`)

- Quest link: `/quests/devops/monitoring`
- Unlock prerequisite: `requiresQuests`: ['devops/k3s-deploy']
- Dialogue `requiresItems` gates:
    - `install` → “Dashboard up.”: external backup SSD ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`install-monitoring-stack`](/processes/install-monitoring-stack)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: external backup SSD ×1

## 9) Enable Automatic Updates (`devops/auto-updates`)

- Quest link: `/quests/devops/auto-updates`
- Unlock prerequisite: `requiresQuests`: ['devops/monitoring']
- Dialogue `requiresItems` gates:
    - `start` → “Prep the nodes.”: Pi cluster node ×1, Laptop Computer ×1
    - `stage` → “Config pushed across the cluster.”: Pi cluster node ×1, Laptop Computer ×1
    - `verify` → “Health check logged.”: Pi cluster node ×1, unattended-upgrades config ×1
    - `finish` → “Queue the next maintenance window.”: auto-update health report ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`configure-unattended-upgrades`](/processes/configure-unattended-upgrades)
        - Requires: Pi cluster node ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: unattended-upgrades config ×1
    - [`verify-unattended-upgrades`](/processes/verify-unattended-upgrades)
        - Requires: unattended-upgrades config ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: auto-update health report ×1

## 10) Configure Daily Backups (`devops/daily-backups`)

- Quest link: `/quests/devops/daily-backups`
- Unlock prerequisite: `requiresQuests`: ['devops/monitoring']
- Dialogue `requiresItems` gates:
    - `script` → “Backup script running.”: external backup SSD ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`configure-daily-backups`](/processes/configure-daily-backups)
        - Requires: Pi cluster node ×1, external backup SSD ×1
        - Consumes: none
        - Creates: none

## 11) Configure Firewall Rules (`devops/firewall-rules`)

- Quest link: `/quests/devops/firewall-rules`
- Unlock prerequisite: `requiresQuests`: ['devops/auto-updates']
- Dialogue `requiresItems` gates:
    - `setup` → “Rules applied.”: Pi cluster node ×1, Laptop Computer ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`configure-ufw-firewall`](/processes/configure-ufw-firewall)
        - Requires: Laptop Computer ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 12) Secure the Cluster with HTTPS (`devops/enable-https`)

- Quest link: `/quests/devops/enable-https`
- Unlock prerequisite: `requiresQuests`: ['devops/daily-backups']
- Dialogue `requiresItems` gates:
    - `start` → “Stage certbot.”: Pi cluster node ×1, auto-update health report ×1
    - `provision` → “Certificates minted.”: Pi cluster node ×1, auto-update health report ×1
    - `verify` → “TLS health verified.”: TLS certificate bundle ×1, Pi cluster node ×1
    - `finish` → “Document the renewal schedule.”: HTTPS service check ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`request-letsencrypt-cert`](/processes/request-letsencrypt-cert)
        - Requires: auto-update health report ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: TLS certificate bundle ×1
    - [`verify-https-service`](/processes/verify-https-service)
        - Requires: TLS certificate bundle ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: HTTPS service check ×1

## 13) Set Up Log Rotation (`devops/log-maintenance`)

- Quest link: `/quests/devops/log-maintenance`
- Unlock prerequisite: `requiresQuests`: ['devops/daily-backups']
- Dialogue `requiresItems` gates:
    - `rotate` → “Rotation configured”: external backup SSD ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`configure-daily-backups`](/processes/configure-daily-backups)
        - Requires: Pi cluster node ×1, external backup SSD ×1
        - Consumes: none
        - Creates: none

## 14) Harden SSH Access (`devops/ssh-hardening`)

- Quest link: `/quests/devops/ssh-hardening`
- Unlock prerequisite: `requiresQuests`: ['devops/firewall-rules']
- Dialogue `requiresItems` gates:
    - `keys` → “Key installed.”: Pi cluster node ×1, Laptop Computer ×1
    - `config` → “Service restarted.”: Pi cluster node ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`generate-ssh-key`](/processes/generate-ssh-key)
        - Requires: Laptop Computer ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: none
    - [`harden-sshd-config`](/processes/harden-sshd-config)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 15) Block SSH Brute Force (`devops/fail2ban`)

- Quest link: `/quests/devops/fail2ban`
- Unlock prerequisite: `requiresQuests`: ['devops/ssh-hardening']
- Dialogue `requiresItems` gates:
    - `install` → “Bans configured”: Pi cluster node ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## QA flow notes

- Cross-quest dependencies:
    - `devops/pi-cluster-hardware` unlocks after: sysadmin/basic-commands
    - `devops/prepare-first-node` unlocks after: devops/pi-cluster-hardware
    - `devops/docker-compose` unlocks after: devops/prepare-first-node
    - `devops/ssd-boot` unlocks after: devops/prepare-first-node
    - `devops/ci-pipeline` unlocks after: devops/docker-compose
    - `devops/k3s-deploy` unlocks after: devops/docker-compose
    - `devops/private-registry` unlocks after: devops/docker-compose
    - `devops/monitoring` unlocks after: devops/k3s-deploy
    - `devops/auto-updates` unlocks after: devops/monitoring
    - `devops/daily-backups` unlocks after: devops/monitoring
    - `devops/firewall-rules` unlocks after: devops/auto-updates
    - `devops/enable-https` unlocks after: devops/daily-backups
    - `devops/log-maintenance` unlocks after: devops/daily-backups
    - `devops/ssh-hardening` unlocks after: devops/firewall-rules
    - `devops/fail2ban` unlocks after: devops/ssh-hardening
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `configure-daily-backups` is reused in 2 quests (devops/daily-backups, devops/log-maintenance)
    - Process `run-docker-compose` is reused in 2 quests (devops/docker-compose, devops/private-registry)
