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
    - `claim-process` → "Process finished. I am ready to verify balances." — dBI ×150 and dUSD ×150
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

- QA hardening notes:
    - Added two progression branches (clean claim flow vs troubleshooting for cooldown/card visibility).
    - Completion now requires mechanics-backed balance evidence (dBI + dUSD threshold gate) before finish; troubleshooting now routes to a safe stop/restart path instead of quest completion.
    - Added a repeatable daily operating checklist branch.

## 3) Set a UBI Reminder (`ubi/reminder`)

- Quest link: [/quests/ubi/reminder](/quests/ubi/reminder)
- Unlock prerequisite:
    - `requiresQuests`: `ubi/first-payment`
- Dialogue `requiresItems` gates:
    - `verify-signal` → "Verified dBI balance and reminder label." — dBI ×100
- Player action expectation:
    - This quest instructs the player to create a recurring reminder in their IRL phone reminder/alarm app.
    - DSpace does **not** create in-game reminders for this quest.
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - None (player action is setting an IRL phone reminder; the UBI claim process is run later outside this quest dialogue)

- QA hardening notes:
    - Added non-linear branch selection (strict routine vs fallback routine).
    - Added a troubleshooting branch for notifications/timezone/permission failures and recovery loop.
    - Added an in-game evidence gate tying reminder setup to an active UBI wallet state.

## 4) Start a Savings Jar (`ubi/savings-goal`)

- Quest link: [/quests/ubi/savings-goal](/quests/ubi/savings-goal)
- Unlock prerequisite:
    - `requiresQuests`: `ubi/first-payment`
- Dialogue `requiresItems` gates:
    - `buy-jar` → "I bought the savings jar." — savings jar ×1
    - `deposit-choice` → "Single deposit plan (I have at least 100 dUSD)." — dUSD ×100
    - `single-deposit` → "Deposit complete. Verify stored balance now." — dUSD ×90
    - `staged-deposit` → "Top-up done. Proceed with jar deposit." — dUSD ×100
    - `verify-store` → "Stored value confirmed and break-risk understood." — savings jar ×1
    - `budget-recovery` → "Recovery complete. Retry jar setup." — dUSD ×100
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - dUSD ×1
- Processes used:
    - [basic-income](/processes/basic-income)
        - Requires: none
        - Consumes: none
        - Creates: dUSD ×100, dBI ×100
    - [savings-jar-deposit](/processes/savings-jar-deposit)
        - Requires: savings jar ×1
        - Consumes: dUSD ×10
        - Creates: none (stores 10 dUSD in jar container balance)
    - [savings-jar-break](/processes/savings-jar-break)
        - Requires: savings jar ×1
        - Consumes: savings jar ×1
        - Creates: broken savings jar ×1 and returns all stored dUSD from container balance

- QA hardening notes:
    - Added alternate strategy branch (single-deposit vs staged top-up path).
    - Added budget/inventory recovery loop using `basic-income` when balances are short.
    - Added operational safety guidance to verify stored value before any jar break action.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
