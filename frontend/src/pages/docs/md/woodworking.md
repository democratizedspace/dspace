---
title: 'Woodworking'
slug: 'woodworking'
---

Woodworking quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Build a Planter Box](/quests/woodworking/planter-box) (`woodworking/planter-box`)
2. [Build a birdhouse](/quests/woodworking/birdhouse) (`woodworking/birdhouse`)
3. [Build a step stool](/quests/woodworking/step-stool) (`woodworking/step-stool`)
4. [Build a small bookshelf](/quests/woodworking/bookshelf) (`woodworking/bookshelf`)
5. [Build a coffee table](/quests/woodworking/coffee-table) (`woodworking/coffee-table`)
6. [Finish Sand Your Project](/quests/woodworking/finish-sanding) (`woodworking/finish-sanding`)
7. [Apply a Wood Finish](/quests/woodworking/apply-finish) (`woodworking/apply-finish`)
8. [Build a simple workbench](/quests/woodworking/workbench) (`woodworking/workbench`)
9. [Build a Tool Rack](/quests/woodworking/tool-rack) (`woodworking/tool-rack`)
10. [Craft a Picture Frame](/quests/woodworking/picture-frame) (`woodworking/picture-frame`)

---

## 1) Build a Planter Box (`woodworking/planter-box`)

- Quest link: [/quests/woodworking/planter-box](/quests/woodworking/planter-box)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `gather` → "Materials ready"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×4
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - 5fbabfcf-27d0-48f5-a89e-7aba8ca4b913 ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Grants:
  - Option/step `grantsItems`:
    - `gather` → "Gather materials"
      - 5fbabfcf-27d0-48f5-a89e-7aba8ca4b913 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - ea830e47-5996-4886-b5ee-74bb2b932988 ×1
  - affa2f80-28f1-422e-a0c8-49e51ce65a1e ×1
- Processes used:
  - [assemble-planter-box](/processes/assemble-planter-box)
    - Requires:
      - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
      - 5fbabfcf-27d0-48f5-a89e-7aba8ca4b913 ×1
    - Consumes:
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×4
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
      - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
    - Creates:
      - ea830e47-5996-4886-b5ee-74bb2b932988 ×1

---

## 2) Build a birdhouse (`woodworking/birdhouse`)

- Quest link: [/quests/woodworking/birdhouse](/quests/woodworking/birdhouse)
- Unlock prerequisite:
  - `woodworking/planter-box`
- Dialogue `requiresItems` gates:
  - `gather` → "Materials ready"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×1
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
    - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
    - 5fbabfcf-27d0-48f5-a89e-7aba8ca4b913 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - `cut` → "Panels are cut"
    - 0e6f2e1c-1e8a-4c05-b1db-38f1eec6f64a ×1
  - `assemble` → "Shell is glued up"
    - c97f9b74-4d4f-4e83-993c-5df76e9d026e ×1
  - `finish` → "Ready to mount"
    - 092fdddc-431a-40bd-a66c-f7ef878ae1f8 ×1
- Grants:
  - Option/step `grantsItems`:
    - `gather` → "Gather materials"
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×1
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
      - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
      - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
      - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
      - 5fbabfcf-27d0-48f5-a89e-7aba8ca4b913 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [build-birdhouse](/processes/build-birdhouse)
    - Requires:
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
    - Consumes:
      - c97f9b74-4d4f-4e83-993c-5df76e9d026e ×1
      - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
    - Creates:
      - 092fdddc-431a-40bd-a66c-f7ef878ae1f8 ×1
  - [cut-birdhouse-panels](/processes/cut-birdhouse-panels)
    - Requires:
      - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
    - Consumes:
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×1
    - Creates:
      - 0e6f2e1c-1e8a-4c05-b1db-38f1eec6f64a ×1
  - [glue-birdhouse-shell](/processes/glue-birdhouse-shell)
    - Requires:
      - 5fbabfcf-27d0-48f5-a89e-7aba8ca4b913 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
    - Consumes:
      - 0e6f2e1c-1e8a-4c05-b1db-38f1eec6f64a ×1
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - Creates:
      - c97f9b74-4d4f-4e83-993c-5df76e9d026e ×1

---

## 3) Build a step stool (`woodworking/step-stool`)

- Quest link: [/quests/woodworking/step-stool](/quests/woodworking/step-stool)
- Unlock prerequisite:
  - `woodworking/birdhouse`
  - `woodworking/planter-box`
- Dialogue `requiresItems` gates:
  - `gather` → "Parts ready"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×2
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
- Grants:
  - Option/step `grantsItems`:
    - `gather` → "Gather parts"
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×2
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
      - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
      - 2dfe683c-56f6-4026-b9e9-2d01a03b1878 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - `finish` → "Take the stool"
      - 0d4a7b77-f241-4c19-9365-c74647066802 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 4) Build a small bookshelf (`woodworking/bookshelf`)

- Quest link: [/quests/woodworking/bookshelf](/quests/woodworking/bookshelf)
- Unlock prerequisite:
  - `woodworking/step-stool`
