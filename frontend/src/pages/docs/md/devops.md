---
title: 'Devops'
slug: 'devops'
---

This page documents the full **Devops** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Plan Your Pi Cluster](/quests/devops/pi-cluster-hardware) (`devops/pi-cluster-hardware`)
2. [Prepare the First Node](/quests/devops/prepare-first-node) (`devops/prepare-first-node`)
3. [Launch DSPACE in Docker](/quests/devops/docker-compose) (`devops/docker-compose`)
4. [Set Up a CI Pipeline](/quests/devops/ci-pipeline) (`devops/ci-pipeline`)
5. [Deploy with k3s](/quests/devops/k3s-deploy) (`devops/k3s-deploy`)
6. [Set Up Monitoring](/quests/devops/monitoring) (`devops/monitoring`)
7. [Enable Automatic Updates](/quests/devops/auto-updates) (`devops/auto-updates`)
8. [Configure Daily Backups](/quests/devops/daily-backups) (`devops/daily-backups`)
9. [Secure the Cluster with HTTPS](/quests/devops/enable-https) (`devops/enable-https`)
10. [Configure Firewall Rules](/quests/devops/firewall-rules) (`devops/firewall-rules`)
11. [Set Up Log Rotation](/quests/devops/log-maintenance) (`devops/log-maintenance`)
12. [Run a Private Docker Registry](/quests/devops/private-registry) (`devops/private-registry`)
13. [Boot from SSD](/quests/devops/ssd-boot) (`devops/ssd-boot`)
14. [Harden SSH Access](/quests/devops/ssh-hardening) (`devops/ssh-hardening`)
15. [Block SSH Brute Force](/quests/devops/fail2ban) (`devops/fail2ban`)

## Quest details

### 1) Plan Your Pi Cluster (`devops/pi-cluster-hardware`)
- Quest link: `/quests/devops/pi-cluster-hardware`
- Unlock prerequisite (`requiresQuests`): `sysadmin/basic-commands`
- Dialogue `requiresItems` gates:
  - Node `list` / I've gathered the parts.: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1; M.2 PoE+ HAT (`926cd4e3-3704-423b-96d9-d3da0421b67a`) x1; 1TB 2230 M.2 SSD (`b93065cb-d91e-4712-8edd-a6cfce5fee45`) x1; 64GB microSD card (`36042a2b-861a-4192-a991-98778898963a`) x1; PoE+ switch (`a2f40d22-171e-4f87-b5d4-3a44aee7ad2e`) x1; Ethernet cable (`e709a9fc-dd12-4507-af48-5f83b386b835`) x1; fan case (`231ad01a-fa78-46a7-a590-827bd0c84dec`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 2) Prepare the First Node (`devops/prepare-first-node`)
- Quest link: `/quests/devops/prepare-first-node`
- Unlock prerequisite (`requiresQuests`): `devops/pi-cluster-hardware`
- Dialogue `requiresItems` gates:
  - Node `start` / Card flashed and booted.: flashed microSD card (`e1d61ad5-7f27-4e9b-bfc1-31853d073f5c`) x1
  - Node `update` / System updated.: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`flash-sd-card`](/processes/flash-sd-card)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: 64GB microSD card (`36042a2b-861a-4192-a991-98778898963a`) x1
    - Creates: flashed microSD card (`e1d61ad5-7f27-4e9b-bfc1-31853d073f5c`) x1

### 3) Launch DSPACE in Docker (`devops/docker-compose`)
- Quest link: `/quests/devops/docker-compose`
- Unlock prerequisite (`requiresQuests`): `devops/prepare-first-node`
- Dialogue `requiresItems` gates:
  - Node `start` / Container running.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
  - Node `tunnel` / Tunnel online.: PoE+ switch (`a2f40d22-171e-4f87-b5d4-3a44aee7ad2e`) x1; Ethernet cable (`e709a9fc-dd12-4507-af48-5f83b386b835`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`create-cloudflare-tunnel`](/processes/create-cloudflare-tunnel)
    - Requires: PoE+ switch (`a2f40d22-171e-4f87-b5d4-3a44aee7ad2e`) x1; Ethernet cable (`e709a9fc-dd12-4507-af48-5f83b386b835`) x1
    - Consumes: None
    - Creates: None
  - [`run-docker-compose`](/processes/run-docker-compose)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: None

