---
title: 'Woodworking'
slug: 'woodworking'
---

Woodworking quests build practical progression through the woodworking skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Build a Planter Box](/quests/woodworking/planter-box)
2. [Build a birdhouse](/quests/woodworking/birdhouse)
3. [Build a step stool](/quests/woodworking/step-stool)
4. [Build a small bookshelf](/quests/woodworking/bookshelf)
5. [Build a coffee table](/quests/woodworking/coffee-table)
6. [Finish Sand Your Project](/quests/woodworking/finish-sanding)
7. [Apply a Wood Finish](/quests/woodworking/apply-finish)
8. [Build a simple workbench](/quests/woodworking/workbench)
9. [Build a Tool Rack](/quests/woodworking/tool-rack)
10. [Craft a Picture Frame](/quests/woodworking/picture-frame)

## 1) Build a Planter Box (`woodworking/planter-box`)

- Quest link: [/quests/woodworking/planter-box](/quests/woodworking/planter-box)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `gather` → "Materials ready" — Pine board ×4, Wood glue ×1, claw hammer (16 oz) ×1, Handsaw ×1, Sandpaper pack ×1
    - `build` → "Assembly done, move to liner check" — Pine planter box ×1
    - `seal` → "Drainage and stability verified" — Pine planter box ×1
- Grants:
    - `gather` → "Gather materials" — claw hammer (16 oz) ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - dChat ×1, dUSD ×1000
- Processes used:
    - [assemble-planter-box](/processes/assemble-planter-box)
        - Requires: Handsaw ×1, claw hammer (16 oz) ×1
        - Consumes: Pine board ×4, Wood glue ×1, Sandpaper pack ×1
        - Creates: Pine planter box ×1
- Troubleshooting/safety branches:
    - `drainage` now routes back through `gather` so players always stage tools/materials before entering `fit-choice` and `build`.
    - `fit-choice` adds alternate dry-fit vs pre-drill assembly strategies.
    - `troubleshoot` loops split-corner recovery back into verified assembly steps and routes unsafe conditions to `safety`.

## 2) Build a birdhouse (`woodworking/birdhouse`)

- Quest link: [/quests/woodworking/birdhouse](/quests/woodworking/birdhouse)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/planter-box`
- Dialogue `requiresItems` gates:
    - `gather` → "Materials ready" — Pine board ×1, Wood glue ×1, Handsaw ×1, tape measure ×1, Sandpaper pack ×1, claw hammer (16 oz) ×1, safety goggles ×1
    - `cut` → "Panels are cut" — Birdhouse panel set ×1
    - `assemble` → "Shell is glued up" — Glued birdhouse shell ×1
    - `finish` → "Ready to mount" — Birdhouse ×1
- Grants:
    - `gather` → "Gather materials" — Pine board ×1, Wood glue ×1, Handsaw ×1, tape measure ×1, Sandpaper pack ×1, claw hammer (16 oz) ×1, safety goggles ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Pine planter box ×1, basil seeds ×1
- Processes used:
    - [cut-birdhouse-panels](/processes/cut-birdhouse-panels)
        - Requires: Handsaw ×1, safety goggles ×1, tape measure ×1
        - Consumes: Pine board ×1
        - Creates: Birdhouse panel set ×1
    - [glue-birdhouse-shell](/processes/glue-birdhouse-shell)
        - Requires: claw hammer (16 oz) ×1, safety goggles ×1, tape measure ×1
        - Consumes: Birdhouse panel set ×1, Wood glue ×1
        - Creates: Glued birdhouse shell ×1
    - [build-birdhouse](/processes/build-birdhouse)
        - Requires: safety goggles ×1, tape measure ×1
        - Consumes: Glued birdhouse shell ×1, Sandpaper pack ×1
        - Creates: Birdhouse ×1
- Troubleshooting/safety branches:
    - `template-jig` provides an alternate template-first path before committing to cuts.
    - `troubleshoot-joints` handles split panels or wobble, then routes back to recut/re-assembly retries.

## 3) Build a step stool (`woodworking/step-stool`)

- Quest link: [/quests/woodworking/step-stool](/quests/woodworking/step-stool)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/birdhouse`, `woodworking/planter-box`
- Dialogue `requiresItems` gates:
    - `gather` → "Parts ready" — Pine board ×2, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - `frame-first` / `step-first` → "...verified" — tape measure ×1, safety goggles ×1
    - `wobble-check` → "No wobble and edges are safe to touch" — tape measure ×1, safety goggles ×1
