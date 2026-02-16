---
title: 'Ubi'
slug: 'ubi'
---

Ubi quests build practical progression through the ubi skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Earn basic income](/quests/ubi/basicincome)
2. [Claim Your First UBI](/quests/ubi/first-payment)
3. [Set a UBI Reminder](/quests/ubi/reminder)
4. [Start a Savings Jar](/quests/ubi/savings-goal)

## 1) Earn basic income (`ubi/basicincome`)

- Quest link: [/quests/ubi/basicincome](/quests/ubi/basicincome)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinter/start`
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dUSD ×100, dBI ×100
- Processes used:
    - [basic-income](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## 2) Claim Your First UBI (`ubi/first-payment`)

- Quest link: [/quests/ubi/first-payment](/quests/ubi/first-payment)
- Unlock prerequisite:
    - `requiresQuests`: `ubi/basicincome`
- Dialogue `requiresItems` gates:
    - `claim` → "Funds received" — dBI ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [basic-income](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## 3) Set a UBI Reminder (`ubi/reminder`)

- Quest link: [/quests/ubi/reminder](/quests/ubi/reminder)
- Unlock prerequisite:
    - `requiresQuests`: `ubi/first-payment`
- Dialogue `requiresItems` gates:
    - `setup` → "Done. I set a daily phone reminder outside the game." — smartphone ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None (this quest now explicitly instructs an out-of-game phone/calendar reminder)

## 4) Start a Savings Jar (`ubi/savings-goal`)

- Quest link: [/quests/ubi/savings-goal](/quests/ubi/savings-goal)
- Unlock prerequisite:
    - `requiresQuests`: `ubi/first-payment`
- Dialogue `requiresItems` gates:
    - `decide` → "Deposit 10 dUSD." — dUSD ×10
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [basic-income](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
