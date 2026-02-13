---
title: 'Woodworking'
slug: 'woodworking'
---

This page documents the full **Woodworking** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

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

## Quest details

### 1) Build a Planter Box (`woodworking/planter-box`)
- Quest link: `/quests/woodworking/planter-box`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `gather` / Materials ready: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x4; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; claw hammer (16 oz) (`5fbabfcf-27d0-48f5-a89e-7aba8ca4b913`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `gather` / Gather materials: claw hammer (16 oz) (`5fbabfcf-27d0-48f5-a89e-7aba8ca4b913`) x1
- Quest-level `grantsItems`: None
- Rewards: Pine planter box (`ea830e47-5996-4886-b5ee-74bb2b932988`) x1; basil seeds (`affa2f80-28f1-422e-a0c8-49e51ce65a1e`) x1
- Processes used:
  - [`assemble-planter-box`](/processes/assemble-planter-box)
    - Requires: Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; claw hammer (16 oz) (`5fbabfcf-27d0-48f5-a89e-7aba8ca4b913`) x1
    - Consumes: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x4; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
    - Creates: Pine planter box (`ea830e47-5996-4886-b5ee-74bb2b932988`) x1

### 2) Build a birdhouse (`woodworking/birdhouse`)
- Quest link: `/quests/woodworking/birdhouse`
- Unlock prerequisite (`requiresQuests`): `woodworking/planter-box`
- Dialogue `requiresItems` gates:
  - Node `gather` / Materials ready: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x1; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1; claw hammer (16 oz) (`5fbabfcf-27d0-48f5-a89e-7aba8ca4b913`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `cut` / Panels are cut: Birdhouse panel set (`0e6f2e1c-1e8a-4c05-b1db-38f1eec6f64a`) x1
  - Node `assemble` / Shell is glued up: Glued birdhouse shell (`c97f9b74-4d4f-4e83-993c-5df76e9d026e`) x1
  - Node `finish` / Ready to mount: Birdhouse (`092fdddc-431a-40bd-a66c-f7ef878ae1f8`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `gather` / Gather materials: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x1; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1; claw hammer (16 oz) (`5fbabfcf-27d0-48f5-a89e-7aba8ca4b913`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`build-birdhouse`](/processes/build-birdhouse)
    - Requires: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1
    - Consumes: Glued birdhouse shell (`c97f9b74-4d4f-4e83-993c-5df76e9d026e`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
    - Creates: Birdhouse (`092fdddc-431a-40bd-a66c-f7ef878ae1f8`) x1
  - [`cut-birdhouse-panels`](/processes/cut-birdhouse-panels)
    - Requires: Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1
    - Consumes: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x1
    - Creates: Birdhouse panel set (`0e6f2e1c-1e8a-4c05-b1db-38f1eec6f64a`) x1
  - [`glue-birdhouse-shell`](/processes/glue-birdhouse-shell)
    - Requires: claw hammer (16 oz) (`5fbabfcf-27d0-48f5-a89e-7aba8ca4b913`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1
    - Consumes: Birdhouse panel set (`0e6f2e1c-1e8a-4c05-b1db-38f1eec6f64a`) x1; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1
    - Creates: Glued birdhouse shell (`c97f9b74-4d4f-4e83-993c-5df76e9d026e`) x1

### 3) Build a step stool (`woodworking/step-stool`)
- Quest link: `/quests/woodworking/step-stool`
- Unlock prerequisite (`requiresQuests`): `woodworking/birdhouse`, `woodworking/planter-box`
- Dialogue `requiresItems` gates:
  - Node `gather` / Parts ready: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x2; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `gather` / Gather parts: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x2; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; tape measure (`2dfe683c-56f6-4026-b9e9-2d01a03b1878`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `finish` / Take the stool: Step stool (`0d4a7b77-f241-4c19-9365-c74647066802`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 4) Build a small bookshelf (`woodworking/bookshelf`)
- Quest link: `/quests/woodworking/bookshelf`
- Unlock prerequisite (`requiresQuests`): `woodworking/step-stool`
- Dialogue `requiresItems` gates:
  - Node `gather` / All materials ready: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x4; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `gather` / Buy lumber: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x4; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1
  - Node `finish` / Take the bookshelf: Bookshelf (`619d485d-803f-4875-a048-157ce28d31c4`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 5) Build a coffee table (`woodworking/coffee-table`)
- Quest link: `/quests/woodworking/coffee-table`
- Unlock prerequisite (`requiresQuests`): `woodworking/bookshelf`
- Dialogue `requiresItems` gates:
  - Node `gather` / Materials ready: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x6; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `gather` / Gather materials: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x6; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 6) Finish Sand Your Project (`woodworking/finish-sanding`)
- Quest link: `/quests/woodworking/finish-sanding`
- Unlock prerequisite (`requiresQuests`): `woodworking/step-stool`
- Dialogue `requiresItems` gates:
  - Node `sand` / Surface looks even: Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: paintbrush (`05dd84f7-b9bc-4eac-93c5-5838cab84b32`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Processes used:
  - None

### 7) Apply a Wood Finish (`woodworking/apply-finish`)
- Quest link: `/quests/woodworking/apply-finish`
- Unlock prerequisite (`requiresQuests`): `woodworking/finish-sanding`
- Dialogue `requiresItems` gates:
  - Node `gather` / Ready to apply: paintbrush (`05dd84f7-b9bc-4eac-93c5-5838cab84b32`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `gather` / Take the brush: paintbrush (`05dd84f7-b9bc-4eac-93c5-5838cab84b32`) x1
- Quest-level `grantsItems`: None
- Rewards: Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Processes used:
  - None

### 8) Build a simple workbench (`woodworking/workbench`)
- Quest link: `/quests/woodworking/workbench`
- Unlock prerequisite (`requiresQuests`): `woodworking/step-stool`
- Dialogue `requiresItems` gates:
  - Node `materials` / I've got everything ready.: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x4; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `materials` / Thanks for the supplies!: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x4; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1
  - Node `finish` / Claim my new workbench.: Workbench (`af77fbf2-30bc-499c-a95c-5daa47a47509`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - None

### 9) Build a Tool Rack (`woodworking/tool-rack`)
- Quest link: `/quests/woodworking/tool-rack`
- Unlock prerequisite (`requiresQuests`): `woodworking/workbench`
- Dialogue `requiresItems` gates:
  - Node `gather` / Materials ready: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; wood chisel (`7f78fea7-e017-411d-bb4b-82c8b0940d34`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
  - Node `cut` / Slots look good: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; wood chisel (`7f78fea7-e017-411d-bb4b-82c8b0940d34`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Processes used:
  - None

### 10) Craft a Picture Frame (`woodworking/picture-frame`)
- Quest link: `/quests/woodworking/picture-frame`
- Unlock prerequisite (`requiresQuests`): `woodworking/tool-rack`
- Dialogue `requiresItems` gates:
  - Node `assemble` / Miters are clamped: Pine board (`6c075116-ebd1-4147-8666-ec6338ca251e`) x1; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1; Handsaw (`ac6d5ef4-a7ec-4651-8f0c-db4c0ede865e`) x1; Sandpaper pack (`2770ee5d-f9a0-4dc8-9c79-4f031fefd093`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: paintbrush (`05dd84f7-b9bc-4eac-93c5-5838cab84b32`) x1; Wood glue (`30a7cd72-cf99-4ed7-9a4c-f30a68a4a399`) x1
- Processes used:
  - None

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
