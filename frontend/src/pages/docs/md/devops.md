---
title: 'Devops'
slug: 'devops'
---

Devops quests build practical progression through the devops skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Plan Your Pi Cluster](/quests/devops/pi-cluster-hardware)
2. [Prepare the First Node](/quests/devops/prepare-first-node)
3. [Launch DSPACE in Docker](/quests/devops/docker-compose)
4. [Set Up a CI Pipeline](/quests/devops/ci-pipeline)
5. [Deploy with k3s](/quests/devops/k3s-deploy)
6. [Set Up Monitoring](/quests/devops/monitoring)
7. [Enable Automatic Updates](/quests/devops/auto-updates)
8. [Configure Daily Backups](/quests/devops/daily-backups)
9. [Secure the Cluster with HTTPS](/quests/devops/enable-https)
10. [Configure Firewall Rules](/quests/devops/firewall-rules)
11. [Set Up Log Rotation](/quests/devops/log-maintenance)
12. [Run a Private Docker Registry](/quests/devops/private-registry)
13. [Boot from SSD](/quests/devops/ssd-boot)
14. [Harden SSH Access](/quests/devops/ssh-hardening)
15. [Block SSH Brute Force](/quests/devops/fail2ban)

## 1) Plan Your Pi Cluster (`devops/pi-cluster-hardware`)

- Quest link: [/quests/devops/pi-cluster-hardware](/quests/devops/pi-cluster-hardware)
- Unlock prerequisite:
    - `requiresQuests`: `sysadmin/basic-commands`
- Dialogue `requiresItems` gates:
    - `list` → "I've gathered the parts." — Raspberry Pi 5 board ×1, M.2 PoE+ HAT ×1, 1TB 2230 M.2 SSD ×1, 64GB microSD card ×1, PoE+ switch ×1, Ethernet cable ×1, fan case ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## 2) Prepare the First Node (`devops/prepare-first-node`)

- Quest link: [/quests/devops/prepare-first-node](/quests/devops/prepare-first-node)
- Unlock prerequisite:
    - `requiresQuests`: `devops/pi-cluster-hardware`
- Dialogue `requiresItems` gates:
    - `start` → "Card flashed and booted." — flashed microSD card ×1
    - `update` → "System updated." — Raspberry Pi 5 board ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [flash-sd-card](/processes/flash-sd-card)
        - Requires: Laptop Computer ×1
        - Consumes: 64GB microSD card ×1
        - Creates: flashed microSD card ×1

## 3) Launch DSPACE in Docker (`devops/docker-compose`)

- Quest link: [/quests/devops/docker-compose](/quests/devops/docker-compose)
- Unlock prerequisite:
    - `requiresQuests`: `devops/prepare-first-node`
- Dialogue `requiresItems` gates:
    - `start` → "Container running." — Pi cluster node ×1
    - `tunnel` → "Tunnel online." — PoE+ switch ×1, Ethernet cable ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [run-docker-compose](/processes/run-docker-compose)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none
    - [create-cloudflare-tunnel](/processes/create-cloudflare-tunnel)
        - Requires: PoE+ switch ×1, Ethernet cable ×1
        - Consumes: none
        - Creates: none

## 4) Set Up a CI Pipeline (`devops/ci-pipeline`)

- Quest link: [/quests/devops/ci-pipeline](/quests/devops/ci-pipeline)
- Unlock prerequisite:
    - `requiresQuests`: `devops/docker-compose`
- Dialogue `requiresItems` gates:
    - `edit` → "Workflow added." — CI workflow file ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [create-ci-workflow](/processes/create-ci-workflow)
        - Requires: GitHub repository ×1
        - Consumes: none
        - Creates: CI workflow file ×1

## 5) Deploy with k3s (`devops/k3s-deploy`)

- Quest link: [/quests/devops/k3s-deploy](/quests/devops/k3s-deploy)
- Unlock prerequisite:
    - `requiresQuests`: `devops/docker-compose`
- Dialogue `requiresItems` gates:
    - `install` → "Token ready." — Pi cluster node ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [join-k3s-cluster](/processes/join-k3s-cluster)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 6) Set Up Monitoring (`devops/monitoring`)

- Quest link: [/quests/devops/monitoring](/quests/devops/monitoring)
- Unlock prerequisite:
    - `requiresQuests`: `devops/k3s-deploy`
- Dialogue `requiresItems` gates:
    - `install` → "Dashboard up." — external backup SSD ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [install-monitoring-stack](/processes/install-monitoring-stack)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: external backup SSD ×1

## 7) Enable Automatic Updates (`devops/auto-updates`)

- Quest link: [/quests/devops/auto-updates](/quests/devops/auto-updates)
- Unlock prerequisite:
    - `requiresQuests`: `devops/monitoring`
- Dialogue `requiresItems` gates:
    - `start` → "Prep the nodes." — Pi cluster node ×1, Laptop Computer ×1
    - `stage` → "Config pushed across the cluster." — Pi cluster node ×1, Laptop Computer ×1
    - `verify` → "Health check logged." — Pi cluster node ×1, unattended-upgrades config ×1
    - `finish` → "Queue the next maintenance window." — auto-update health report ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [configure-unattended-upgrades](/processes/configure-unattended-upgrades)
        - Requires: Pi cluster node ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: unattended-upgrades config ×1
    - [verify-unattended-upgrades](/processes/verify-unattended-upgrades)
        - Requires: unattended-upgrades config ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: auto-update health report ×1

