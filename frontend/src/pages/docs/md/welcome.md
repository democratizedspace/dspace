---
title: 'Welcome'
slug: 'welcome'
---

This page documents the full **Welcome** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [How to do quests](/quests/welcome/howtodoquests) (`welcome/howtodoquests`)
2. [Check Your Inventory](/quests/welcome/intro-inventory) (`welcome/intro-inventory`)
3. [Connect GitHub](/quests/welcome/connect-github) (`welcome/connect-github`)
4. [Run the Test Suite](/quests/welcome/run-tests) (`welcome/run-tests`)
5. [Smart Plug Test](/quests/welcome/smart-plug-test) (`welcome/smart-plug-test`)

## Quest details

### 1) How to do quests (`welcome/howtodoquests`)
- Quest link: `/quests/welcome/howtodoquests`
- Unlock prerequisite (`requiresQuests`): None
- Dialogue `requiresItems` gates:
  - Node `expert` / Alright, now can I skip?: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
  - Node `items` / Like this, right?: dCarbon (`d88ef09c-9191-4c18-8628-a888bb9f926d`) x1
  - Node `processes` / dWatt...? What's this?: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x3000
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `expert` / What's this?: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
  - Node `items` / Great, free stuff! Thanks!: dCarbon (`d88ef09c-9191-4c18-8628-a888bb9f926d`) x10; dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100
  - Node `processes` / Looks like I need this to finish the process.: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
- Quest-level `grantsItems`: None
- Rewards: dChat (`4910a316-5019-4fcd-b185-1d6ce1c0040b`) x1; dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x1000
- Processes used:
  - [`outlet-dWatt-1e3`](/processes/outlet-dWatt-1e3)
    - Requires: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
    - Consumes: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x0.18
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1000; dCarbon (`d88ef09c-9191-4c18-8628-a888bb9f926d`) x0.98

### 2) Check Your Inventory (`welcome/intro-inventory`)
- Quest link: `/quests/welcome/intro-inventory`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `buy-sell` / Bought electrical tape: electrical tape (`946bc4dd-32ee-434c-a8ed-d70cdce617f4`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x120; USB Type-A to Type-B cable (`be3aaed8-13cc-4937-95d5-6e2c952c6612`) x1; 9 V battery (`80d30825-a42b-4add-b715-322e1713952c`) x1
- Processes used:
  - None

### 3) Connect GitHub (`welcome/connect-github`)
- Quest link: `/quests/welcome/connect-github`
- Unlock prerequisite (`requiresQuests`): `welcome/intro-inventory`
- Dialogue `requiresItems` gates:
  - None
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: GitHub Link-Up Trophy (`d5d62069-c77d-44b1-8848-b355f8410f74`) x1
- Processes used:
  - None

### 4) Run the Test Suite (`welcome/run-tests`)
- Quest link: `/quests/welcome/run-tests`
- Unlock prerequisite (`requiresQuests`): `welcome/connect-github`
- Dialogue `requiresItems` gates:
  - Node `prep-repo` / Fork ready: GitHub repository (`52593d07-908b-4109-92cf-826b2184ef6f`) x1
  - Node `clone` / Local checkout is ready: local DSPACE checkout (`c4807e67-4e40-452f-8cdc-e326f3e34444`) x1
  - Node `suite` / Report captured and green: local test report (`1486e0df-f01e-4c9e-bdd8-ef272df0b9ef`) x1
  - Node `finish` / Claim testing trophy: local test report (`1486e0df-f01e-4c9e-bdd8-ef272df0b9ef`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Test Suite Triumph Trophy (`82b369fe-0ef4-4ca1-881c-14e5a7feeff5`) x1; dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x250
- Processes used:
  - [`create-github-repo`](/processes/create-github-repo)
    - Requires: Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: GitHub repository (`52593d07-908b-4109-92cf-826b2184ef6f`) x1
  - [`execute-dspace-tests`](/processes/execute-dspace-tests)
    - Requires: local DSPACE checkout (`c4807e67-4e40-452f-8cdc-e326f3e34444`) x1; CI workflow file (`306793ac-e420-4859-9742-9076fff6ab57`) x1
    - Consumes: None
    - Creates: local test report (`1486e0df-f01e-4c9e-bdd8-ef272df0b9ef`) x1
  - [`prepare-local-testbed`](/processes/prepare-local-testbed)
    - Requires: GitHub repository (`52593d07-908b-4109-92cf-826b2184ef6f`) x1; Laptop Computer (`b6fc1ed6-f399-4fdb-9f9d-3913f893f43d`) x1
    - Consumes: None
    - Creates: local DSPACE checkout (`c4807e67-4e40-452f-8cdc-e326f3e34444`) x1

### 5) Smart Plug Test (`welcome/smart-plug-test`)
- Quest link: `/quests/welcome/smart-plug-test`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `run` / I reached 10,000 dWatt: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x10000
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x2500; dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x150; 200 Wh battery pack (`cfe87611-623a-45b0-9243-422cd8a73a16`) x1
- Processes used:
  - [`outlet-dWatt-1e3`](/processes/outlet-dWatt-1e3)
    - Requires: smart plug (`a5395e29-1862-4eb7-8517-5d161635e032`) x1
    - Consumes: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x0.18
    - Creates: dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x1000; dCarbon (`d88ef09c-9191-4c18-8628-a888bb9f926d`) x0.98

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
