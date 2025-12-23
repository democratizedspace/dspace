```markdown
# DSPACE quest polish (bare → shippable)

You are Codex working in the democratizedspace/dspace repository. Identify thin quests and
upgrade them into grounded, multi-step stories that meet the current quest schema, hardening,
and asset practices.

## Gold-standard references (v2.1)
Study these quests at commit `d956e807d49114da2d0ff28aacef91341813bf82` (use `git show
d956e807:<path>`) to mirror their pacing, gating, and item/process realism:
- `frontend/src/pages/quests/json/hydroponics/basil.json` — staged setup → water prep → seeding
  → transplant → lighting, with intermediate consumables and playful coaching.
- `frontend/src/pages/quests/json/rocketry/firstlaunch.json` — modular printing, assembly,
  launch gating, and rewards that flow from created components instead of handouts.
- `frontend/src/pages/quests/json/aquaria/goldfish.json` — clear supply list, setup before fish,
  and repeatable care steps that reinforce timing and safety.
- `frontend/src/pages/quests/json/energy/solar-1kWh.json` — realistic teardown/rebuild path,
  charging gated through a process, and modest rewards aligned to the work.
- `frontend/src/pages/quests/json/ubi/basicincome.json` — branching exposition plus a timed earn
  process that balances lore with a simple mechanic.

## Mission and scope
- Work in `frontend/src/pages/quests/json`. Keep quest IDs stable unless you introduce truly new
  items or processes.
- Limit each PR to 5–10 upgraded quests. Avoid touching unrelated files or renaming existing
  assets without cause.

## Detecting bare or drifting quests
- Single-node or single-`finish` paths with no mid-quest gating or missing `requiresItems`.
- Rewards granted via `grantsItems` without a preceding process that **creates** the final item.
- `requiresItems` or `requiresQuests` that do not line up with earlier nodes, produced items, or
  real progression.
- Missing or stale `hardening` blocks (score/passes mismatch, no history entry, emoji off).
- Quests referencing items/processes that lack registry entries or use placeholder copy.
- Image references that point to absent manifests or to binary files added in Git history.

## Upgrade recipe
- Add stepwise processes that consume materials, use tools, and create intermediate outputs so the
  final process **creates** the finished item instead of granting it outright.
- Gate dialogue with `requiresItems`/`requiresQuests` so players must finish prior steps; keep
  branches coherent and avoid dead ends.
- Reconcile item flow: align `createsItems` and `requiresItems`, add intermediate items when
  needed, and keep IDs consistent with the item registry.
- Keep tone clear, encouraging, and concrete; ensure each node advances the build or knowledge in
  believable increments.

## Hardening requirements
- Every quest and nested process must include a `hardening` block matching the shared item schema:
  `{ "passes": number, "score": number, "emoji": string, "history": [{ "task": string, "date":
  "YYYY-MM-DD", "score": number }] }`.
- Enforce the rules: `passes === history.length`; `score` is an integer 0–100; emoji thresholds:
  0 → 🛠️, ≥1 pass & score ≥ 60 → 🌀, ≥2 passes & score ≥ 75 → ✅, ≥3 passes & score ≥ 90 → 💯.
- After edits run `npm run hardening:fix` then `npm run hardening:validate` so the evaluator and
  metadata stay in sync.

## Images (manifests only, no binaries)
- Do **not** add `.jpg/.png/.webp` files. Add only manifest JSON under `frontend/public/assets/`
  or `frontend/public/assets/quests/`.
- Manifest shape (extend only with fields already used in repo such as `steps` or `cfg`):
  {
    "filename": "/assets/quests/<slug>.jpg",
    "entity_type": "quest",            // or "item" when targeting the item registry
    "entity": "frontend/src/pages/quests/json/<tree>/<id>.json",
    "item_name": "<quest or item name>",
    "item_id": "<quest id or item uuid>",
    "prompt": "<detailed Nano Banana Pro or Z-Image Turbo prompt>",
    "image_model": "Nano Banana Pro",
    "resolution": "512x512",
    "steps": 4,
    "cfg": 1.0
  }
- Point manifests at the authoritative registry entry, reuse filenames if the asset exists, and
  leave image generation to the maintainer.

## Generated files and required checks
- Prefer regeneration over manual edits: `npm run new-quests:update` (refreshes `/docs/new-quests.md`
  and its frontend copy) and `npm run quest:count` when counts change.
- Run `npm run lint`, `npm run type-check`, `npm run build`, and
  `npm run test:ci -- questCanonical questQuality`. Fix any failures.
- Normalize and validate hardening (`npm run hardening:fix` and `npm run hardening:validate`).
- Scan staged changes before committing: `git diff --cached | ./scripts/scan-secrets.py`.

## Output for your PR
- Summarize upgraded quests, newly added or adjusted items/processes, and any manifests (no binary
  images).
- List commands run and their results. Keep the scope tight and progression believable.
```
