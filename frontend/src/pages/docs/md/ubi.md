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

-   Quest link: [/quests/ubi/basicincome](/quests/ubi/basicincome)
-   Unlock prerequisite:
    -   `requiresQuests`: `3dprinter/start`
-   Dialogue `requiresItems` gates:
    -   None
-   Grants:
    -   Dialogue options/steps grantsItems: None
    -   Quest-level `grantsItems`: None
-   Rewards:
    -   dUSD ×100, dBI ×100
-   Processes used:
    -   [basic-income](/processes/basic-income)
        -   Requires: none
        -   Consumes: none
        -   Creates: dUSD ×100, dBI ×100

## 2) Claim Your First UBI (`ubi/first-payment`)

-   Quest link: [/quests/ubi/first-payment](/quests/ubi/first-payment)
-   Unlock prerequisite:
    -   `requiresQuests`: `ubi/basicincome`
-   Dialogue `requiresItems` gates:
    -   `claim` → "Funds received" — dBI ×1
-   Grants:
    -   Dialogue options/steps grantsItems: None
    -   Quest-level `grantsItems`: None
-   Rewards:
    -   cured compost bucket ×1
-   Processes used:
    -   [basic-income](/processes/basic-income)
        -   Requires: none
        -   Consumes: none
        -   Creates: dUSD ×100, dBI ×100

## 3) Set a UBI Reminder (`ubi/reminder`)

-   Quest link: [/quests/ubi/reminder](/quests/ubi/reminder)
-   Unlock prerequisite:
    -   `requiresQuests`: `ubi/first-payment`
-   Dialogue `requiresItems` gates:
    -   None
-   Grants:
    -   Dialogue options/steps grantsItems: None
    -   Quest-level `grantsItems`: None
-   Rewards:
    -   cured compost bucket ×1
-   Processes used:
    -   [basic-income](/processes/basic-income)
        -   Requires: none
        -   Consumes: none
        -   Creates: dUSD ×100, dBI ×100

## 4) Start a Savings Jar (`ubi/savings-goal`)

-   Quest link: [/quests/ubi/savings-goal](/quests/ubi/savings-goal)
-   Unlock prerequisite:
    -   `requiresQuests`: `ubi/first-payment`
-   Dialogue `requiresItems` gates:
    -   `start` → "Deposit 10 dUSD into the sealed savings jar." — sealed savings jar ×1, dUSD ×10
    -   `start` → "I deposited savings. Continue to the withdrawal drill." — sealed savings jar ×1
    -   `buy` → "I bought the jar. Let's deposit." — sealed savings jar ×1
    -   `break` → "Break the jar and recover the saved dUSD." — sealed savings jar ×1
    -   `break` → "I already broke it and withdrew my savings." — broken savings jar ×1
-   Grants:
    -   Dialogue options/steps grantsItems: None
    -   Quest-level `grantsItems`: None
-   Rewards:
    -   cured compost bucket ×1
-   Processes used:
    -   [deposit-savings-jar](/processes/deposit-savings-jar)
        -   Requires: sealed savings jar ×1
        -   Consumes: dUSD ×10
        -   Creates: none
        -   Container effect: increments `sealed savings jar.itemCounts[dUSD]` by 10
    -   [break-savings-jar](/processes/break-savings-jar)
        -   Requires: sealed savings jar ×1
        -   Consumes: sealed savings jar ×1
        -   Creates: broken savings jar ×1
        -   Container effect: releases all stored dUSD from `sealed savings jar.itemCounts[dUSD]` into inventory
    -   [basic-income](/processes/basic-income)
        -   Requires: none
        -   Consumes: none
        -   Creates: dUSD ×100, dBI ×100

## QA flow notes

-   Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
-   Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
-   Known pitfalls: container counts are pooled by item ID, not per individual instance. If a player owns multiple jars, all stored dUSD is tracked on the shared savings jar inventory entry.
