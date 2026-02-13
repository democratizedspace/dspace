---
title: 'Composting'
slug: 'composting'
---

This page documents the full **Composting** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Start a Compost Bucket](/quests/composting/start) (`composting/start`)
2. [Turn Your Compost Bucket](/quests/composting/turn-pile) (`composting/turn-pile`)
3. [Check Compost Temperature](/quests/composting/check-temperature) (`composting/check-temperature`)
4. [Sift Finished Compost](/quests/composting/sift-compost) (`composting/sift-compost`)

## Quest details

### 1) Start a Compost Bucket (`composting/start`)
- Quest link: `/quests/composting/start`
- Unlock prerequisite (`requiresQuests`): `hydroponics/basil`
- Dialogue `requiresItems` gates:
  - Node `run-process-hint` / I ran it on the item page and made a layered compost bucket.: layered compost bucket (`025862b3-8377-4396-ab32-aa572bdc3260`) x1
  - Node `finish` / Compost bucket started: layered compost bucket (`025862b3-8377-4396-ab32-aa572bdc3260`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Lettuce Seeds (`cfaa44c1-86b4-43ae-b15e-11e3ad75ba57`) x2; compost sifter (`4796b4a9-0927-4b46-a41f-076ebaff01bb`) x1
- Processes used:
  - [`start-compost-bin`](/processes/start-compost-bin)
    - Requires: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: bundle of basil leaves (`5d48cefb-fc1f-4962-b2c6-9b014151d0ae`) x2; harvested basil plant (`29190faf-8581-4769-b871-f0ee283840e1`) x1
    - Creates: layered compost bucket (`025862b3-8377-4396-ab32-aa572bdc3260`) x1

### 2) Turn Your Compost Bucket (`composting/turn-pile`)
- Quest link: `/quests/composting/turn-pile`
- Unlock prerequisite (`requiresQuests`): `composting/start`
- Dialogue `requiresItems` gates:
  - Node `start` / Gloves on; bucket needs air.: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; layered compost bucket (`025862b3-8377-4396-ab32-aa572bdc3260`) x1
  - Node `mix` / Check core temperature: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost thermometer (`4d21c498-9225-4d0b-9a1a-ed65e349f0a8`) x1
  - Node `mix` / Measure moisture level: compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost moisture meter (`2b57a38d-0486-40e8-a50d-d893541b50e9`) x1
  - Node `mix` / Mix is fluffy and capped: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - Node `finish` / Aerated and logged: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: compost thermometer (`4d21c498-9225-4d0b-9a1a-ed65e349f0a8`) x1; compost moisture meter (`2b57a38d-0486-40e8-a50d-d893541b50e9`) x1
- Processes used:
  - [`measure-compost-moisture`](/processes/measure-compost-moisture)
    - Requires: compost moisture meter (`2b57a38d-0486-40e8-a50d-d893541b50e9`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
    - Consumes: None
    - Creates: compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - [`measure-compost-temperature`](/processes/measure-compost-temperature)
    - Requires: compost thermometer (`4d21c498-9225-4d0b-9a1a-ed65e349f0a8`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
    - Consumes: None
    - Creates: compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1
  - [`turn-compost-bucket`](/processes/turn-compost-bucket)
    - Requires: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; layered compost bucket (`025862b3-8377-4396-ab32-aa572bdc3260`) x1
    - Consumes: layered compost bucket (`025862b3-8377-4396-ab32-aa572bdc3260`) x1
    - Creates: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1

### 3) Check Compost Temperature (`composting/check-temperature`)
- Quest link: `/quests/composting/check-temperature`
- Unlock prerequisite (`requiresQuests`): `composting/turn-pile`
- Dialogue `requiresItems` gates:
  - Node `start` / Ready to take readings.: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
  - Node `probe` / Log the temperature: compost thermometer (`4d21c498-9225-4d0b-9a1a-ed65e349f0a8`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
  - Node `probe` / Check moisture too: compost moisture meter (`2b57a38d-0486-40e8-a50d-d893541b50e9`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
  - Node `moisture` / Record the moisture: compost moisture meter (`2b57a38d-0486-40e8-a50d-d893541b50e9`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
  - Node `moisture` / Readings logged: compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - Node `recheck` / Two temps and moisture are logged: compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x2; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - Node `cooldown` / Start the cure rest: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x2; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - Node `cooldown` / Bucket has cooled and smells earthy: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x2; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - Node `finish` / On to sifting!: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x2; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`cure-compost-bucket`](/processes/cure-compost-bucket)
    - Requires: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
    - Consumes: active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
    - Creates: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
  - [`measure-compost-moisture`](/processes/measure-compost-moisture)
    - Requires: compost moisture meter (`2b57a38d-0486-40e8-a50d-d893541b50e9`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
    - Consumes: None
    - Creates: compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
  - [`measure-compost-temperature`](/processes/measure-compost-temperature)
    - Requires: compost thermometer (`4d21c498-9225-4d0b-9a1a-ed65e349f0a8`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1
    - Consumes: None
    - Creates: compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1
  - [`recheck-compost-temperature`](/processes/recheck-compost-temperature)
    - Requires: compost thermometer (`4d21c498-9225-4d0b-9a1a-ed65e349f0a8`) x1; active compost bucket (`ff89afa1-2f88-44f2-a414-7fb1eda08735`) x1; compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1; compost moisture log (`723f5795-735c-46ee-8a33-30a3a403cdfd`) x1
    - Consumes: None
    - Creates: compost temperature log (`e034d081-a29e-4040-830f-a192304db50d`) x1

### 4) Sift Finished Compost (`composting/sift-compost`)
- Quest link: `/quests/composting/sift-compost`
- Unlock prerequisite (`requiresQuests`): `composting/check-temperature`
- Dialogue `requiresItems` gates:
  - Node `start` / Cured bucket and gloves ready.: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `setup` / Sift the compost: compost sifter (`4796b4a9-0927-4b46-a41f-076ebaff01bb`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
  - Node `setup` / Screening complete.: screened compost blend (`5e165cbc-f4f2-4e9d-ac92-9588ff1ac9c1`) x1
  - Node `finish` / Can't wait to use it!: screened compost blend (`5e165cbc-f4f2-4e9d-ac92-9588ff1ac9c1`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`sift-compost`](/processes/sift-compost)
    - Requires: compost sifter (`4796b4a9-0927-4b46-a41f-076ebaff01bb`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
    - Consumes: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
    - Creates: screened compost blend (`5e165cbc-f4f2-4e9d-ac92-9588ff1ac9c1`) x1

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
