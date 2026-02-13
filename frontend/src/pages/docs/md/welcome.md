---
title: 'Welcome'
slug: 'welcome'
---

Welcome quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [How to do quests](/quests/welcome/howtodoquests) (`welcome/howtodoquests`)
2. [Check Your Inventory](/quests/welcome/intro-inventory) (`welcome/intro-inventory`)
3. [Connect GitHub](/quests/welcome/connect-github) (`welcome/connect-github`)
4. [Run the Test Suite](/quests/welcome/run-tests) (`welcome/run-tests`)
5. [Smart Plug Test](/quests/welcome/smart-plug-test) (`welcome/smart-plug-test`)

---

## 1) How to do quests (`welcome/howtodoquests`)

- Quest link: [/quests/welcome/howtodoquests](/quests/welcome/howtodoquests)
- Unlock prerequisite:
  - `None`
- Dialogue `requiresItems` gates:
  - `expert` → "Alright, now can I skip?"
    - a5395e29-1862-4eb7-8517-5d161635e032 ×1
  - `items` → "Like this, right?"
    - d88ef09c-9191-4c18-8628-a888bb9f926d ×1
  - `processes` → "dWatt...? What's this?"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×3000
- Grants:
  - Option/step `grantsItems`:
    - `expert` → "What's this?"
      - a5395e29-1862-4eb7-8517-5d161635e032 ×1
    - `items` → "Great, free stuff! Thanks!"
      - d88ef09c-9191-4c18-8628-a888bb9f926d ×10
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
    - `processes` → "Looks like I need this to finish the process."
      - a5395e29-1862-4eb7-8517-5d161635e032 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 4910a316-5019-4fcd-b185-1d6ce1c0040b ×1
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×1000
- Processes used:
  - [outlet-dWatt-1e3](/processes/outlet-dWatt-1e3)
    - Requires:
      - a5395e29-1862-4eb7-8517-5d161635e032 ×1
    - Consumes:
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×0.18
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000
      - d88ef09c-9191-4c18-8628-a888bb9f926d ×0.98

---

## 2) Check Your Inventory (`welcome/intro-inventory`)

- Quest link: [/quests/welcome/intro-inventory](/quests/welcome/intro-inventory)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `buy-sell` → "Bought electrical tape"
    - 946bc4dd-32ee-434c-a8ed-d70cdce617f4 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×120
  - be3aaed8-13cc-4937-95d5-6e2c952c6612 ×1
  - 80d30825-a42b-4add-b715-322e1713952c ×1
- Processes used:
  - None

---

## 3) Connect GitHub (`welcome/connect-github`)

- Quest link: [/quests/welcome/connect-github](/quests/welcome/connect-github)
- Unlock prerequisite:
  - `welcome/intro-inventory`
- Dialogue `requiresItems` gates:
  - None
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d5d62069-c77d-44b1-8848-b355f8410f74 ×1
- Processes used:
  - None

---

## 4) Run the Test Suite (`welcome/run-tests`)

- Quest link: [/quests/welcome/run-tests](/quests/welcome/run-tests)
- Unlock prerequisite:
  - `welcome/connect-github`
- Dialogue `requiresItems` gates:
  - `prep-repo` → "Fork ready"
    - 52593d07-908b-4109-92cf-826b2184ef6f ×1
  - `clone` → "Local checkout is ready"
    - c4807e67-4e40-452f-8cdc-e326f3e34444 ×1
  - `suite` → "Report captured and green"
    - 1486e0df-f01e-4c9e-bdd8-ef272df0b9ef ×1
  - `finish` → "Claim testing trophy"
    - 1486e0df-f01e-4c9e-bdd8-ef272df0b9ef ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 82b369fe-0ef4-4ca1-881c-14e5a7feeff5 ×1
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×250
- Processes used:
  - [create-github-repo](/processes/create-github-repo)
    - Requires:
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - 52593d07-908b-4109-92cf-826b2184ef6f ×1
  - [execute-dspace-tests](/processes/execute-dspace-tests)
    - Requires:
      - c4807e67-4e40-452f-8cdc-e326f3e34444 ×1
      - 306793ac-e420-4859-9742-9076fff6ab57 ×1
    - Consumes:
      - None
    - Creates:
      - 1486e0df-f01e-4c9e-bdd8-ef272df0b9ef ×1
  - [prepare-local-testbed](/processes/prepare-local-testbed)
    - Requires:
      - 52593d07-908b-4109-92cf-826b2184ef6f ×1
      - b6fc1ed6-f399-4fdb-9f9d-3913f893f43d ×1
    - Consumes:
      - None
    - Creates:
      - c4807e67-4e40-452f-8cdc-e326f3e34444 ×1

---

## 5) Smart Plug Test (`welcome/smart-plug-test`)

- Quest link: [/quests/welcome/smart-plug-test](/quests/welcome/smart-plug-test)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `run` → "I reached 10,000 dWatt"
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10000
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×2500
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×150
  - cfe87611-623a-45b0-9243-422cd8a73a16 ×1
- Processes used:
  - [outlet-dWatt-1e3](/processes/outlet-dWatt-1e3)
    - Requires:
      - a5395e29-1862-4eb7-8517-5d161635e032 ×1
    - Consumes:
      - 5247a603-294a-4a34-a884-1ae20969b2a1 ×0.18
    - Creates:
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×1000
      - d88ef09c-9191-4c18-8628-a888bb9f926d ×0.98

---

## QA flow notes

- Cross-quest dependencies:
  - No external quest dependencies; all prerequisites are within this tree.
- Progression integrity checks:
  - `welcome/howtodoquests`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×3000).
  - `welcome/intro-inventory`: verify prerequisite completion and inventory gates.
  - `welcome/connect-github`: verify prerequisite completion and inventory gates.
  - `welcome/run-tests`: verify prerequisite completion and inventory gates.
  - `welcome/smart-plug-test`: verify prerequisite completion and inventory gates (notable count gates: 061fd221-404a-4bd1-9432-3e25b0f17a2c ×10000).
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
