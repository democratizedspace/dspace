---
title: 'Welcome'
slug: 'welcome'
---

Welcome quests build practical progression through the welcome skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [How to do quests](/quests/welcome/howtodoquests)
2. [Check Your Inventory](/quests/welcome/intro-inventory)
3. [Connect GitHub](/quests/welcome/connect-github)
4. [Run the Test Suite](/quests/welcome/run-tests)
5. [Smart Plug Test](/quests/welcome/smart-plug-test)

## 1) How to do quests (`welcome/howtodoquests`)

- Quest link: [/quests/welcome/howtodoquests](/quests/welcome/howtodoquests)
- Unlock prerequisite:
  - `requiresQuests`: None
- Dialogue `requiresItems` gates:
  - `expert` → "Alright, now can I skip?" — smart plug ×1
  - `items` → "Like this, right?" — dCarbon ×1
  - `processes` → "dWatt...? What's this?" — dWatt ×3000
- Grants:
  - `expert` → "What's this?" — smart plug ×1
  - `items` → "Great, free stuff! Thanks!" — dCarbon ×10, dUSD ×100
  - `processes` → "Looks like I need this to finish the process." — smart plug ×1
  - Quest-level `grantsItems`: None
- Rewards:
  - dChat ×1, dUSD ×1000
- Processes used:
  - [outlet-dWatt-1e3](/processes/outlet-dWatt-1e3)
    - Requires: smart plug ×1
    - Consumes: dUSD ×0.18
    - Creates: dWatt ×1000, dCarbon ×0.98

## 2) Check Your Inventory (`welcome/intro-inventory`)

- Quest link: [/quests/welcome/intro-inventory](/quests/welcome/intro-inventory)
- Unlock prerequisite:
  - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `buy-sell` → "Bought electrical tape" — electrical tape ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - dUSD ×120, USB Type-A to Type-B cable ×1, 9 V battery ×1
- Processes used:
  - None

## 3) Connect GitHub (`welcome/connect-github`)

- Quest link: [/quests/welcome/connect-github](/quests/welcome/connect-github)
- Unlock prerequisite:
  - `requiresQuests`: `welcome/intro-inventory`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - GitHub Link-Up Trophy ×1
- Processes used:
  - None

## 4) Run the Test Suite (`welcome/run-tests`)

- Quest link: [/quests/welcome/run-tests](/quests/welcome/run-tests)
- Unlock prerequisite:
  - `requiresQuests`: `welcome/connect-github`
- Dialogue `requiresItems` gates:
  - `prep-repo` → "Fork ready" — GitHub repository ×1
  - `clone` → "Local checkout is ready" — local DSPACE checkout ×1
  - `suite` → "Report captured and green" — local test report ×1
  - `finish` → "Claim testing trophy" — local test report ×1
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - Test Suite Triumph Trophy ×1, dUSD ×250
- Processes used:
  - [create-github-repo](/processes/create-github-repo)
    - Requires: Laptop Computer ×1
    - Consumes: none
    - Creates: GitHub repository ×1
  - [prepare-local-testbed](/processes/prepare-local-testbed)
    - Requires: GitHub repository ×1, Laptop Computer ×1
    - Consumes: none
    - Creates: local DSPACE checkout ×1
  - [execute-dspace-tests](/processes/execute-dspace-tests)
    - Requires: local DSPACE checkout ×1, CI workflow file ×1
    - Consumes: none
    - Creates: local test report ×1

## 5) Smart Plug Test (`welcome/smart-plug-test`)

- Quest link: [/quests/welcome/smart-plug-test](/quests/welcome/smart-plug-test)
- Unlock prerequisite:
  - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `run` → "I reached 10,000 dWatt" — dWatt ×10000
- Grants:
  - Dialogue options/steps grantsItems: None
  - Quest-level `grantsItems`: None
- Rewards:
  - dWatt ×2500, dUSD ×150, 200 Wh battery pack ×1
- Processes used:
  - [outlet-dWatt-1e3](/processes/outlet-dWatt-1e3)
    - Requires: smart plug ×1
    - Consumes: dUSD ×0.18
    - Creates: dWatt ×1000, dCarbon ×0.98

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
