# Quest polish prompt for turning bare quests into shippable adventures

Use this prompt when you need to identify thin or placeholder quests in v3 and
rebuild them into coherent, realistic stories with multi-step item flows.

## Copy-ready prompt
```markdown
# DSPACE quest quality lift (bare → shippable)

You are Codex working in the democratizedspace/dspace repository on branch v3.
Follow every instruction and stop after delivering the requested artifacts.

## Gold-standard references (v2.1 and earlier)
Study these older quests before editing. They show tight gating, grounded
processes, and playful but clear dialogue. Paths use commit
`d956e807d49114da2d0ff28aacef91341813bf82` on the `main` branch (v2.1
release). To open any reference, run `git show
d956e807d49114da2d0ff28aacef91341813bf82:<path>`; reuse `d956e807` for
abbreviated mentions below:

- `frontend/src/pages/quests/json/hydroponics/basil.json` — deep multi-node
  sequence that paces setup → water prep → seeding → transplant → lighting, with
  processes that consume and create intermediate items (rockwool, seedlings,
  nutrient mix) and humorous coaching that reinforces gating.
- `frontend/src/pages/quests/json/rocketry/firstlaunch.json` — modular build and
  launch path that forces you to print four components, assemble with adhesives
  and cords, then gate launch on having pad, igniter, and controller before
  rewarding the flown rocket.
- `frontend/src/pages/quests/json/aquaria/goldfish.json` — approachable tutorial
  with clear supply list, separate setup and feeding processes, and gating that
  requires a prepared aquarium before adding fish and completing.
- `frontend/src/pages/quests/json/ubi/basicincome.json` — branching exposition
  that answers “why” questions about UBI, keeps optional lore loops, then gates
  payout behind a timed process, illustrating how to mix narrative with a simple
  mechanic.
- `frontend/src/pages/quests/json/energy/solar-1kWh.json` — pragmatic upgrade
  quest where disassembly and reassembly steps match the storage bump, charges
  through a process instead of auto-granting, and keeps rewards modest.

## Mission
Find “bare” quests in `frontend/src/pages/quests/json` and upgrade them so they
play like the v2.1 exemplars. Keep IDs stable unless you add new intermediate
items or processes. Avoid gratuitous churn outside the quests you touch.

## References
- Review the v2.1 gold-standard quests at commit `d956e807`:
  - hydroponics/basil — staged setup, consumable use, and intermediate outputs.
  - rocketry/firstlaunch — modular prints → assembly → gated launch.
  - aquaria/goldfish — supplies list, setup → fish → feeding.
  - ubi/basicincome — branching lore plus a timed earn process.
  - energy/solar-1kWh — realistic teardown/rebuild → charge process.
- Mirror their pacing, gating, item semantics, and voice (playful but clear).

## Candidate discovery (pick 5–10 quests max per PR)
- Prioritize quests with very short dialogue chains, no mid-quest gating, or a
  single `finish` branch.
- Flag processes that don’t consume inputs or never create the final item.
- Look for rewards given without doing work (grantsItems straight to finish).
- Catch gating mismatches: `requiresItems` that don’t match earlier processes or
  missing intermediate items that should be produced.
- Identify placeholder media: missing quest images or items that lack image
  manifests alongside similar items.

## Upgrade recipe
- Add sequential processes that require tools/materials, **consume**
  consumables, and **create** intermediate items where useful (parts → assembly
  → final product). The final process should **create** the finished item instead
  of granting it outright.
- Gate dialogue using `requiresItems` so players must finish prior steps before
  advancing or finishing. Keep branching coherent and avoid dead ends.
- Reconcile items: ensure `requiresItems` match what earlier processes create;
  add intermediate items when needed instead of overloading existing ones.
- Respect existing quest IDs and only add new IDs for genuinely new items or
  processes.

## Hardening breadcrumbs (quests + processes)
- Every quest and process must include a `hardening` block mirroring the item
  schema: `{ "passes": number, "score": number, "emoji": string, "history":
  [{ "task": string, "date": "YYYY-MM-DD", "score": number }] }`.
- Enforce the shared rules: `passes === history.length`, `score` is an integer
  between 0–100, and `emoji` follows the item thresholds (0 → 🛠️, ≥1 pass &
  score ≥ 60 → 🌀, ≥2 passes & score ≥ 75 → ✅, ≥3 passes & score ≥ 90 → 💯).
- When editing quest or process text, run `npm run hardening:fix` to normalize
  scores and `npm run hardening:validate` before committing. These commands
  reuse the shared evaluator so `hardening.score` stays at or above the
  computed quality score.

## Images (NO BINARY ASSETS)
- Do **not** add `.jpg`, `.png`, `.webp`, etc. Add **only** image manifest
  JSON files matching existing examples under `frontend/public/assets/` or
  `frontend/public/assets/quests/`. The human maintainer will generate the
  actual images locally with Nano Banana Pro and commit them later.
- Find an existing manifest JSON and mirror its schema exactly. Typical shape:
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
- Point manifests at the correct item registry entry and reuse existing
  filenames if the asset already exists.

## Generated vs source-of-truth files
- Locate `frontend/src/generated/*` counterparts. Prefer regenerating via the
  documented scripts (search `package.json`/`README.md`/prompt docs) instead of
  hand-editing generated JSON.
- Run JSON parse checks after edits; keep formatting consistent with Prettier
  configs already in the repo.

## Validation & hygiene
- Inspect `.github/workflows/` and `package.json` to run the same checks CI
  runs (lint/type-check/build/tests) relevant to quest edits. If checks are
  heavy, at least run JSON validation scripts referenced in README or existing
  prompt docs.
- If `scripts/scan-secrets.py` exists, scan staged changes for secrets with
  `git diff --cached | ./scripts/scan-secrets.py`.

## Output for your PR
- List upgraded quests and summarize new/changed processes, items, and manifests
  (no binary images added).
- Note commands run and their results. Keep scope limited to 5–10 quests with
  coherent item flows and realistic processes.
```

## Upgrade prompt
```markdown
# Upgrade the quest polish prompt

You are Codex reviewing `docs/prompts/codex/quests-polish.md`. Tighten the copy-
ready prompt so it stays aligned with current quest quality bar and image
manifest practices.

- Keep the v2.1 reference list fresh; swap in better exemplars as they emerge.
- Refine bare-quest heuristics and the upgrade recipe as schemas evolve.
- Ensure the manifest JSON guidance matches the live schema and paths.
- Verify instructions about generated files and required checks reflect current
  scripts.
- Output a single fenced code block replacing the existing prompt content.
```