### 4) Set Up a CI Pipeline (`devops/ci-pipeline`)
- Quest link: `/quests/devops/ci-pipeline`
- Unlock prerequisite (`requiresQuests`): `devops/docker-compose`
- Dialogue `requiresItems` gates:
  - Node `edit` / Workflow added.: CI workflow file (`306793ac-e420-4859-9742-9076fff6ab57`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`create-ci-workflow`](/processes/create-ci-workflow)
    - Requires: GitHub repository (`52593d07-908b-4109-92cf-826b2184ef6f`) x1
    - Consumes: None
    - Creates: CI workflow file (`306793ac-e420-4859-9742-9076fff6ab57`) x1

### 5) Deploy with k3s (`devops/k3s-deploy`)
- Quest link: `/quests/devops/k3s-deploy`
- Unlock prerequisite (`requiresQuests`): `devops/docker-compose`
- Dialogue `requiresItems` gates:
  - Node `install` / Token ready.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`join-k3s-cluster`](/processes/join-k3s-cluster)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: None

### 6) Set Up Monitoring (`devops/monitoring`)
- Quest link: `/quests/devops/monitoring`
- Unlock prerequisite (`requiresQuests`): `devops/k3s-deploy`
- Dialogue `requiresItems` gates:
  - Node `install` / Dashboard up.: external backup SSD (`849eb5e1-9f63-488b-80d3-913492049090`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`install-monitoring-stack`](/processes/install-monitoring-stack)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: external backup SSD (`849eb5e1-9f63-488b-80d3-913492049090`) x1

