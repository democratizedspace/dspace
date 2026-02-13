---
title: 'Composting'
slug: 'composting'
---

Composting quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Start a Compost Bucket](/quests/composting/start) (`composting/start`)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile) (`composting/turn-pile`)
3. [Check Compost Temperature](/quests/composting/check-temperature) (`composting/check-temperature`)
4. [Sift Finished Compost](/quests/composting/sift-compost) (`composting/sift-compost`)

---

## 1) Start a Compost Bucket (`composting/start`)

- Quest link: [/quests/composting/start](/quests/composting/start)
- Unlock prerequisite:
  - `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - `run-process-hint` → "I ran it on the item page and made a layered compost bucket."
    - 025862b3-8377-4396-ab32-aa572bdc3260 ×1
  - `finish` → "Compost bucket started"
    - 025862b3-8377-4396-ab32-aa572bdc3260 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - cfaa44c1-86b4-43ae-b15e-11e3ad75ba57 ×2
  - 4796b4a9-0927-4b46-a41f-076ebaff01bb ×1
- Processes used:
  - [start-compost-bin](/processes/start-compost-bin)
    - Requires:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 5d48cefb-fc1f-4962-b2c6-9b014151d0ae ×2
      - 29190faf-8581-4769-b871-f0ee283840e1 ×1
    - Creates:
      - 025862b3-8377-4396-ab32-aa572bdc3260 ×1

---

## 2) Turn Your Compost Bucket (`composting/turn-pile`)

- Quest link: [/quests/composting/turn-pile](/quests/composting/turn-pile)
- Unlock prerequisite:
  - `composting/start`
- Dialogue `requiresItems` gates:
  - `start` → "Gloves on; bucket needs air."
    - 0564d441-7367-412e-b709-dad770814a39 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - 025862b3-8377-4396-ab32-aa572bdc3260 ×1
  - `mix` → "Check core temperature"
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - 4d21c498-9225-4d0b-9a1a-ed65e349f0a8 ×1
  - `mix` → "Measure moisture level"
    - e034d081-a29e-4040-830f-a192304db50d ×1
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - 2b57a38d-0486-40e8-a50d-d893541b50e9 ×1
  - `mix` → "Mix is fluffy and capped"
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - e034d081-a29e-4040-830f-a192304db50d ×1
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - `finish` → "Aerated and logged"
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - e034d081-a29e-4040-830f-a192304db50d ×1
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 4d21c498-9225-4d0b-9a1a-ed65e349f0a8 ×1
  - 2b57a38d-0486-40e8-a50d-d893541b50e9 ×1
- Processes used:
  - [measure-compost-moisture](/processes/measure-compost-moisture)
    - Requires:
      - 2b57a38d-0486-40e8-a50d-d893541b50e9 ×1
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - Consumes:
      - None
    - Creates:
      - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - [measure-compost-temperature](/processes/measure-compost-temperature)
    - Requires:
      - 4d21c498-9225-4d0b-9a1a-ed65e349f0a8 ×1
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - Consumes:
      - None
    - Creates:
      - e034d081-a29e-4040-830f-a192304db50d ×1
  - [turn-compost-bucket](/processes/turn-compost-bucket)
    - Requires:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - 025862b3-8377-4396-ab32-aa572bdc3260 ×1
    - Consumes:
      - 025862b3-8377-4396-ab32-aa572bdc3260 ×1
    - Creates:
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1

---

## 3) Check Compost Temperature (`composting/check-temperature`)

- Quest link: [/quests/composting/check-temperature](/quests/composting/check-temperature)
- Unlock prerequisite:
  - `composting/turn-pile`
- Dialogue `requiresItems` gates:
  - `start` → "Ready to take readings."
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
  - `probe` → "Log the temperature"
    - 4d21c498-9225-4d0b-9a1a-ed65e349f0a8 ×1
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
  - `probe` → "Check moisture too"
    - 2b57a38d-0486-40e8-a50d-d893541b50e9 ×1
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
  - `moisture` → "Record the moisture"
    - 2b57a38d-0486-40e8-a50d-d893541b50e9 ×1
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
  - `moisture` → "Readings logged"
    - e034d081-a29e-4040-830f-a192304db50d ×1
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - `recheck` → "Two temps and moisture are logged"
    - e034d081-a29e-4040-830f-a192304db50d ×2
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - `cooldown` → "Start the cure rest"
    - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - e034d081-a29e-4040-830f-a192304db50d ×2
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - `cooldown` → "Bucket has cooled and smells earthy"
    - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
    - e034d081-a29e-4040-830f-a192304db50d ×2
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - `finish` → "On to sifting!"
    - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
    - e034d081-a29e-4040-830f-a192304db50d ×2
    - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [cure-compost-bucket](/processes/cure-compost-bucket)
    - Requires:
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
      - e034d081-a29e-4040-830f-a192304db50d ×1
      - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
    - Consumes:
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - Creates:
      - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
  - [measure-compost-moisture](/processes/measure-compost-moisture)
    - Requires:
      - 2b57a38d-0486-40e8-a50d-d893541b50e9 ×1
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - Consumes:
      - None
    - Creates:
      - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
  - [measure-compost-temperature](/processes/measure-compost-temperature)
    - Requires:
      - 4d21c498-9225-4d0b-9a1a-ed65e349f0a8 ×1
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
    - Consumes:
      - None
    - Creates:
      - e034d081-a29e-4040-830f-a192304db50d ×1
  - [recheck-compost-temperature](/processes/recheck-compost-temperature)
    - Requires:
      - 4d21c498-9225-4d0b-9a1a-ed65e349f0a8 ×1
      - ff89afa1-2f88-44f2-a414-7fb1eda08735 ×1
      - e034d081-a29e-4040-830f-a192304db50d ×1
      - 723f5795-735c-46ee-8a33-30a3a403cdfd ×1
    - Consumes:
      - None
    - Creates:
      - e034d081-a29e-4040-830f-a192304db50d ×1

---

## 4) Sift Finished Compost (`composting/sift-compost`)

- Quest link: [/quests/composting/sift-compost](/quests/composting/sift-compost)
- Unlock prerequisite:
  - `composting/check-temperature`
- Dialogue `requiresItems` gates:
  - `start` → "Cured bucket and gloves ready."
    - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `setup` → "Sift the compost"
    - 4796b4a9-0927-4b46-a41f-076ebaff01bb ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
  - `setup` → "Screening complete."
    - 5e165cbc-f4f2-4e9d-ac92-9588ff1ac9c1 ×1
  - `finish` → "Can't wait to use it!"
    - 5e165cbc-f4f2-4e9d-ac92-9588ff1ac9c1 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [sift-compost](/processes/sift-compost)
    - Requires:
      - 4796b4a9-0927-4b46-a41f-076ebaff01bb ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
    - Consumes:
      - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
    - Creates:
      - 5e165cbc-f4f2-4e9d-ac92-9588ff1ac9c1 ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `composting/start` depends on external quests: `hydroponics/basil`.
- Progression integrity checks:
  - `composting/start`: verify prerequisite completion and inventory gates.
  - `composting/turn-pile`: verify prerequisite completion and inventory gates.
  - `composting/check-temperature`: verify prerequisite completion and inventory gates (notable count gates: e034d081-a29e-4040-830f-a192304db50d ×2).
  - `composting/sift-compost`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
