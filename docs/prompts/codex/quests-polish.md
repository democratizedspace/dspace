```markdown
# DSPACE quest quality lift (bare → shippable)

You are Codex working in the democratizedspace/dspace repository on branch v3. Follow every
instruction and stop after delivering the requested artifacts.

## Gold-standard references (v2.1)
Study these v2.1 quests (commit `d956e807d49114da2d0ff28aacef91341813bf82`) before editing.
Open any reference with `git show d956e807d49114da2d0ff28aacef91341813bf82:<path>`:
- `frontend/src/pages/quests/json/hydroponics/basil.json` — paced setup → water prep → seeding
  → transplant → lighting with consumables, intermediate items, and upbeat coaching.
- `frontend/src/pages/quests/json/rocketry/firstlaunch.json` — modular prints, adhesives, wiring,
  and gated launch; only the final process creates the flown rocket.
- `frontend/src/pages/quests/json/aquaria/goldfish.json` — supply list, tank prep, add fish, and
  feeding loops with sensible gating and approachable voice.
- `frontend/src/pages/quests/json/ubi/basicincome.json` — branching exposition that answers “why”
  before a timed payout, showing lore + mechanic balance.
- `frontend/src/pages/quests/json/energy/solar-1kWh.json` — teardown/rebuild that charges storage
  through a process rather than auto-granting rewards.

Mirror their pacing, gating, item semantics, and playful-but-clear dialogue.

## Mission
Find “bare” quests in `frontend/src/pages/quests/json` and upgrade them to the quality of the
references. Keep IDs stable unless you add new intermediate items or processes. Avoid churn outside
the quests you touch.

## Bare-quest heuristics (pick 5–10 quests max per PR)
- Tiny dialogue chains, single `finish` branch, or no mid-quest gating.
- Processes that skip `consumesItems`/`requiresItems` or never `createsItems` for the finale.
- Rewards granted directly via `grantsItems` instead of being created by the last process.
- Missing or placeholder `hardening`, images, or manifests for quests/items that obviously need
  them.
- Gating mismatches: `requiresItems` that do not align with prior outputs or missing intermediates.
- Schema drifts: nodes missing `options`, start/middle/finish structure, or absent `image` fields
  where peers have them.

## Upgrade recipe
- Build sequential processes that **consume** materials, **require** tools, and **create**
  intermediate items en route to a final process that **creates** the finished item.
- Gate dialogue with `requiresItems` so players must finish the prior step before advancing or
  finishing; avoid dead ends and keep branching coherent.
- Keep IDs; add new ones only for truly new items or processes and align `requiresItems` with what
  earlier steps create.
- Ensure every quest has start, middle, and completion nodes with at least one option per node and a
  final `finish` option. Reference at least one inventory item or process per quest.

## Hardening breadcrumbs (quests + processes)
- Each quest and process must include `hardening`:
  `{ "passes": number, "score": number, "emoji": string, "history": [{ "task": string, "date":
  "YYYY-MM-DD", "score": number }] }`.
- Enforce: `passes === history.length`; `score` is an integer 0–100; `emoji` thresholds: 0 → 🛠️,
  ≥1 pass & score ≥ 60 → 🌀, ≥2 passes & score ≥ 75 → ✅, ≥3 passes & score ≥ 90 → 💯.
- After text edits run `npm run hardening:fix`, then `npm run hardening:validate` to keep values in
  sync with the shared evaluator.

## Images (NO BINARY ASSETS)
- Do **not** add `.jpg`, `.png`, `.webp`, etc. Add only manifest JSON under
  `frontend/public/assets/` (items) or `frontend/public/assets/quests/` (quests).
- Mirror the live schema exactly (fields may include optional `steps`, `cfg`, `seed`):
  {
    "filename": "/assets/quests/example.jpg",
    "entity": "frontend/src/pages/quests/json/path/quest.json",
    "entity_type": "quest",
    "item_name": "Quest or item display name",
    "item_id": "quests/path/id-or-item-uuid",
    "prompt": "<detailed Nano Banana Pro prompt>",
    "image_model": "Nano Banana Pro",
    "resolution": "512x512",
    "steps": 4,
    "cfg": 1.0
  }
- Point `entity` to the source JSON (quest or inventory), keep `filename` in `/assets/` or
  `/assets/quests/`, and reuse filenames if the asset already exists. No new binary images.

## Generated vs. source-of-truth files
- Prefer regenerating counterparts in `frontend/src/generated/` via documented scripts instead of
  hand edits:
  - `node frontend/scripts/build-processes.mjs` produces `frontend/src/generated/processes.json`.
  - `node scripts/gen-quest-tree.mjs` and `node scripts/compareQuestCount.mjs` inspect quest
    coverage.
  - `npm run new-quests:update` refreshes quest counts and docs copies.
- Keep JSON parseable and formatted with the frontend Prettier config.

## Validation & hygiene
- Run the checks CI expects for quest work: `npm run hardening:validate`, `npm run link-check`, and
  `npm run test:ci` (uses `SKIP_E2E=1`). Add more (lint/type-check/build) if you touch code.
- Scan staged diffs for secrets if `scripts/scan-secrets.py` exists:
  `git diff --cached | ./scripts/scan-secrets.py`.
- Avoid binary assets; keep diffs tightly scoped to 5–10 quests with coherent item flows.

## Output for your PR
- List upgraded quests and summarize new/changed processes, items, and manifests (no binary images).
- Note commands run and their results.
```
