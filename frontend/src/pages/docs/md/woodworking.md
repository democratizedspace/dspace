---
title: 'Woodworking'
slug: 'woodworking'
---

Woodworking quests cover the `woodworking` skill tree. This guide documents every quest gate,
item handoff, and process dependency so QA can validate progression end-to-end.

## Quest tree

- This tree has multiple roots/branches; follow prerequisites per quest.

1. [Build a Planter Box](/quests/woodworking/planter-box)
2. [Build a birdhouse](/quests/woodworking/birdhouse)
3. [Build a step stool](/quests/woodworking/step-stool)
4. [Build a small bookshelf](/quests/woodworking/bookshelf)
5. [Finish Sand Your Project](/quests/woodworking/finish-sanding)
6. [Build a simple workbench](/quests/woodworking/workbench)
7. [Build a coffee table](/quests/woodworking/coffee-table)
8. [Apply a Wood Finish](/quests/woodworking/apply-finish)
9. [Build a Tool Rack](/quests/woodworking/tool-rack)
10. [Craft a Picture Frame](/quests/woodworking/picture-frame)

## 1) Build a Planter Box (`woodworking/planter-box`)

- Quest link: `/quests/woodworking/planter-box`
- Unlock prerequisite: `requiresQuests`: ['welcome/howtodoquests']
- Dialogue `requiresItems` gates:
    - `gather` → “Materials ready”: Pine board ×4, Wood glue ×1, claw hammer (16 oz) ×1, Handsaw ×1, Sandpaper pack ×1
- Grants:
    - `gather` → “Gather materials”: claw hammer (16 oz) ×1
    - Quest-level `grantsItems`: None
- Rewards: Pine planter box ×1, basil seeds ×1
- Processes used:
    - [`assemble-planter-box`](/processes/assemble-planter-box)
        - Requires: Handsaw ×1, claw hammer (16 oz) ×1
        - Consumes: Pine board ×4, Wood glue ×1, Sandpaper pack ×1
        - Creates: Pine planter box ×1

## 2) Build a birdhouse (`woodworking/birdhouse`)

- Quest link: `/quests/woodworking/birdhouse`
- Unlock prerequisite: `requiresQuests`: ['woodworking/planter-box']
- Dialogue `requiresItems` gates:
    - `gather` → “Materials ready”: Pine board ×1, Wood glue ×1, Handsaw ×1, tape measure ×1, Sandpaper pack ×1, claw hammer (16 oz) ×1, safety goggles ×1
    - `cut` → “Panels are cut”: Birdhouse panel set ×1
    - `assemble` → “Shell is glued up”: Glued birdhouse shell ×1
    - `finish` → “Ready to mount”: Birdhouse ×1
- Grants:
    - `gather` → “Gather materials”: Pine board ×1, Wood glue ×1, Handsaw ×1, tape measure ×1, Sandpaper pack ×1, claw hammer (16 oz) ×1, safety goggles ×1
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - [`build-birdhouse`](/processes/build-birdhouse)
        - Requires: safety goggles ×1, tape measure ×1
        - Consumes: Glued birdhouse shell ×1, Sandpaper pack ×1
        - Creates: Birdhouse ×1
    - [`cut-birdhouse-panels`](/processes/cut-birdhouse-panels)
        - Requires: Handsaw ×1, safety goggles ×1, tape measure ×1
        - Consumes: Pine board ×1
        - Creates: Birdhouse panel set ×1
    - [`glue-birdhouse-shell`](/processes/glue-birdhouse-shell)
        - Requires: claw hammer (16 oz) ×1, safety goggles ×1, tape measure ×1
        - Consumes: Birdhouse panel set ×1, Wood glue ×1
        - Creates: Glued birdhouse shell ×1

## 3) Build a step stool (`woodworking/step-stool`)

- Quest link: `/quests/woodworking/step-stool`
- Unlock prerequisite: `requiresQuests`: ['woodworking/birdhouse', 'woodworking/planter-box']
- Dialogue `requiresItems` gates:
    - `gather` → “Parts ready”: Pine board ×2, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
- Grants:
    - `gather` → “Gather parts”: Pine board ×2, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - `finish` → “Take the stool”: Step stool ×1
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 4) Build a small bookshelf (`woodworking/bookshelf`)

- Quest link: `/quests/woodworking/bookshelf`
- Unlock prerequisite: `requiresQuests`: ['woodworking/step-stool']
- Dialogue `requiresItems` gates:
    - `gather` → “All materials ready”: Pine board ×4, Wood glue ×1, Handsaw ×1