- Grants:
    - `gather` → "Gather parts" — Pine board ×2, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Pine planter box ×1, basil seeds ×1
- Processes used:
    - [assemble-step-stool](/processes/assemble-step-stool)
        - Requires: Handsaw ×1, tape measure ×1, safety goggles ×1
        - Consumes: Pine board ×2, Wood glue ×1
        - Creates: Step stool ×1
- Troubleshooting/safety branches:
    - `fix-loop` enforces re-square/trim correction and retries before final claim.
    - Explicit stop condition for degraded tool control routes to `safe-pause`, which ends the session without granting the stool.

## 4) Build a small bookshelf (`woodworking/bookshelf`)

- Quest link: [/quests/woodworking/bookshelf](/quests/woodworking/bookshelf)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/step-stool`
- Dialogue `requiresItems` gates:
    - `gather` → "Kit staged with PPE and measuring tools" — Pine board ×4, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - `wide-shelves` / `narrow-shelves` → "...dry-fit..." — tape measure ×1, safety goggles ×1
    - `square-check` → "Square verified; glue-up cured safely" — Wood glue ×1, tape measure ×1, safety goggles ×1
- Grants:
    - `gather` → "Issue the bookshelf kit" — Pine board ×4, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Pine planter box ×1
- Processes used:
    - [assemble-bookshelf](/processes/assemble-bookshelf)
        - Requires: Handsaw ×1, tape measure ×1, safety goggles ×1
        - Consumes: Pine board ×4, Wood glue ×1
        - Creates: Bookshelf ×1
- Troubleshooting/safety branches:
    - `choose-joinery` introduces main/alternate build strategies before square validation.
    - `troubleshoot` requires a re-mark/re-cut loop and routes unsafe conditions to `safe-pause`, which ends without granting the bookshelf.

## 5) Build a coffee table (`woodworking/coffee-table`)

- Quest link: [/quests/woodworking/coffee-table](/quests/woodworking/coffee-table)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/bookshelf`
- Dialogue `requiresItems` gates:
    - `gather` → "Materials staged and safety checks complete" — Pine board ×6, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - `apron-frame` / `top-panel` → "...complete" — tape measure ×1, safety goggles ×1
    - `stability-check` → "No wobble, no rack, and glue joints look sound" — Wood glue ×1, tape measure ×1, safety goggles ×1
- Grants:
    - `gather` → "Issue table materials and PPE" — Pine board ×6, Wood glue ×1, Handsaw ×1, tape measure ×1, safety goggles ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Step stool ×1
- Processes used:
    - [assemble-coffee-table](/processes/assemble-coffee-table)
        - Requires: Handsaw ×1, tape measure ×1, safety goggles ×1
        - Consumes: Pine board ×6, Wood glue ×1
        - Creates: Coffee table ×1
- Troubleshooting/safety branches:
    - `strategy` adds main/alternate assembly plans before the stability gate.
    - `rework` loops through re-square + retest and includes an unsafe-conditions stop path.

## 6) Finish Sand Your Project (`woodworking/finish-sanding`)

- Quest link: [/quests/woodworking/finish-sanding](/quests/woodworking/finish-sanding)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/step-stool`
- Dialogue `requiresItems` gates:
    - `strategy` → "Hand-block edges first" / "Panel passes first" — Sandpaper pack ×1
    - `scratch-check` → "Grain-aligned scratch pattern confirmed" — Sandpaper pack ×1
    - `dust` → "Surface is dust-free and ready" — Sandpaper pack ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Pine planter box ×1
- Processes used:
    - None
- Troubleshooting/safety branches:
    - `strategy` adds main/alternate sanding approaches before acceptance gates.
    - `troubleshoot` enforces rework + retry loops and can route through `safety` before progress resumes.

## 7) Apply a Wood Finish (`woodworking/apply-finish`)

- Quest link: [/quests/woodworking/apply-finish](/quests/woodworking/apply-finish)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/finish-sanding`
- Dialogue `requiresItems` gates:
    - `gather` → "Start first coat" — paintbrush ×1, Sandpaper pack ×1
    - `inspect-coat` → "Surface passed inspection" — paintbrush ×1, Sandpaper pack ×1
    - `second-coat` → "Second coat cured and dry to touch" — paintbrush ×1
