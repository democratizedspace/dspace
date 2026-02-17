# V3 quest parity prompts for DSPACE

Use this guide when you want Codex to pick a problematic v3 quest from
`docs/design/v3-quest-quality-review.md` and upgrade it to match QA-validated
quality standards from `docs/qa/v3.md`.

## V3 quest parity implementation prompt

```text
You are Codex working in democratizedspace/dspace (branch v3).

GOAL:
Pick a small batch of problematic quests from
`docs/design/v3-quest-quality-review.md#problematic-quests-to-prioritize-with-improvement-checklist`
and bring them to parity with QA-validated v3 quest quality.

SOURCE-OF-TRUTH REFERENCES
- Quality backlog: `docs/design/v3-quest-quality-review.md`
- QA-validated exemplars and release checks: `docs/qa/v3.md`
- New quest inventory: `docs/new-quests.md`
- Quest schema: `frontend/src/pages/quests/jsonSchemas/quest.json`
- Quest/docs coupling rules: `AGENTS.md` (Quest ↔ Docs 1:1 Contract)
- NPC tone: `frontend/src/pages/docs/md/npcs.md`

SELECTION RULES
1. Select 3-8 unchecked quests from one tree in the problematic backlog.
2. Prioritize quests with thin-shell structure, weak gating, or no troubleshooting loops.
3. Keep quest IDs stable unless there is a canonical naming bug to fix.

IMPLEMENTATION REQUIREMENTS
1. Add robust structure:
   - setup -> execution -> validation -> completion pacing
   - at least one meaningful branch (failure, fallback, or optimization)
   - at least one mechanics-backed evidence gate (`requiresItems`, process outputs, or logs)
2. Improve lore fidelity:
   - match tree domain language and constraints
   - keep dialogue concise, actionable, and consistent with `npcs.md`
3. Strengthen testability:
   - ensure every new gate is reachable in-graph
   - ensure reward/prerequisite logic is coherent
   - avoid introducing undocumented grants
4. Update paired Skills docs in `frontend/src/pages/docs/md/<tree>.md` in the same PR:
   - reflect branches, gates, grants, process IO, and QA walkthrough notes
   - do not claim grants not present in quest JSON
5. If quests are added/removed, run `npm run new-quests:update` and commit generated docs.

REQUIRED VALIDATION
- `npm run lint`
- `npm run link-check`
- `npm run type-check`
- `npm run build`
- Bulk quest validation:
  `for f in frontend/src/pages/quests/json/*/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`
- Any focused tests touched by your edits (unit/integration/e2e as relevant)

OUTPUT
- A single PR-sized change set with upgraded quests + coupled docs.
- PR summary must include:
  - selected quests and why they were prioritized
  - branch/gating/evidence improvements per quest
  - commands run with pass/fail status
```

## V3 quest parity upgrade prompt

```text
You are Codex maintaining `docs/prompts/codex/v3-quest-parity.md`.

Task:
Upgrade the parity prompt so it remains aligned with current DSPACE quest-quality
expectations, QA process, and validation commands.

Instructions:
1. Re-read these files first:
   - `AGENTS.md`
   - `docs/design/v3-quest-quality-review.md`
   - `docs/qa/v3.md`
   - `docs/prompts/codex/quests.md`
   - `docs/prompts/codex/quests-polish.md`
2. Refresh any stale paths, commands, or quality criteria.
3. Keep copy/paste usability: one main implementation prompt block + one upgrade prompt block.
4. Preserve requirements for:
   - robust structural quest changes
   - lore-friendly writing
   - paired quest/docs updates
   - explicit validation commands and test reporting
5. If this prompt doc is renamed or superseded, update cross-links in:
   - `docs/prompts/codex/baseline.md`
   - `frontend/src/pages/docs/md/prompts-codex.md`

Output:
A PR-ready markdown update that keeps this prompt evergreen and actionable.
```
