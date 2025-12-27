# Quest polish prompts for DSPACE

Use these prompts to turn thin quests into shippable flows, triage overlapping polish PRs, and keep
the playbook current when schemas or guardrails change.

## Quest polish prompt
Use this when you need to transform bare or placeholder quests into shippable, gated adventures that
match shipped exemplars.

```markdown
# DSPACE quest quality lift (bare → shippable)

You are Codex working in the democratizedspace/dspace repository (v3). Identify thin or
placeholder quests and rebuild them into paced, gated adventures that match our best shipped
examples.

## Do / Don't
- Do keep gating coherent so `finish` stays locked behind processes and `requiresItems`.
- Do make the final item come from a process (not a `finish` grant); reuse intermediates sensibly.
- Do keep `hardening` present and valid; never invent schema fields.
- Do add manifests only (no binaries) and mirror nearby manifest keys and ordering.
- Don't churn IDs or add noise—minimize diff surface while fixing flows.
- Do run and record all validations/regens you touch.

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
- `frontend/src/pages/quests/json/rocketry/guided-rocket-build.json` — tight pacing that chains
  fincan/avionics/camera sled builds, enforces `requiresItems`, and delivers hardware via processes.
- `frontend/src/pages/quests/json/chemistry/acid-neutralization.json` — safety-first PPE and
  neutralizer gates with clear hazard resolution before declaring the area safe.
- `frontend/src/pages/quests/json/firstaid/change-bandage.json` — concise care loop with
  consumables, PPE, and a finish gate tied to a cleaned/covered wound state.
Refresh this list when better shipped quests land; prefer exemplars that already pass all
validations below.

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

## Source-of-truth: schemas + scripts
- Hardening: use `frontend/src/pages/sharedSchemas/hardening.json` and keep quest/process schemas in
  sync with `frontend/src/pages/quests/jsonSchemas/quest.json` and
  `frontend/src/pages/processes/process.schema.json`.
- Image manifests: locate the live JSON schema or contract for quest/item image manifests in-repo
  and follow it exactly (no new keys). If the location is unclear, search the repo for
  `hardening.json` and any “image manifest” schema reference or nearest equivalent; cite the paths
  you align to in the PR summary.
- When schema locations change, update this prompt and your PR summary with the new paths.

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
- Before creating/updating a manifest, open 1–2 nearby manifests and match their exact key set and
  ordering; include optional knobs (e.g., `steps`, `cfg`, `seed`) only if already present nearby.
- Inventory items: `frontend/public/assets/<name>.json` with `filename` prefixed `/assets/...` and
  `entity` pointing to the correct items file (e.g.,
  `frontend/src/pages/inventory/json/items/*.json`); `item_id` must be the item UUID.
- Quest art: `frontend/public/assets/quests/<name>.json` with `filename` prefixed
  `/assets/quests/...` and `entity` pointing to the quest JSON; `item_id` must be the quest `id`.
- `entity` must always reference the canonical source JSON (quest file or inventory registry), never
  a generated output. Keep descriptions accurate to the referenced item or quest and avoid
  faces/logos/readable text.

## Generated files + required checks (derive from repo, don’t guess)
- Do not hand-edit files under `frontend/src/generated/*`; rerun the owning script if a quest change
  requires regeneration. After adding/removing quests, run `npm run new-quests:update` to refresh
  counts/docs and commit its outputs.
- Inspect `package.json` and `.github/workflows/*` for the exact commands CI expects for
  quest/content changes, then list and run them. As of this revision, required checks include:
  - `pnpm run coverage`
  - `pnpm run check`
  - `pnpm run test:root -- --testTimeout=20000`
  - `pnpm --dir frontend run build`
  - `pnpm --dir frontend run setup-test-env`
  - `pnpm --dir frontend exec playwright install --with-deps chromium chromium-headless-shell
    firefox webkit`
  - `npx playwright test --shard=1/2` and `npx playwright test --shard=2/2` (run from `frontend/`)
- Validate links if you touch markdown (`npm run link-check`). Record every command you ran with its
  result in the PR summary.

## PR-ready output
- List which quests were upgraded and summarize new/changed processes, items, and image manifests
  (no binary images added).
- Note every command you ran and its result so reviewers can mirror the checks.
```

## Merge compatibility prompt
Use this when multiple quest-polish PRs land at once and you need to surface overlaps or likely
conflicts before merging.

```markdown
I have multiple candidate PRs that came out of a Codex task (`docs/prompts/codex/quests-polish.md`),
and I want to know which ones can be merged together safely (minimal merge conflicts, no duplicated
edits).

Here are the PRs:
- <PR URL 1>
- <PR URL 2>
- <PR URL 3>
- <PR URL 4>

Please use your GitHub connector to inspect each PR.

What I need:
- For each PR, summarize what it changes at a high level
  (quests/processes/items/generated/assets/docs).
- List the files changed in each PR (grouped by category if helpful).
- Compute overlaps between PRs:
  - exact file-path overlaps (same file touched by multiple PRs)
  - obvious content overlaps even if file paths differ (e.g., same quest/process IDs being edited in
    different files)
- Call out overlaps that are likely to cause merge conflicts or redundant work (especially shared
  registries like `items/*.json`, shared process registries like `processes/base.json`, and
  `frontend/src/generated/*`).
- Recommend the set(s) of PRs that can be merged together with minimal to no conflicts. If any
  conflicts are likely, say which file(s) they’ll be in.
- For PR pairs that are not safe to merge as-is, briefly explain why.

Output format:
- A short “safe to merge together” list (pairs or groups)
- A short “not safe without manual reconciliation” list, with the overlap called out
- A compact overlap matrix or pairwise overlap summary (file paths are enough)
```

## Upgrade prompt
Use this when the quest polish prompt drifts, new guardrails land, or the merge-compatibility
guidance needs refreshing.

```markdown
# Upgrade the quest polish prompt

You are Codex reviewing `docs/prompts/codex/quests-polish.md`. Improve the quest polish prompt and
its companion merge-compatibility guidance so they stay copy-paste ready, evergreen, and precise.

## Instructions
- Audit each section for clarity, duplication, and alignment with current repository realities.
- Preserve the quest polish mission, upgrade recipe, validation steps, and merge-compatibility
  guardrails while tightening language.
- Add or update guardrails based on recent schema, hardening, manifest, or CI changes.
- Verify all referenced paths and commands remain accurate for the current repository layout.
- Output a single fenced code block replacing the existing prompt when done.
```