- Grants:
    - `gather` → "Take the brush" — paintbrush ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - paintbrush ×1, Sandpaper pack ×1
- Processes used:
    - None
- Troubleshooting/safety branches:
    - `safety-reset` handles solvent buildup and oily-rag fire-risk mitigation before finish work resumes.
    - `fix-runs` routes drips/sags into a repair loop before second-coat verification.

## 8) Build a simple workbench (`woodworking/workbench`)

- Quest link: [/quests/woodworking/workbench](/quests/woodworking/workbench)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/step-stool`
- Dialogue `requiresItems` gates:
    - `materials` → "I've got the tools and stock" — Pine board ×4, Wood glue ×1, Handsaw ×1, tape measure ×1
    - `build-top` → "Top frame cured and square" — Pine board ×4, Wood glue ×1
    - `leg-fit` → "Frame stands without wobble" — tape measure ×1, Handsaw ×1
    - `level-check` → "Level checks passed and structure feels solid" — Handsaw ×1
- Grants:
    - `materials` → "Issue me the starter kit" — Pine board ×4, Wood glue ×1, Handsaw ×1, tape measure ×1
    - Quest-level `grantsItems`: None
- Rewards:
    - Pine planter box ×1
- Processes used:
    - [assemble-workbench](/processes/assemble-workbench)
        - Requires: Handsaw ×1, tape measure ×1
        - Consumes: Pine board ×4, Wood glue ×1
        - Creates: Workbench ×1
- Troubleshooting/safety branches:
    - `glue-recovery` re-squares a drifted top frame before leg assembly.
    - `wobble-fix` and `level-check` enforce a stable, level bench before completion.

## 9) Build a Tool Rack (`woodworking/tool-rack`)

- Quest link: [/quests/woodworking/tool-rack](/quests/woodworking/tool-rack)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/workbench`
- Dialogue `requiresItems` gates:
    - `gather` → "Materials ready" — Pine board ×1, Handsaw ×1, Wood glue ×1, wood chisel ×1, Sandpaper pack ×1
    - `slot-first` / `hook-first` → "...verified" — Pine board ×1, Handsaw ×1, wood chisel ×1, Sandpaper pack ×1
    - `mount-prep` → "Rack is mounted and level" — Wood glue ×1, Sandpaper pack ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Step stool ×1
- Processes used:
    - [assemble-tool-rack](/processes/assemble-tool-rack)
        - Requires: Handsaw ×1, wood chisel ×1, Sandpaper pack ×1
        - Consumes: Pine board ×1, Wood glue ×1
        - Creates: Tool rack ×1
- Troubleshooting/safety branches:
    - `cut-strategy` adds slot-first and hook-first build paths.
    - `troubleshoot` forces spacing/load corrections and can route to `safety` for wall-hazard resets before reattempting mount verification.

## 10) Craft a Picture Frame (`woodworking/picture-frame`)

- Quest link: [/quests/woodworking/picture-frame](/quests/woodworking/picture-frame)
- Unlock prerequisite:
    - `requiresQuests`: `woodworking/tool-rack`
- Dialogue `requiresItems` gates:
    - `assemble` → "Miters are clamped" — Pine board ×1, Wood glue ×1, Handsaw ×1, Sandpaper pack ×1
    - `verify-square` → "Diagonals match and glue is set" — Pine board ×1, Handsaw ×1
    - `surface-prep` → "Surface is smooth" — Sandpaper pack ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - Wood glue ×1, Sandpaper pack ×1
- Processes used:
    - [assemble-picture-frame](/processes/assemble-picture-frame)
        - Requires: Handsaw ×1, Sandpaper pack ×1
        - Consumes: Pine board ×1, Wood glue ×1
        - Creates: Picture frame ×1
- Troubleshooting/safety branches:
    - `miter-repair` handles open-corner recovery before square verification.
    - `hardware-fix` and `hang-check` verify hanger integrity with a safe load test before finish.

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