- Dialogue `requiresItems` gates:
  - `gather` → "All materials ready"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×4
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
- Grants:
  - Option/step `grantsItems`:
    - `gather` → "Buy lumber"
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×4
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
      - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - `finish` → "Take the bookshelf"
      - 619d485d-803f-4875-a048-157ce28d31c4 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 5) Build a coffee table (`woodworking/coffee-table`)

- Quest link: [/quests/woodworking/coffee-table](/quests/woodworking/coffee-table)
- Unlock prerequisite:
  - `woodworking/bookshelf`
- Dialogue `requiresItems` gates:
  - `gather` → "Materials ready"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×6
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
- Grants:
  - Option/step `grantsItems`:
    - `gather` → "Gather materials"
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×6
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
      - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 6) Finish Sand Your Project (`woodworking/finish-sanding`)

- Quest link: [/quests/woodworking/finish-sanding](/quests/woodworking/finish-sanding)
- Unlock prerequisite:
  - `woodworking/step-stool`
- Dialogue `requiresItems` gates:
  - `sand` → "Surface looks even"
    - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 05dd84f7-b9bc-4eac-93c5-5838cab84b32 ×1
  - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Processes used:
  - None

---

## 7) Apply a Wood Finish (`woodworking/apply-finish`)

- Quest link: [/quests/woodworking/apply-finish](/quests/woodworking/apply-finish)
- Unlock prerequisite:
  - `woodworking/finish-sanding`
- Dialogue `requiresItems` gates:
  - `gather` → "Ready to apply"
    - 05dd84f7-b9bc-4eac-93c5-5838cab84b32 ×1
- Grants:
  - Option/step `grantsItems`:
    - `gather` → "Take the brush"
      - 05dd84f7-b9bc-4eac-93c5-5838cab84b32 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
  - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Processes used:
  - None

---

## 8) Build a simple workbench (`woodworking/workbench`)

- Quest link: [/quests/woodworking/workbench](/quests/woodworking/workbench)
- Unlock prerequisite:
  - `woodworking/step-stool`
- Dialogue `requiresItems` gates:
  - `materials` → "I've got everything ready."
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×4
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
- Grants:
  - Option/step `grantsItems`:
    - `materials` → "Thanks for the supplies!"
      - 6c075116-ebd1-4147-8666-ec6338ca251e ×4
      - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - `finish` → "Claim my new workbench."
      - af77fbf2-30bc-499c-a95c-5daa47a47509 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 9) Build a Tool Rack (`woodworking/tool-rack`)

- Quest link: [/quests/woodworking/tool-rack](/quests/woodworking/tool-rack)
- Unlock prerequisite:
  - `woodworking/workbench`
- Dialogue `requiresItems` gates:
  - `gather` → "Materials ready"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - 7f78fea7-e017-411d-bb4b-82c8b0940d34 ×1
    - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
  - `cut` → "Slots look good"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - 7f78fea7-e017-411d-bb4b-82c8b0940d34 ×1
    - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
  - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Processes used:
  - None

---

## 10) Craft a Picture Frame (`woodworking/picture-frame`)

- Quest link: [/quests/woodworking/picture-frame](/quests/woodworking/picture-frame)
- Unlock prerequisite:
  - `woodworking/tool-rack`
- Dialogue `requiresItems` gates:
  - `assemble` → "Miters are clamped"
    - 6c075116-ebd1-4147-8666-ec6338ca251e ×1
    - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
    - ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e ×1
    - 2770ee5d-f9a0-4dc8-9c79-4f031fefd093 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 05dd84f7-b9bc-4eac-93c5-5838cab84b32 ×1
  - 30a7cd72-cf99-4ed7-9a4c-f30a68a4a399 ×1
- Processes used:
  - None

---

## QA flow notes

- Cross-quest dependencies:
  - `woodworking/planter-box` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `woodworking/planter-box`: verify prerequisite completion and inventory gates (notable count gates: 6c075116-ebd1-4147-8666-ec6338ca251e ×4).
  - `woodworking/birdhouse`: verify prerequisite completion and inventory gates.
  - `woodworking/step-stool`: verify prerequisite completion and inventory gates (notable count gates: 6c075116-ebd1-4147-8666-ec6338ca251e ×2).
  - `woodworking/bookshelf`: verify prerequisite completion and inventory gates (notable count gates: 6c075116-ebd1-4147-8666-ec6338ca251e ×4).
  - `woodworking/coffee-table`: verify prerequisite completion and inventory gates (notable count gates: 6c075116-ebd1-4147-8666-ec6338ca251e ×6).
  - `woodworking/finish-sanding`: verify prerequisite completion and inventory gates.
  - `woodworking/apply-finish`: verify prerequisite completion and inventory gates.
  - `woodworking/workbench`: verify prerequisite completion and inventory gates (notable count gates: 6c075116-ebd1-4147-8666-ec6338ca251e ×4).
  - `woodworking/tool-rack`: verify prerequisite completion and inventory gates.
  - `woodworking/picture-frame`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
