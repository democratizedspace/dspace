---
title: 'UBI'
slug: 'ubi'
---

UBI quests cover the `ubi` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Earn basic income](/quests/ubi/basicincome)
2. [Claim Your First UBI](/quests/ubi/first-payment)
3. [Set a UBI Reminder](/quests/ubi/reminder)
4. [Start a Savings Jar](/quests/ubi/savings-goal)

## 1) Earn basic income (`ubi/basicincome`)

- Quest link: `/quests/ubi/basicincome`
- Unlock prerequisite: `requiresQuests`: ['3dprinter/start']
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: dUSD ×100, dBI ×100
- Processes used:
    - [`basic-income`](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## 2) Claim Your First UBI (`ubi/first-payment`)

- Quest link: `/quests/ubi/first-payment`
- Unlock prerequisite: `requiresQuests`: ['ubi/basicincome']
- Dialogue `requiresItems` gates:
    - `claim` → “Funds received”: dBI ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`basic-income`](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## 3) Set a UBI Reminder (`ubi/reminder`)

- Quest link: `/quests/ubi/reminder`
- Unlock prerequisite: `requiresQuests`: ['ubi/first-payment']
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`basic-income`](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## 4) Start a Savings Jar (`ubi/savings-goal`)

- Quest link: `/quests/ubi/savings-goal`
- Unlock prerequisite: `requiresQuests`: ['ubi/first-payment']
- Dialogue `requiresItems` gates:
    - `decide` → “Deposit 10 dUSD.”: dUSD ×10
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`basic-income`](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## QA flow notes

- Cross-quest dependencies:
    - `ubi/basicincome` unlocks after: 3dprinter/start
    - `ubi/first-payment` unlocks after: ubi/basicincome
    - `ubi/reminder` unlocks after: ubi/first-payment
    - `ubi/savings-goal` unlocks after: ubi/first-payment
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `basic-income` is reused in 4 quests (ubi/basicincome, ubi/first-payment, ubi/reminder, ubi/savings-goal)
