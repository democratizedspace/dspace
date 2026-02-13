---
title: 'Welcome'
slug: 'welcome'
---

Welcome quests cover the `welcome` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [How to do quests](/quests/welcome/howtodoquests)
2. [Check Your Inventory](/quests/welcome/intro-inventory)
3. [Smart Plug Test](/quests/welcome/smart-plug-test)
4. [Connect GitHub](/quests/welcome/connect-github)
5. [Run the Test Suite](/quests/welcome/run-tests)

## 1) How to do quests (`welcome/howtodoquests`)

- Quest link: `/quests/welcome/howtodoquests`
- Unlock prerequisite: `requiresQuests`: []
- Dialogue `requiresItems` gates:
    - `expert` → “Alright, now can I skip?”: smart plug ×1
    - `items` → “Like this, right?”: dCarbon ×1
    - `processes` → “dWatt...? What's this?”: dWatt ×3000
- Grants:
    - `expert` → “What's this?”: smart plug ×1
    - `items` → “Great, free stuff! Thanks!”: dCarbon ×10, dUSD ×100
    - `processes` → “Looks like I need this to finish the process.”: smart plug ×1
    - Quest-level `grantsItems`: None
- Rewards: dChat ×1, dUSD ×1000
- Processes used:
    - [`outlet-dWatt-1e3`](/processes/outlet-dWatt-1e3)
        - Requires: smart plug ×1
        - Consumes: dUSD ×0.18
        - Creates: dWatt ×1000, dCarbon ×0.98

## 2) Check Your Inventory (`welcome/intro-inventory`)

- Quest link: `/quests/welcome/intro-inventory`
- Unlock prerequisite: `requiresQuests`: ['welcome/howtodoquests']
- Dialogue `requiresItems` gates:
    - `buy-sell` → “Bought electrical tape”: electrical tape ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: dUSD ×120, USB Type-A to Type-B cable ×1, 9 V battery ×1
- Processes used:
    - None

## 3) Smart Plug Test (`welcome/smart-plug-test`)

- Quest link: `/quests/welcome/smart-plug-test`
- Unlock prerequisite: `requiresQuests`: ['welcome/howtodoquests']
- Dialogue `requiresItems` gates:
    - `run` → “I reached 10,000 dWatt”: dWatt ×10000
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: dWatt ×2500, dUSD ×150, 200 Wh battery pack ×1
- Processes used:
    - [`outlet-dWatt-1e3`](/processes/outlet-dWatt-1e3)
        - Requires: smart plug ×1
        - Consumes: dUSD ×0.18
        - Creates: dWatt ×1000, dCarbon ×0.98

## 4) Connect GitHub (`welcome/connect-github`)

- Quest link: `/quests/welcome/connect-github`
- Unlock prerequisite: `requiresQuests`: ['welcome/intro-inventory']
- Dialogue `requiresItems` gates:
    - None
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: GitHub Link-Up Trophy ×1
- Processes used:
    - None

## 5) Run the Test Suite (`welcome/run-tests`)

- Quest link: `/quests/welcome/run-tests`
- Unlock prerequisite: `requiresQuests`: ['welcome/connect-github']
- Dialogue `requiresItems` gates:
    - `prep-repo` → “Fork ready”: GitHub repository ×1
    - `clone` → “Local checkout is ready”: local DSPACE checkout ×1
    - `suite` → “Report captured and green”: local test report ×1
    - `finish` → “Claim testing trophy”: local test report ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Test Suite Triumph Trophy ×1, dUSD ×250
- Processes used:
    - [`create-github-repo`](/processes/create-github-repo)
        - Requires: Laptop Computer ×1
        - Consumes: none
        - Creates: GitHub repository ×1
    - [`execute-dspace-tests`](/processes/execute-dspace-tests)
        - Requires: local DSPACE checkout ×1, CI workflow file ×1
        - Consumes: none
        - Creates: local test report ×1
    - [`prepare-local-testbed`](/processes/prepare-local-testbed)
        - Requires: GitHub repository ×1, Laptop Computer ×1
        - Consumes: none
        - Creates: local DSPACE checkout ×1

## QA flow notes

- Cross-quest dependencies:
    - `welcome/intro-inventory` unlocks after: welcome/howtodoquests
    - `welcome/smart-plug-test` unlocks after: welcome/howtodoquests
    - `welcome/connect-github` unlocks after: welcome/intro-inventory
    - `welcome/run-tests` unlocks after: welcome/connect-github
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes:
    - Process `outlet-dWatt-1e3` is reused in 2 quests (welcome/howtodoquests, welcome/smart-plug-test)
