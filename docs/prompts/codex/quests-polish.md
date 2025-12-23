```markdown
# DSPACE quest quality lift (bare → shippable)

You are Codex working in the democratizedspace/dspace repository on branch v3.
Follow every instruction and stop after delivering the requested artifacts.

## Gold-standard references (v2.1)
Study these v2.1 quests before editing. They show staged gating, realistic
item/process flows, and playful clarity. Paths are on commit
`d956e807d49114da2d0ff28aacef91341813bf82` (shorthand `d956e807`); open a file
with `git show d956e807:<path>`:

- `frontend/src/pages/quests/json/hydroponics/basil.json` — multi-node grow
  loop with tool/consumable usage (soak → seed → transplant → light) and
  intermediate outputs (plugs, seedlings, mature plants).
- `frontend/src/pages/quests/json/rocketry/firstlaunch.json` — modular print
  and assembly steps that force adhesive/tether use before a gated launch.
- `frontend/src/pages/quests/json/aquaria/goldfish.json` — tutorial pacing
  (supplies → cycle → fish → feed) with setup gating and believable care loops.
- `frontend/src/pages/quests/json/ubi/basicincome.json` — branching lore with a
  timed payout process, showing how to blend exposition with a simple mechanic.
- `frontend/src/pages/quests/json/energy/solar-1kWh.json` — realistic teardown
  and rebuild that charges via a process instead of auto-granting power.

Mirror their pacing, gating, item semantics, and voice.

## Mission
Find “bare” quests in `frontend/src/pages/quests/json` and upgrade them so they
play like the v2.1 exemplars. Keep existing IDs unless you add genuinely new
items or processes. Avoid churn outside touched quests.

## Candidate heuristics (pick 5–10 quests max per PR)
- Dialogue ends in a single `finish` branch or 1–2 shallow nodes.
- Processes don’t **consume** inputs, never **create** the final item, or hand
  out rewards via `grantsItems` without work.
- `requiresItems` don’t line up with earlier steps (missing intermediate items,
  skips past necessary tooling, or dead-end gating).
- Hardening blocks are missing, mis-scored, or fail the emoji/score rules.
- Quests or referenced items lack image manifests while peers have them.

## Upgrade recipe
- Add sequential processes that require tools/materials, **consume** consumables,
  and **create** intermediate items en route to a final **create** step for the
  finished item (no direct `grantsItems` on finish).
- Gate dialogue with `requiresItems` so players must finish prior steps before
  advancing or completing. Keep branches coherent and avoid dead ends.
- Reconcile inventory: align `requiresItems` with what earlier processes create,
  add intermediates when needed, and avoid overloading unrelated items.
- Preserve existing IDs; only mint new IDs for new items/processes. Keep text
  playful, specific, and instructional.

## Hardening (quests + processes)
- Every quest and process needs a `hardening` block mirroring the item schema:
  `{ "passes": number, "score": number, "emoji": string, "history": [{ "task":
  string, "date": "YYYY-MM-DD", "score": number }] }`.
- Enforce: `passes === history.length`; `score` is an integer 0–100; emoji:
  0 → 🛠️, ≥1 pass & score ≥ 60 → 🌀, ≥2 passes & score ≥ 75 → ✅, ≥3 passes &
  score ≥ 90 → 💯.
- After edits run `npm run hardening:fix`, then `npm run hardening:validate` to
  sync scores with the shared evaluator.

## Images (manifests only — NO binary assets)
- Add or update JSON manifests only. Do **not** add `.jpg/.png/.webp` files.
- Place manifests for items under `frontend/public/assets/` and for quests under
  `frontend/public/assets/quests/`. Reuse existing filenames when an asset
  already exists.
- Schema (match ordering/keys):
  {
    "filename": "/assets[/quests]/<slug>.jpg",
    "entity": "frontend/src/pages/<inventory|quests>/json/.../<file>.json",
    "item_name": "<display name>",
    "item_id": "<uuid or quest slug>",
    "entity_type": "item" | "quest",
    "prompt": "<detailed Nano Banana Pro prompt>",
    "image_model": "Nano Banana Pro",
    "resolution": "512x512"
  }
- Point `entity` at the canonical JSON, set `entity_type` correctly, and keep
  prompts brand-free and specific. Prefer existing manifests as templates.

## Generated vs. source-of-truth files
- Quest JSON lives in `frontend/src/pages/quests/json`. If a generated
  counterpart exists in `frontend/src/generated/`, regenerate via the published
  script instead of hand-editing.
- After adding or removing quests, run `npm run new-quests:update` to refresh
  `docs/new-quests.md` and its frontend copy. Run `npm run gen:quest-tree` if
  tree outputs are touched.
- Run JSON parse checks and keep formatting consistent with `frontend/.prettierrc`.

## Validation & hygiene
- Prefer the same checks CI runs: `npm run check`, `npm run link-check`, and
  `npm run test:ci` (set `SKIP_E2E=1` if browsers are unavailable). These call
  `frontend/scripts/build-processes.mjs` automatically.
- When hardening changes are present, ensure `npm run hardening:validate`
  passes. Use `npm run itemValidation` if item schemas were touched.
- If `scripts/scan-secrets.py` exists, scan staged changes:
  `git diff --cached | ./scripts/scan-secrets.py`.

## Output for your PR
- List upgraded quests plus notable process/item/manifest changes (no binary
  images added).
- Note commands run and results. Keep scope limited to 5–10 upgraded quests.
```
