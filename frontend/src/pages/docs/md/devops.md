---
title: 'Devops'
slug: 'devops'
---

Devops quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Plan Your Pi Cluster (`devops/pi-cluster-hardware`)

- Quest link: [/quests/devops/pi-cluster-hardware](/quests/devops/pi-cluster-hardware)
- Unlock prerequisite:
  - `sysadmin/basic-commands`
- Dialogue `requiresItems` gates:
  - `list` → "I've gathered the parts."
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
    - 926cd4e3-3704-423b-96d9-d3da0421b67a ×1
    - b93065cb-d91e-4712-8edd-a6cfce5fee45 ×1
    - 36042a2b-861a-4192-a991-98778898963a ×1
    - a2f40d22-171e-4f87-b5d4-3a44aee7ad2e ×1
    - e709a9fc-dd12-4507-af48-5f83b386b835 ×1
    - 231ad01a-fa78-46a7-a590-827bd0c84dec ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 2) Prepare the First Node (`devops/prepare-first-node`)

- Quest link: [/quests/devops/prepare-first-node](/quests/devops/prepare-first-node)
- Unlock prerequisite:
  - `devops/pi-cluster-hardware`
- Dialogue `requiresItems` gates:
  - `start` → "Card flashed and booted."
    - e1d61ad5-7f27-4e9b-bfc1-31853d073f5c ×1
  - `update` → "System updated."
    - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [flash-sd-card](/processes/flash-sd-card)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - 36042a2b-861a-4192-a991-98778898963a ×1
    - Creates:
      - e1d61ad5-7f27-4e9b-bfc1-31853d073f5c ×1

---

## 3) Launch DSPACE in Docker (`devops/docker-compose`)

- Quest link: [/quests/devops/docker-compose](/quests/devops/docker-compose)
- Unlock prerequisite:
  - `devops/prepare-first-node`
- Dialogue `requiresItems` gates:
  - `start` → "Container running."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
  - `tunnel` → "Tunnel online."
    - a2f40d22-171e-4f87-b5d4-3a44aee7ad2e ×1
    - e709a9fc-dd12-4507-af48-5f83b386b835 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [create-cloudflare-tunnel](/processes/create-cloudflare-tunnel)
    - Requires:
      - a2f40d22-171e-4f87-b5d4-3a44aee7ad2e ×1
      - e709a9fc-dd12-4507-af48-5f83b386b835 ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [run-docker-compose](/processes/run-docker-compose)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 4) Set Up a CI Pipeline (`devops/ci-pipeline`)

- Quest link: [/quests/devops/ci-pipeline](/quests/devops/ci-pipeline)
- Unlock prerequisite:
  - `devops/docker-compose`
- Dialogue `requiresItems` gates:
  - `edit` → "Workflow added."
    - 306793ac-e420-4859-9742-9076fff6ab57 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [create-ci-workflow](/processes/create-ci-workflow)
    - Requires:
      - 52593d07-908b-4109-92cf-826b2184ef6f ×1
    - Consumes:
      - None
    - Creates:
      - 306793ac-e420-4859-9742-9076fff6ab57 ×1

---

## 5) Deploy with k3s (`devops/k3s-deploy`)

- Quest link: [/quests/devops/k3s-deploy](/quests/devops/k3s-deploy)
- Unlock prerequisite:
  - `devops/docker-compose`
- Dialogue `requiresItems` gates:
  - `install` → "Token ready."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [join-k3s-cluster](/processes/join-k3s-cluster)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 6) Set Up Monitoring (`devops/monitoring`)

- Quest link: [/quests/devops/monitoring](/quests/devops/monitoring)
- Unlock prerequisite:
  - `devops/k3s-deploy`
- Dialogue `requiresItems` gates:
  - `install` → "Dashboard up."
    - 849eb5e1-9f63-488b-80d3-913492049090 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [install-monitoring-stack](/processes/install-monitoring-stack)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - 849eb5e1-9f63-488b-80d3-913492049090 ×1

---

## 7) Enable Automatic Updates (`devops/auto-updates`)

- Quest link: [/quests/devops/auto-updates](/quests/devops/auto-updates)
- Unlock prerequisite:
  - `devops/monitoring`
- Dialogue `requiresItems` gates:
  - `start` → "Prep the nodes."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `stage` → "Config pushed across the cluster."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `verify` → "Health check logged."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - d8346735-7f1c-4309-a400-6cf6801534f7 ×1
  - `finish` → "Queue the next maintenance window."
    - afd6a926-bd21-4242-ba79-d25fc152de03 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 8) Configure Daily Backups (`devops/daily-backups`)

- Quest link: [/quests/devops/daily-backups](/quests/devops/daily-backups)
- Unlock prerequisite:
  - `devops/monitoring`
- Dialogue `requiresItems` gates:
  - `script` → "Backup script running."
    - 849eb5e1-9f63-488b-80d3-913492049090 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [configure-daily-backups](/processes/configure-daily-backups)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
      - 849eb5e1-9f63-488b-80d3-913492049090 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 9) Secure the Cluster with HTTPS (`devops/enable-https`)

- Quest link: [/quests/devops/enable-https](/quests/devops/enable-https)
- Unlock prerequisite:
  - `devops/daily-backups`