## 8) Configure Daily Backups (`devops/daily-backups`)

- Quest link: [/quests/devops/daily-backups](/quests/devops/daily-backups)
- Unlock prerequisite:
    - `requiresQuests`: `devops/monitoring`
- Dialogue `requiresItems` gates:
    - `script` → "Backup script running." — external backup SSD ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [configure-daily-backups](/processes/configure-daily-backups)
        - Requires: Pi cluster node ×1, external backup SSD ×1
        - Consumes: none
        - Creates: none

## 9) Secure the Cluster with HTTPS (`devops/enable-https`)

- Quest link: [/quests/devops/enable-https](/quests/devops/enable-https)
- Unlock prerequisite:
    - `requiresQuests`: `devops/daily-backups`
- Dialogue `requiresItems` gates:
    - `start` → "Stage certbot." — Pi cluster node ×1, auto-update health report ×1
    - `provision` → "Certificates minted." — Pi cluster node ×1, auto-update health report ×1
    - `verify` → "TLS health verified." — TLS certificate bundle ×1, Pi cluster node ×1
    - `finish` → "Document the renewal schedule." — HTTPS service check ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [request-letsencrypt-cert](/processes/request-letsencrypt-cert)
        - Requires: auto-update health report ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: TLS certificate bundle ×1
    - [verify-https-service](/processes/verify-https-service)
        - Requires: TLS certificate bundle ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: HTTPS service check ×1

## 10) Configure Firewall Rules (`devops/firewall-rules`)

- Quest link: [/quests/devops/firewall-rules](/quests/devops/firewall-rules)
- Unlock prerequisite:
    - `requiresQuests`: `devops/auto-updates`
- Dialogue `requiresItems` gates:
    - `setup` → "Rules applied." — Pi cluster node ×1, Laptop Computer ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [configure-ufw-firewall](/processes/configure-ufw-firewall)
        - Requires: Laptop Computer ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 11) Set Up Log Rotation (`devops/log-maintenance`)

- Quest link: [/quests/devops/log-maintenance](/quests/devops/log-maintenance)
- Unlock prerequisite:
    - `requiresQuests`: `devops/daily-backups`
- Dialogue `requiresItems` gates:
    - `rotate` → "Rotation configured" — external backup SSD ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [configure-daily-backups](/processes/configure-daily-backups)
        - Requires: Pi cluster node ×1, external backup SSD ×1
        - Consumes: none
        - Creates: none

## 12) Run a Private Docker Registry (`devops/private-registry`)

- Quest link: [/quests/devops/private-registry](/quests/devops/private-registry)
- Unlock prerequisite:
    - `requiresQuests`: `devops/docker-compose`
- Dialogue `requiresItems` gates:
    - `deploy` → "Images pushed." — Pi cluster node ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [run-docker-compose](/processes/run-docker-compose)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 13) Boot from SSD (`devops/ssd-boot`)

- Quest link: [/quests/devops/ssd-boot](/quests/devops/ssd-boot)
- Unlock prerequisite:
    - `requiresQuests`: `devops/prepare-first-node`
- Dialogue `requiresItems` gates:
    - `clone` → "Clone complete." — bootable 1TB SSD ×1
    - `move` → "Booted from SSD." — Pi cluster node ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [clone-os-to-ssd](/processes/clone-os-to-ssd)
        - Requires: none
        - Consumes: flashed microSD card ×1, 1TB 2230 M.2 SSD ×1
        - Creates: bootable 1TB SSD ×1
    - [assemble-pi-node](/processes/assemble-pi-node)
        - Requires: none
        - Consumes: Raspberry Pi 5 board ×1, M.2 PoE+ HAT ×1, bootable 1TB SSD ×1, fan case ×1
        - Creates: Pi cluster node ×1

## 14) Harden SSH Access (`devops/ssh-hardening`)

- Quest link: [/quests/devops/ssh-hardening](/quests/devops/ssh-hardening)
- Unlock prerequisite:
    - `requiresQuests`: `devops/firewall-rules`
- Dialogue `requiresItems` gates:
    - `keys` → "Key installed." — Pi cluster node ×1, Laptop Computer ×1
    - `config` → "Service restarted." — Pi cluster node ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [generate-ssh-key](/processes/generate-ssh-key)
        - Requires: Laptop Computer ×1, Pi cluster node ×1
        - Consumes: none
        - Creates: none
    - [harden-sshd-config](/processes/harden-sshd-config)
        - Requires: Pi cluster node ×1
        - Consumes: none
        - Creates: none

## 15) Block SSH Brute Force (`devops/fail2ban`)

- Quest link: [/quests/devops/fail2ban](/quests/devops/fail2ban)
- Unlock prerequisite:
    - `requiresQuests`: `devops/ssh-hardening`
- Dialogue `requiresItems` gates:
    - `install` → "Bans configured" — Pi cluster node ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
