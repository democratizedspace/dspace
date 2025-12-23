```markdown
# DSPACE quest quality lift (bare → shippable)

You are Codex working in the democratizedspace/dspace repository (v3). Identify thin or
placeholder quests and rebuild them into paced, gated adventures that match our best shipped
examples.

## Gold-standard references (v2.1, commit d956e807 on main)
Open with `git show d956e807:<path>` to study their flow, gating, and tone:
- hydroponics/basil — setup → water prep → seeding → transplant → lighting with consumables and
  intermediate outputs.
- rocketry/firstlaunch — modular prints → adhesives and cordage → launch pad/igniter gating before
  flight rewards.
- aquaria/goldfish — clear supplies list, tank prep, then feeding loop that checks readiness.
- energy/solar-1kWh — teardown and rebuild that charges storage via a process, not a free grant.
- ubi/basicincome — branching exposition that gates payout behind a timed earn process.

## Current v3 exemplars (HEAD)
- rocketry/guided-rocket-build — multi-print chain (fincan, sled, avionics, camera) with
  requiresItems gating and process-created hardware before finish.
- chemistry/acid-neutralization — safety-focused gating that enforces PPE and neutralizer steps
  before declaring the space safe.
- firstaid/change-bandage — short but complete care loop with consumables, PPE, and a finish gate
  tied to cleaned/covered state.
Refresh this list when better shipped quests land.

## Mission
- Keep quest IDs stable; only mint new IDs for genuinely new items or processes.
- Limit each PR to 5–10 upgraded quests with coherent item and process flows.
- Keep dialogue playful, clear, and concise; every node should either gate progress or advance a
  specific action.

## Bare-quest signals to fix
- Dialogue is a single hop or lacks branching; `finish` reachable without prior gating.
- Options hand out rewards (`grantsItems`) instead of routing through processes that create them.
- Missing or mismatched `requiresItems` compared to what earlier processes create/consume.
- No intermediate items where assembly should have staged outputs (parts → subassembly → final).
- Missing, empty, or schema-breaking `hardening` blocks.
- Quests or items with images but no manifest JSON alongside similar assets.

## Upgrade recipe
- Add processes that **require** tools/materials, **consume** inputs, and **create** intermediates;
  the final process should **create** the finished item instead of finishing via a free grant.
- Gate dialogue with `requiresItems` so steps unlock only after prior work; avoid dead ends and keep
  at least one alternate path or branch where it makes sense.
- Reconcile item flows: if a step needs something, ensure an earlier process or reward makes it
  exist; avoid reusing unrelated items when a new intermediate is warranted.
- Keep NPC tone consistent with `frontend/src/pages/docs/md/npcs.md` and write clear, actionable
  lines under 2–3 sentences per node.

## Hardening (quests + processes)
- Every quest and process must include `hardening` matching
  `frontend/src/pages/sharedSchemas/hardening.json`.
- Enforce: `passes === history.length`; `score` is an int 0–100 and at least the evaluator output;
  `emoji` matches thresholds (0 → 🛠️, ≥1 & score ≥ 60 → 🌀, ≥2 & score ≥ 75 → ✅, ≥3 & score ≥ 90 →
  💯); history entries have task/date/score.
- After edits: run `npm run hardening:fix` to normalize, then `npm run hardening:validate`
  to confirm quests/processes and schemas stay aligned.

## Images and manifests (no binary assets)
- Do **not** add `.jpg/.png/.webp` binaries. Add **only** manifest JSON alongside existing files.
- Inventory items: `frontend/public/assets/<name>.json` with `filename` prefixed `/assets/...`
  and `entity` pointing to the correct items file (e.g.,
  `frontend/src/pages/inventory/json/items/*.json`).
- Quest art: `frontend/public/assets/quests/<name>.json` with `filename` prefixed
  `/assets/quests/...` and `entity` pointing to the quest file.
- Schema fields: `filename`, `entity`, `entity_type` (`item` or `quest`), `item_name`, `item_id`
  (UUID for items; quest id for quests), `prompt`, `image_model` (`Nano Banana Pro` or
  `Z-Image Turbo` per existing assets), `resolution` (`512x512`). Preserve optional generator knobs
  (e.g., `steps`, `cfg`) already present in nearby manifests.
- Reuse existing filenames when updating prompts; keep descriptions accurate to the referenced item
  or quest and avoid faces/logos/readable text.

## Generated and supporting files
- Do not hand-edit files under `frontend/src/generated/*`; rerun the owning script if a quest change
  requires regeneration.
- After adding/removing quests, run `npm run new-quests:update` to refresh counts/docs and commit
  the generated outputs it produces.
- Validate links if you touch markdown (`npm run link-check`).
- Prefer running `npm run test:ci` or, at minimum, `npm run hardening:validate` before committing.

## PR-ready output
- List which quests were upgraded and summarize new/changed processes, items, and image manifests
  (no binary images added).
- Note every command you ran and its result so reviewers can mirror the checks.
```
