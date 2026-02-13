---
title: 'Ubi'
slug: 'ubi'
---

This page documents the full **Ubi** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Earn basic income](/quests/ubi/basicincome) (`ubi/basicincome`)
2. [Claim Your First UBI](/quests/ubi/first-payment) (`ubi/first-payment`)
3. [Set a UBI Reminder](/quests/ubi/reminder) (`ubi/reminder`)
4. [Start a Savings Jar](/quests/ubi/savings-goal) (`ubi/savings-goal`)

## Quest details

### 1) Earn basic income (`ubi/basicincome`)
- Quest link: `/quests/ubi/basicincome`
- Unlock prerequisite (`requiresQuests`): `3dprinter/start`
- Dialogue `requiresItems` gates:
  - None
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100; dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x100
- Processes used:
  - [`basic-income`](/processes/basic-income)
    - Requires: None
    - Consumes: None
    - Creates: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100; dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x100

### 2) Claim Your First UBI (`ubi/first-payment`)
- Quest link: `/quests/ubi/first-payment`
- Unlock prerequisite (`requiresQuests`): `ubi/basicincome`
- Dialogue `requiresItems` gates:
  - Node `claim` / Funds received: dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`basic-income`](/processes/basic-income)
    - Requires: None
    - Consumes: None
    - Creates: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100; dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x100

### 3) Set a UBI Reminder (`ubi/reminder`)
- Quest link: `/quests/ubi/reminder`
- Unlock prerequisite (`requiresQuests`): `ubi/first-payment`
- Dialogue `requiresItems` gates:
  - Node `setup` / All set!: dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`basic-income`](/processes/basic-income)
    - Requires: None
    - Consumes: None
    - Creates: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100; dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x100

### 4) Start a Savings Jar (`ubi/savings-goal`)
- Quest link: `/quests/ubi/savings-goal`
- Unlock prerequisite (`requiresQuests`): `ubi/first-payment`
- Dialogue `requiresItems` gates:
  - Node `decide` / Deposit 10 dUSD.: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x10
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`basic-income`](/processes/basic-income)
    - Requires: None
    - Consumes: None
    - Creates: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100; dBI (`016d4758-d114-4e04-9e6a-853db93a2eee`) x100

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