### 7) Enable Automatic Updates (`devops/auto-updates`)
- Quest link: `/quests/devops/auto-updates`
- Unlock prerequisite (`requiresQuests`): `devops/monitoring`
- Dialogue `requiresItems` gates:
  - Node `start` / Prep the nodes.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `stage` / Config pushed across the cluster.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `verify` / Health check logged.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; unattended-upgrades config (`d8346735-7f1c-4309-a400-6cf6801534f7`) x1
  - Node `finish` / Queue the next maintenance window.: auto-update health report (`afd6a926-bd21-4242-ba79-d25fc152de03`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`configure-unattended-upgrades`](/processes/configure-unattended-upgrades)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: unattended-upgrades config (`d8346735-7f1c-4309-a400-6cf6801534f7`) x1
  - [`verify-unattended-upgrades`](/processes/verify-unattended-upgrades)
    - Requires: unattended-upgrades config (`d8346735-7f1c-4309-a400-6cf6801534f7`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: auto-update health report (`afd6a926-bd21-4242-ba79-d25fc152de03`) x1

### 8) Configure Daily Backups (`devops/daily-backups`)
- Quest link: `/quests/devops/daily-backups`
- Unlock prerequisite (`requiresQuests`): `devops/monitoring`
- Dialogue `requiresItems` gates:
  - Node `script` / Backup script running.: external backup SSD (`849eb5e1-9f63-488b-80d3-913492049090`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`configure-daily-backups`](/processes/configure-daily-backups)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; external backup SSD (`849eb5e1-9f63-488b-80d3-913492049090`) x1
    - Consumes: None
    - Creates: None

### 9) Secure the Cluster with HTTPS (`devops/enable-https`)
- Quest link: `/quests/devops/enable-https`
- Unlock prerequisite (`requiresQuests`): `devops/daily-backups`
- Dialogue `requiresItems` gates:
  - Node `start` / Stage certbot.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; auto-update health report (`afd6a926-bd21-4242-ba79-d25fc152de03`) x1
  - Node `provision` / Certificates minted.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; auto-update health report (`afd6a926-bd21-4242-ba79-d25fc152de03`) x1
  - Node `verify` / TLS health verified.: TLS certificate bundle (`fc89727c-8fd9-4b40-a186-40a0c56c6063`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
  - Node `finish` / Document the renewal schedule.: HTTPS service check (`d3d0a7bd-e338-48f1-86ab-ddcc3626cecc`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`request-letsencrypt-cert`](/processes/request-letsencrypt-cert)
    - Requires: auto-update health report (`afd6a926-bd21-4242-ba79-d25fc152de03`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: TLS certificate bundle (`fc89727c-8fd9-4b40-a186-40a0c56c6063`) x1
  - [`verify-https-service`](/processes/verify-https-service)
    - Requires: TLS certificate bundle (`fc89727c-8fd9-4b40-a186-40a0c56c6063`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: HTTPS service check (`d3d0a7bd-e338-48f1-86ab-ddcc3626cecc`) x1

### 10) Configure Firewall Rules (`devops/firewall-rules`)
- Quest link: `/quests/devops/firewall-rules`
- Unlock prerequisite (`requiresQuests`): `devops/auto-updates`
- Dialogue `requiresItems` gates:
  - Node `setup` / Rules applied.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`configure-ufw-firewall`](/processes/configure-ufw-firewall)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: None

### 11) Set Up Log Rotation (`devops/log-maintenance`)
- Quest link: `/quests/devops/log-maintenance`
- Unlock prerequisite (`requiresQuests`): `devops/daily-backups`
- Dialogue `requiresItems` gates:
  - Node `rotate` / Rotation configured: external backup SSD (`849eb5e1-9f63-488b-80d3-913492049090`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`configure-daily-backups`](/processes/configure-daily-backups)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; external backup SSD (`849eb5e1-9f63-488b-80d3-913492049090`) x1
    - Consumes: None
    - Creates: None

### 12) Run a Private Docker Registry (`devops/private-registry`)
- Quest link: `/quests/devops/private-registry`
- Unlock prerequisite (`requiresQuests`): `devops/docker-compose`
- Dialogue `requiresItems` gates:
  - Node `deploy` / Images pushed.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`run-docker-compose`](/processes/run-docker-compose)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: None

### 13) Boot from SSD (`devops/ssd-boot`)
- Quest link: `/quests/devops/ssd-boot`
- Unlock prerequisite (`requiresQuests`): `devops/prepare-first-node`
- Dialogue `requiresItems` gates:
  - Node `clone` / Clone complete.: bootable 1TB SSD (`4af856b5-b5c1-494f-8037-9b6559785633`) x1
  - Node `move` / Booted from SSD.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-pi-node`](/processes/assemble-pi-node)
    - Requires: None
    - Consumes: Raspberry Pi 5 board (`ce140453-c7ef-42c9-b9f9-38acfb4219cf`) x1; M.2 PoE+ HAT (`926cd4e3-3704-423b-96d9-d3da0421b67a`) x1; bootable 1TB SSD (`4af856b5-b5c1-494f-8037-9b6559785633`) x1; fan case (`231ad01a-fa78-46a7-a590-827bd0c84dec`) x1
    - Creates: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
  - [`clone-os-to-ssd`](/processes/clone-os-to-ssd)
    - Requires: None
    - Consumes: flashed microSD card (`e1d61ad5-7f27-4e9b-bfc1-31853d073f5c`) x1; 1TB 2230 M.2 SSD (`b93065cb-d91e-4712-8edd-a6cfce5fee45`) x1
    - Creates: bootable 1TB SSD (`4af856b5-b5c1-494f-8037-9b6559785633`) x1

### 14) Harden SSH Access (`devops/ssh-hardening`)
- Quest link: `/quests/devops/ssh-hardening`
- Unlock prerequisite (`requiresQuests`): `devops/firewall-rules`
- Dialogue `requiresItems` gates:
  - Node `keys` / Key installed.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
  - Node `config` / Service restarted.: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`generate-ssh-key`](/processes/generate-ssh-key)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1; Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: None
  - [`harden-sshd-config`](/processes/harden-sshd-config)
    - Requires: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
    - Consumes: None
    - Creates: None

### 15) Block SSH Brute Force (`devops/fail2ban`)
- Quest link: `/quests/devops/fail2ban`
- Unlock prerequisite (`requiresQuests`): `devops/ssh-hardening`
- Dialogue `requiresItems` gates:
  - Node `install` / Bans configured: Pi cluster node (`df7e94e2-76b9-4865-b843-2ec21feb258e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

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