- Dialogue `requiresItems` gates:
  - `start` → "Stage certbot."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - afd6a926-bd21-4242-ba79-d25fc152de03 ×1
  - `provision` → "Certificates minted."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - afd6a926-bd21-4242-ba79-d25fc152de03 ×1
  - `verify` → "TLS health verified."
    - fc89727c-8fd9-4b40-a186-40a0c56c6063 ×1
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
  - `finish` → "Document the renewal schedule."
    - d3d0a7bd-e338-48f1-86ab-ddcc3626cecc ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 10) Configure Firewall Rules (`devops/firewall-rules`)

- Quest link: [/quests/devops/firewall-rules](/quests/devops/firewall-rules)
- Unlock prerequisite:
  - `devops/auto-updates`
- Dialogue `requiresItems` gates:
  - `setup` → "Rules applied."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [configure-ufw-firewall](/processes/configure-ufw-firewall)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 11) Set Up Log Rotation (`devops/log-maintenance`)

- Quest link: [/quests/devops/log-maintenance](/quests/devops/log-maintenance)
- Unlock prerequisite:
  - `devops/daily-backups`
- Dialogue `requiresItems` gates:
  - `rotate` → "Rotation configured"
    - 849eb5e1-9f63-488b-80d3-913492049090 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [configure-daily-backups](/processes/configure-daily-backups)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
      - 849eb5e1-9f63-488b-80d3-913492049090 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 12) Run a Private Docker Registry (`devops/private-registry`)

- Quest link: [/quests/devops/private-registry](/quests/devops/private-registry)
- Unlock prerequisite:
  - `devops/docker-compose`
- Dialogue `requiresItems` gates:
  - `deploy` → "Images pushed."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [run-docker-compose](/processes/run-docker-compose)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 13) Boot from SSD (`devops/ssd-boot`)

- Quest link: [/quests/devops/ssd-boot](/quests/devops/ssd-boot)
- Unlock prerequisite:
  - `devops/prepare-first-node`
- Dialogue `requiresItems` gates:
  - `clone` → "Clone complete."
    - 4af856b5-b5c1-494f-8037-9b6559785633 ×1
  - `move` → "Booted from SSD."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-pi-node](/processes/assemble-pi-node)
    - Requires:
      - None
    - Consumes:
      - ce140453-c7ef-42c9-b9f9-38acfb4219cf ×1
      - 926cd4e3-3704-423b-96d9-d3da0421b67a ×1
      - 4af856b5-b5c1-494f-8037-9b6559785633 ×1
      - 231ad01a-fa78-46a7-a590-827bd0c84dec ×1
    - Creates:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
  - [clone-os-to-ssd](/processes/clone-os-to-ssd)
    - Requires:
      - None
    - Consumes:
      - e1d61ad5-7f27-4e9b-bfc1-31853d073f5c ×1
      - b93065cb-d91e-4712-8edd-a6cfce5fee45 ×1
    - Creates:
      - 4af856b5-b5c1-494f-8037-9b6559785633 ×1

---

## 14) Harden SSH Access (`devops/ssh-hardening`)

- Quest link: [/quests/devops/ssh-hardening](/quests/devops/ssh-hardening)
- Unlock prerequisite:
  - `devops/firewall-rules`
- Dialogue `requiresItems` gates:
  - `keys` → "Key installed."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
  - `config` → "Service restarted."
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [generate-ssh-key](/processes/generate-ssh-key)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [harden-sshd-config](/processes/harden-sshd-config)
    - Requires:
      - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 15) Block SSH Brute Force (`devops/fail2ban`)

- Quest link: [/quests/devops/fail2ban](/quests/devops/fail2ban)
- Unlock prerequisite:
  - `devops/ssh-hardening`
- Dialogue `requiresItems` gates:
  - `install` → "Bans configured"
    - df7e94e2-76b9-4865-b843-2ec21feb258e ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## QA flow notes

- Cross-quest dependencies:
  - `devops/pi-cluster-hardware` depends on external quests: `sysadmin/basic-commands`.
- Progression integrity checks:
  - `devops/pi-cluster-hardware`: verify prerequisite completion and inventory gates.
  - `devops/prepare-first-node`: verify prerequisite completion and inventory gates.
  - `devops/docker-compose`: verify prerequisite completion and inventory gates.
  - `devops/ci-pipeline`: verify prerequisite completion and inventory gates.
  - `devops/k3s-deploy`: verify prerequisite completion and inventory gates.
  - `devops/monitoring`: verify prerequisite completion and inventory gates.
  - `devops/auto-updates`: verify prerequisite completion and inventory gates.
  - `devops/daily-backups`: verify prerequisite completion and inventory gates.
  - `devops/enable-https`: verify prerequisite completion and inventory gates.
  - `devops/firewall-rules`: verify prerequisite completion and inventory gates.
  - `devops/log-maintenance`: verify prerequisite completion and inventory gates.
  - `devops/private-registry`: verify prerequisite completion and inventory gates.
  - `devops/ssd-boot`: verify prerequisite completion and inventory gates.
  - `devops/ssh-hardening`: verify prerequisite completion and inventory gates.
  - `devops/fail2ban`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
