# Quest polish prompt for v3

Use this when you need to turn bare or thin v3 quests into shippable, multi-step
experiences without destabilizing the wider quest tree. Preserve existing quest
IDs, keep scope to a small batch per PR, and avoid churn unrelated to quality
polish.

## Gold-standard references (v2.1 and earlier)
These quests predate v3 but still model strong item flows, playful dialogue, and
clear gating. Open them from the referenced commit to see the full patterns.

- **Hydroponics: grow basil** —
  `d956e807d491:frontend/src/pages/quests/json/hydroponics/basil.json`.
  Long-form tutorial with humor, sequential soaking/germination/growing/harvest
  loops, and tight `requiresItems` gating before each stage.
- **Rocketry: first launch** —
  `d956e807d491:frontend/src/pages/quests/json/rocketry/firstlaunch.json`.
  Modular printing of four parts, assembly gating, and late freebies (launchpad,
  igniter, controller) that support a climactic process instead of direct reward
  drops.
- **Energy: set up a solar panel** —
  `d956e807d491:frontend/src/pages/quests/json/energy/solar.json`.
  Crisp starter quest that grants starter hardware, forces enclosure setup via a
  process, then requires charged dSolar before finishing.
- **Aquaria: goldfish starter tank** —
  `d956e807d491:frontend/src/pages/quests/json/aquaria/goldfish.json`.
  Teaches fundamentals through staged setup, consumables, repeatable feeding, and
  reward gating on the fish-in-tank state.

## Copy-ready prompt
```markdown
# DSPACE quest polish prompt (v3)

You are Codex working in the democratizedspace/dspace repository. Follow every
instruction exactly and stop after delivering the requested artifacts.

## Mission
Identify 5–10 bare v3 quests and upgrade them into coherent, multi-step flows
with realistic processes, item consumption/creation, and image manifest JSONs
(no binary images). Keep scope bounded to that set; preserve quest IDs and
existing items unless an intermediate object is clearly missing.

## Candidate discovery
- Surface thin quests by scanning `frontend/src/pages/quests/json/*/*.json` for:
  - 1–2 dialogue nodes with no branching or gating.
  - Missing or trivial `process` steps (or a final reward without work).
  - Processes that fail to consume ingredients or create outputs used later.
  - Gating gaps where `requiresItems` does not match upstream outputs.
  - Quests that grant the finished item directly instead of creating it via the
    final process.
  - Placeholder or missing imagery, especially for new intermediate items.
- Choose 5–10 quests per PR to keep reviewable. Note why each was selected.

## Upgrade recipe
- Add sequential processes that mirror real tasks: gather tools, prep materials,
  build subassemblies, then finalize.
- Ensure processes **consume** expendable supplies (glue, boards, coolant) and
  **create** intermediate items that feed the next gate.
- Gate dialogue transitions with `requiresItems` that match those outputs; avoid
  granting finished rewards until the final process completes.
- If new items are introduced, hook them into the appropriate registries and use
  image manifest JSONs instead of binary art.
- Preserve existing quest IDs and narrative tone. Only add intermediate items or
  images when needed to make the flow believable.

## Image manifest rule (NO BINARY IMAGES)
- Do **not** add `.jpg/.png/.webp` assets. Instead, add manifest JSON files that
  match existing examples under `frontend/public/assets/` or
  `frontend/public/assets/quests/`.
- Reuse the exact schema used in this repo. Typical shape (for reference only,
  match the real manifest format you find):
  {
    "filename": "/assets/quests/example.jpg",
    "entity_type": "item",
    "entity": "frontend/src/pages/inventory/json/items/<category>.json",
    "item_name": "Example item name",
    "item_id": "<uuid>",
    "prompt": "<detailed Nano Banana Pro prompt>",
    "image_model": "Nano Banana Pro",
    "resolution": "512x512"
  }
- When creating manifests, align `item_id` with the canonical item JSON and keep
  file naming consistent with nearby manifests.

## Generated vs. source-of-truth hygiene
- Prefer regenerating any `frontend/src/generated/*` outputs via existing scripts
  instead of manual edits; note the commands you used.
- Validate JSON for every quest/item/process/manifest you touch (parse check or
  `npm run lint` equivalent for docs/code touched).
- Run repo-standard checks for quest work: `npm run lint`, `npm run type-check`,
  `npm run build`, and `npm run test:ci -- questCanonical questQuality` unless
  documented otherwise in AGENTS.md.
- Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.

## Output expectations
- List the quests you upgraded and why they were “bare”.
- Summarize new/changed processes, items, and manifest JSONs (no binary images).
- Include the commands you ran and their results.
- Keep edits minimal and coherent: no unrelated rewrites, no ID churn, and align
  gating so every required item is produced by an earlier step.
```

## Upgrade prompt
```markdown
# Upgrade the quest polish prompt

You are Codex reviewing `docs/prompts/codex/quests-polish.md`. Tighten the
prompt so it stays copy-paste ready for v3 quest quality passes.

- Re-check the gold-standard references and refresh if better early-version
  exemplars surface.
- Keep the mission, candidate heuristics, upgrade recipe, image-manifest rule,
  hygiene, and output expectations. Trim redundancy and update commands as
  workflows evolve.
- Output a single fenced code block replacing the current prompt.
```