- Grants:
    - `gather` → “Buy lumber”: Pine board ×4, Wood glue ×1, Handsaw ×1
    - `finish` → “Take the bookshelf”: Bookshelf ×1
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 5) Finish Sand Your Project (`woodworking/finish-sanding`)

- Quest link: `/quests/woodworking/finish-sanding`
- Unlock prerequisite: `requiresQuests`: ['woodworking/step-stool']
- Dialogue `requiresItems` gates:
    - `sand` → “Surface looks even”: Sandpaper pack ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: paintbrush ×1, Sandpaper pack ×1
- Processes used:
    - None

## 6) Build a simple workbench (`woodworking/workbench`)

- Quest link: `/quests/woodworking/workbench`
- Unlock prerequisite: `requiresQuests`: ['woodworking/step-stool']
- Dialogue `requiresItems` gates:
    - `materials` → “I've got everything ready.”: Pine board ×4, Wood glue ×1
- Grants:
    - `materials` → “Thanks for the supplies!”: Pine board ×4, Wood glue ×1
    - `finish` → “Claim my new workbench.”: Workbench ×1
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 7) Build a coffee table (`woodworking/coffee-table`)

- Quest link: `/quests/woodworking/coffee-table`
- Unlock prerequisite: `requiresQuests`: ['woodworking/bookshelf']
- Dialogue `requiresItems` gates:
    - `gather` → “Materials ready”: Pine board ×6, Wood glue ×1, Handsaw ×1
- Grants:
    - `gather` → “Gather materials”: Pine board ×6, Wood glue ×1, Handsaw ×1
    - Quest-level `grantsItems`: None
- Rewards: cured compost bucket ×1
- Processes used:
    - None

## 8) Apply a Wood Finish (`woodworking/apply-finish`)

- Quest link: `/quests/woodworking/apply-finish`
- Unlock prerequisite: `requiresQuests`: ['woodworking/finish-sanding']
- Dialogue `requiresItems` gates:
    - `gather` → “Ready to apply”: paintbrush ×1
- Grants:
    - `gather` → “Take the brush”: paintbrush ×1
    - Quest-level `grantsItems`: None
- Rewards: Wood glue ×1, Sandpaper pack ×1
- Processes used:
    - None

## 9) Build a Tool Rack (`woodworking/tool-rack`)

- Quest link: `/quests/woodworking/tool-rack`
- Unlock prerequisite: `requiresQuests`: ['woodworking/workbench']
- Dialogue `requiresItems` gates:
    - `gather` → “Materials ready”: Pine board ×1, Handsaw ×1, Wood glue ×1, wood chisel ×1, Sandpaper pack ×1
    - `cut` → “Slots look good”: Pine board ×1, Handsaw ×1, wood chisel ×1, Sandpaper pack ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: Wood glue ×1, Sandpaper pack ×1
- Processes used:
    - None

## 10) Craft a Picture Frame (`woodworking/picture-frame`)

- Quest link: `/quests/woodworking/picture-frame`
- Unlock prerequisite: `requiresQuests`: ['woodworking/tool-rack']
- Dialogue `requiresItems` gates:
    - `assemble` → “Miters are clamped”: Pine board ×1, Wood glue ×1, Handsaw ×1, Sandpaper pack ×1
- Grants:
    - Option/step `grantsItems`: None
    - Quest-level `grantsItems`: None
- Rewards: paintbrush ×1, Wood glue ×1
- Processes used:
    - None

## QA flow notes

- Cross-quest dependencies:
    - `woodworking/planter-box` unlocks after: welcome/howtodoquests
    - `woodworking/birdhouse` unlocks after: woodworking/planter-box
    - `woodworking/step-stool` unlocks after: woodworking/birdhouse, woodworking/planter-box
    - `woodworking/bookshelf` unlocks after: woodworking/step-stool
    - `woodworking/finish-sanding` unlocks after: woodworking/step-stool
    - `woodworking/workbench` unlocks after: woodworking/step-stool
    - `woodworking/coffee-table` unlocks after: woodworking/bookshelf
    - `woodworking/apply-finish` unlocks after: woodworking/finish-sanding
    - `woodworking/tool-rack` unlocks after: woodworking/workbench
    - `woodworking/picture-frame` unlocks after: woodworking/tool-rack
- Progression integrity checks:
    - Verify each quest can be started with its documented `requiresQuests` and item gates.
    - Confirm process outputs satisfy the next gated dialogue option before finishing each quest.
- Known pitfalls / shared-process notes: none found in this tree.
