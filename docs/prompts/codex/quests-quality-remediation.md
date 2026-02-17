# Quest quality remediation prompts for DSPACE v3

Use these prompts when you want Codex to pull quests from
`docs/design/v3-quest-quality-review.md#problematic-quests-to-prioritize-with-improvement-checklist`
and bring them up to parity with the manually checked quest quality baseline in `docs/qa/v3.md`.

## Quest quality remediation prompt

Use this to select a small batch of problematic v3 quests and implement robust, test-backed fixes.

```markdown
# DSPACE v3 quest quality remediation (problematic backlog → parity)

You are Codex working in `democratizedspace/dspace` on branch `v3`.
Your goal is to improve quest quality by upgrading quests listed under:
`docs/design/v3-quest-quality-review.md#problematic-quests-to-prioritize-with-improvement-checklist`.

## Source-of-truth references
- Problematic backlog: `docs/design/v3-quest-quality-review.md`
- QA-validated exemplars and checked quest IDs: `docs/qa/v3.md` section 4.5
- Quest schema: `frontend/src/pages/quests/jsonSchemas/quest.json`
- NPC tone guide: `frontend/src/pages/docs/md/npcs.md`
- Coupled docs contract: `frontend/src/pages/docs/md/<tree>.md` for each touched quest tree

## Required workflow
1. Pick **3–8 unchecked problematic quests** from one or two trees.
2. For each selected quest, compare against checked exemplars in the same or adjacent domain.
3. Implement parity improvements with minimal ID churn:
   - Add meaningful branching and at least one troubleshooting/recovery path.
   - Add mechanics-backed evidence gates (`requiresItems`, `requiresQuests`, `launchesProcess`).
   - Ensure completion depends on validated intermediate work, not a one-click finish.
   - Improve lore voice and instructional clarity while staying grounded in DSPACE systems.
4. Update the corresponding tree Skills doc(s) under `frontend/src/pages/docs/md/` in the same PR.
5. Keep rewards/prereqs realistic and avoid invented grants.

## Structural quality bar (must satisfy)
- No thin-shell `start -> one step -> finish` flow unless explicitly justified as a micro-quest.
- At least one branch with distinct outcomes or handling paths.
- At least one process or item-proof checkpoint before final completion.
- Safety-critical domains (chemistry, first aid, devops, rocketry, electronics) must include explicit
  misuse/failure guidance.

## Testing and validation (run and report)
- `npm run lint`
- `npm run link-check`
- `for f in frontend/src/pages/quests/json/*/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`
- `npm run test:ci`
- Any focused tests you add or update for touched systems

## Output expectations
- Summarize which problematic quests were upgraded and why.
- Show how each quest now meets branch/evidence/troubleshooting parity.
- List every command run and whether it passed.
- Keep the PR focused on this remediation batch only.
```

## Upgrade prompt

Use this when the remediation prompt drifts from current schema, QA flows, or quality bar rules.

```markdown
# Upgrade the DSPACE quest quality remediation prompt

You are Codex reviewing `docs/prompts/codex/quests-quality-remediation.md`.
Refresh this prompt so it stays copy/paste ready and aligned with current DSPACE v3 quest QA reality.

## Instructions
1. Verify all referenced files, anchors, and commands still exist.
2. Align requirements with current `AGENTS.md`, quest/docs coupling rules, and QA section 4.5 in
   `docs/qa/v3.md`.
3. Tighten quality gates for branching, mechanics-backed evidence, troubleshooting, and lore tone.
4. Keep instructions specific enough for robust structural fixes and testing.
5. Ensure the remediation prompt still scopes work to small quest batches (3–8) for reviewability.
6. Output updated markdown ready to replace this file.
```
