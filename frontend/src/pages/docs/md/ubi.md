---
title: 'Ubi'
slug: 'ubi'
---

Ubi quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Earn basic income](/quests/ubi/basicincome) (`ubi/basicincome`)
2. [Claim Your First UBI](/quests/ubi/first-payment) (`ubi/first-payment`)
3. [Set a UBI Reminder](/quests/ubi/reminder) (`ubi/reminder`)
4. [Start a Savings Jar](/quests/ubi/savings-goal) (`ubi/savings-goal`)

---

## 1) Earn basic income (`ubi/basicincome`)

- Quest link: [/quests/ubi/basicincome](/quests/ubi/basicincome)
- Unlock prerequisite:
  - `3dprinter/start`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
  - 016d4758-d114-4e04-9e6a-853db93a2eee ×100
- Processes used:
  - [basic-income](/processes/basic-income)
    - Requires:
      - None
    - Consumes:
      - None
    - Creates:
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
      - 016d4758-d114-4e04-9e6a-853db93a2eee ×100

---

## 2) Claim Your First UBI (`ubi/first-payment`)

- Quest link: [/quests/ubi/first-payment](/quests/ubi/first-payment)
- Unlock prerequisite:
  - `ubi/basicincome`
- Dialogue `requiresItems` gates:
  - `claim` → "Funds received"
    - 016d4758-d114-4e04-9e6a-853db93a2eee ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [basic-income](/processes/basic-income)
    - Requires:
      - None
    - Consumes:
      - None
    - Creates:
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
      - 016d4758-d114-4e04-9e6a-853db93a2eee ×100

---

## 3) Set a UBI Reminder (`ubi/reminder`)

- Quest link: [/quests/ubi/reminder](/quests/ubi/reminder)
- Unlock prerequisite:
  - `ubi/first-payment`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [basic-income](/processes/basic-income)
    - Requires:
      - None
    - Consumes:
      - None
    - Creates:
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
      - 016d4758-d114-4e04-9e6a-853db93a2eee ×100

---

## 4) Start a Savings Jar (`ubi/savings-goal`)

- Quest link: [/quests/ubi/savings-goal](/quests/ubi/savings-goal)
- Unlock prerequisite:
  - `ubi/first-payment`
- Dialogue `requiresItems` gates:
  - `decide` → "Deposit 10 dUSD."
    - 5247a603-294a-4a34-a884-1ae20969b2a1 ×10
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [basic-income](/processes/basic-income)
    - Requires:
      - None
    - Consumes:
      - None
    - Creates:
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
      - 016d4758-d114-4e04-9e6a-853db93a2eee ×100

---

## QA flow notes

- Cross-quest dependencies:
  - `ubi/basicincome` depends on external quests: `3dprinter/start`.
- Progression integrity checks:
  - `ubi/basicincome`: verify prerequisite completion and inventory gates.
  - `ubi/first-payment`: verify prerequisite completion and inventory gates.
  - `ubi/reminder`: verify prerequisite completion and inventory gates.
  - `ubi/savings-goal`: verify prerequisite completion and inventory gates (notable count gates: 5247a603-294a-4a34-a884-1ae20969b2a1 ×10).
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
