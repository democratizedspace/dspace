# Quest polish prompt for v3 backlog

Use this when turning bare or low-fidelity quests into shippable, realistic experiences.
Keep IDs stable and scope each PR to a small batch of quests.

## Gold-standard references (v2.1 and earlier)
Ground your rewrites in older, well-structured quests instead of the early 3D-printing grinds.
Open these files at the referenced commit to study pacing, gating, humor, and item flows:

- `d956e807d49114da2d0ff28aacef91341813bf82` →
  `frontend/src/pages/quests/json/hydroponics/basil.json`
  - Slow-burn timeline (germination → transfer → lighting → harvest → regrow) with realistic wait
    steps, consumables, and intermediate outputs.
  - NPC voice mixes humor with instruction while item gating enforces each sub-task.
- `d956e807d49114da2d0ff28aacef91341813bf82` →
  `frontend/src/pages/quests/json/rocketry/firstlaunch.json`
  - Clear component printing, assembly, and launch phases with distinct processes and required
    items.
  - Uses parallelizable print steps, staged grants, and a finale that consumes the built rocket.
- `d956e807d49114da2d0ff28aacef91341813bf82` →
  `frontend/src/pages/quests/json/rocketry/parachute.json`
  - Follow-on upgrade quest that layers safety improvements; good model for iterative gating.
  - Additional processes (assemble parachute, launch with chute) plus multi-item prerequisites and
    rewards.
- `d956e807d49114da2d0ff28aacef91341813bf82` →
  `frontend/src/pages/quests/json/aquaria/goldfish.json`
  - Stepwise setup (prepare tank → add fish → feed) with processes that mirror real aquarium care.
  - Requires intermediate items before progression; rewards and humor stay on-theme.
- `d956e807d49114da2d0ff28aacef91341813bf82` →
  `frontend/src/pages/quests/json/energy/solar.json`
  - Hands-on build with staged material grants, enclosure assembly, and charging process before
    payout.
  - Maintains coherent requires/creates links between items, processes, and dialogue checkpoints.

## Copy-ready prompt
```markdown
You are Codex working in the democratizedspace/dspace repository. Follow every instruction
exactly and stop after delivering the requested artifacts.

## Mission
Find bare v3 quests and upgrade them into high-quality, realistic multi-step journeys without
breaking IDs or adding gratuitous churn.

## Candidate discovery (pick 5–10 quests per PR)
- Scan quests that lack meaningful branching or have only 1–2 dialogue nodes.
- Flag quests whose `process` steps are missing, trivial, or do not consume/produce the right
  items.
- Look for rewards granted without work, or options that jump to finish without item gating.
- Catch gating mismatches (requires items never created, processes that create items never
  required).
- Identify missing/placeholder imagery for new intermediate items.
- Prioritize stale branches that gate later content or feel grindy compared to the gold-standard
  refs.

## Upgrade recipe
1) Preserve quest IDs; only add intermediate items or processes where necessary.
2) Thread a realistic sequence of processes:
   - Require tools/materials, **consume** consumables, and **create** intermediate items when useful
     (panels → enclosure → finished device).
   - End with the finished item produced by the final process (avoid raw `grantsItems` finales).
   - Gate dialogue on having the right intermediate items before advancing.
3) Keep rewards coherent (materials, currency, or unlocks that match the effort and theme).
4) Refresh dialogue for clarity, humor, and NPC voice; retain existing lore hooks.

## Images (NO BINARY FILES)
- Do **not** add `.jpg/.png/.webp` binaries. Use image manifest JSON files under
  `frontend/public/assets/` (or nested `/assets/quests/`) that match existing schema. Study current
  manifests such as `frontend/public/assets/freshwater_aquarium_150l_ph7.json` before writing new
    ones.
- Schema sketch (match the real files exactly):
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

## Generated files and validation
- Discover whether `frontend/src/generated/*` content should be regenerated via scripts instead of
  manual edits; prefer running the repo’s generation commands when touching derived JSON.
- Validate quest JSON parses cleanly; format with Prettier if needed.
- Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` when changes
  touch code or quests; for doc-only edits, explain why tests were skipped.
- Scan staged changes for secrets: `git diff --cached | ./scripts/scan-secrets.py`.

## Output for your PR
- List the quests improved and summarize new/changed processes, items, and manifests.
- Call out any new intermediate items and the processes that consume/create them.
- Include the commands you ran and their results.
- Keep the diff tight: 5–10 quests per PR with coherent gating and item flows.
```

## Upgrade prompt
```markdown
You are Codex reviewing `docs/prompts/codex/quests-polish.md`. Tighten heuristics, update
references, and keep the copy-ready block aligned with current repo practices (tests, generation
commands, image manifest schema). Output a single fenced code block with the refreshed prompt.
```
