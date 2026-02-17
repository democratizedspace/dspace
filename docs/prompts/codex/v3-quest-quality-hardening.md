# v3 quest quality hardening prompts

Use these prompts to pick problematic quests from
`docs/design/v3-quest-quality-review.md#problematic-quests-to-prioritize-with-improvement-checklist`
and upgrade them to parity with QA-validated quest quality in `docs/qa/v3.md`.

## Main prompt

Use this when you want Codex to select one or more problematic v3 quests and implement robust,
lore-friendly fixes with structural depth and validation.

## Backlog selection strategy

When selecting quests from the backlog, prefer one tree per pass and include a mix of quest
types so the rubric is exercised broadly (for example: one install/setup quest, one
measure/test quest, and one log/monitor quest).

```markdown
# DSPACE v3 quest quality hardening (problematic backlog → parity)

You are Codex working in `democratizedspace/dspace` (branch: v3).

## Objective

Pick 3–8 quests from:

- `docs/design/v3-quest-quality-review.md`
  - section: **Problematic quests to prioritize (with improvement checklist)**

Upgrade those quests so they match the quality bar demonstrated by checked quests in:

- `docs/qa/v3.md` §4.5 (checked entries)

## Quality bar (must satisfy)

For each selected quest:

1. Eliminate thin-shell structure (`start -> one step -> finish`).
2. Add at least one mechanics-backed proof gate (`process`, `requiresItems`, telemetry/log item).
3. Add at least one troubleshooting/recovery branch.
4. Add realistic safety/operational checks where domain-relevant.
5. Keep lore voice consistent with `frontend/src/pages/docs/md/npcs.md`.

## Implementation requirements

- Edit quest JSON under `frontend/src/pages/quests/json/<tree>/<quest>.json`.
- Keep quest IDs stable unless a hard canonical mismatch requires correction.
- If you change quest flow materially, update paired docs in
  `frontend/src/pages/docs/md/<tree>.md`.
- Do not add new binary image assets; reuse existing references when needed.
- Ensure rewards, requirements, and process references all resolve to valid IDs.
- Prefer structural fixes (branching, gating, verification loops) over cosmetic rewrites.

## Testing and validation (required)

Run and fix failures for:

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm run test:ci` (do not pass additional selector arguments)
5. `npm run link-check` (if markdown/docs changed)
6. Bulk quest schema validation for changed trees:
   `for f in frontend/src/pages/quests/json/<tree>/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`

## PR expectations

In the PR summary include:

- Selected problematic quest IDs and why they were chosen.
- For each quest: before/after structural changes (new branches, gates, artifacts, safety checks).
- Which checked quest(s) from `docs/qa/v3.md` inspired parity.
- Test commands run and results.
- Any follow-up work intentionally deferred.
```

## Upgrade prompt

Use this when the hardening prompt itself needs to be refreshed for new schemas, tests, or quest
quality guidance.

```markdown
# Upgrade the v3 quest quality hardening prompt

You are Codex reviewing `docs/prompts/codex/v3-quest-quality-hardening.md`.

Improve the prompt so it stays copy/paste ready, up to date with repository tooling, and aligned
with current quest quality policy.

## Instructions

- Verify all referenced paths and commands still exist.
- Keep the focus on selecting from the problematic quest backlog and lifting quests to parity with
  QA-validated exemplars.
- Tighten requirements around structural quest improvements, lore consistency, and robust testing.
- Ensure the prompt explicitly requires evidence-backed gating and troubleshooting branches.
- Keep output concise and reusable for both humans and agents.

Output a single fenced code block containing the fully updated prompt document.
```
