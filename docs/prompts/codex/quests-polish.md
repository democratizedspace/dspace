# DSPACE quest polish prompt

Use this when the v3 quest backlog needs a quality pass to turn bare quest shells
into shippable, multi-step experiences with coherent items, processes, and image
manifests.

## Gold standard references (v2.1 and earlier)
Study these older quests for branching, realistic processes, and clean item
flows. Open them at the listed refs to mirror their pacing and gating without
copying text directly.

- `d956e807:frontend/src/pages/quests/json/hydroponics/basil.json`
  - Multi-week flow with staged water prep, germination, transplant, lighting,
    harvest, and regrowth; processes consume materials and gate dialogue on
    intermediate items.
- `d956e807:frontend/src/pages/quests/json/rocketry/firstlaunch.json`
  - Modular print-and-assemble cadence, humor, and clear gating that requires
    every printed part plus launch gear before ignition.
- `d956e807:frontend/src/pages/quests/json/energy/solar.json`
  - Concise but grounded setup: bundled starter kit, enclosure assembly process,
    then charging step that ties rewards to produced energy.
- `d956e807:frontend/src/pages/quests/json/aquaria/goldfish.json`
  - Friendly tutorial tone with maintenance education, staged setup, and gating
    around tank preparation before introducing fish care loops.

## Copy-ready prompt
```markdown
# DSPACE quest polish prompt

You are Codex working in the democratizedspace/dspace repository on the v3
branch. Follow all instructions and stop after delivering the requested
artifacts.

## Mission
Find bare or underdeveloped quests and upgrade them into realistic, multi-step
experiences with coherent item flows, processes, gating, and manifest JSON image
placeholders (no binary images).

## References
Use these v2.1-and-earlier exemplars as style/tone/process references:
- hydroponics/basil (`d956e807:frontend/src/pages/quests/json/hydroponics/basil.json`)
- rocketry/firstlaunch (`d956e807:frontend/src/pages/quests/json/rocketry/firstlaunch.json`)
- energy/solar (`d956e807:frontend/src/pages/quests/json/energy/solar.json`)
- aquaria/goldfish (`d956e807:frontend/src/pages/quests/json/aquaria/goldfish.json`)

## Candidate discovery (pick 5–10 quests per PR)
- Scan `frontend/src/pages/quests/json` for quests with few dialogue nodes,
  single-path flows, or rewards granted without meaningful work.
- Flag quests whose `process` steps do not consume materials, do not create
  intermediate items, or bypass the final item creation.
- Look for missing or placeholder images for new items; note where manifests are
  absent.
- Identify gating mismatches (e.g., `requiresItems` not provided by earlier
  steps, or dialogue that jumps straight to finish).
- Prefer clusters within the same quest tree to keep scope bounded; avoid edits
  to more than ~10 quests per PR.

## Upgrade recipe
- Preserve existing quest IDs; add intermediate items only when necessary to
  express real-world steps. Keep dialogue tone aligned with nearby quests.
- Add sequential processes that:
  - require appropriate tools/materials;
  - **consume** consumables (adhesives, feed, boards, etc.) when used;
  - **create** intermediate items when useful (panels → shell → finished item);
  - end with the final item created by the last process (avoid free rewards).
- Gate dialogue on the right items before advancing; ensure `requiresItems`
  align with what earlier processes produce.
- Update `rewards` to fit the upgraded effort without breaking progression;
  keep `requiresQuests` chains coherent.

## Image manifest rule (NO BINARY IMAGES)
- Do **not** add `.jpg/.png/.webp` files.
- When new item art is needed, add manifest JSON entries alongside existing
  examples under `frontend/public/assets/` or `frontend/public/assets/quests/`.
- Match the live schema from the repo; use this sketch only as a reminder:
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
- Cross-check existing manifests for exact keys, casing, and placement.

## Generated vs source-of-truth hygiene
- Prefer regenerating files in `frontend/src/generated/*` via repo scripts if
  changes are needed; avoid manual edits unless explicitly required.
- Run JSON parse checks on edited quests/manifests; keep formatting consistent
  with existing files.

## Execution checklist
1. Select 5–10 bare quests and upgrade them using the recipe above.
2. Keep PR scope focused; avoid unrelated churn.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci -- questCanonical questQuality`.
4. Scan staged changes: `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji prefix.

## Output (for the PR description)
- List quests upgraded and key changes to processes/items/manifests.
- Note any new intermediate items, their gating, and added manifests.
- Include commands run and results; call out skipped checks with reasons.
- Keep changes minimal, coherent, and ready to merge.
```

## Upgrade prompt
```markdown
# Upgrade the quest polish prompt

You are Codex reviewing `docs/prompts/codex/quests-polish.md`. Improve the
primary prompt so it stays copy-paste ready, precise, and aligned with current
quest quality standards.

## Instructions
- Retain the mission, references section, candidate discovery heuristics, image
  manifest rules, and execution checklist.
- Update references when better exemplars appear; keep the list diverse across
  quest trees.
- Tighten language, remove duplication, and refresh commands/tests as repo
  tooling evolves.
- Output a single fenced code block replacing the existing prompt when done.
```
