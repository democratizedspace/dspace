# v3 quest parity prompts for DSPACE

Use this guide when you want Codex to take quests from
`docs/design/v3-quest-quality-review.md#problematic-quests-to-prioritize-with-improvement-checklist`
and upgrade them to parity with the manually validated exemplars in `docs/qa/v3.md`.

## Main prompt

```markdown
# DSPACE v3 quest parity hardening pass

You are Codex working in `democratizedspace/dspace` (branch `v3`).

## Goal
Pick a focused batch of problematic quests from
`docs/design/v3-quest-quality-review.md#problematic-quests-to-prioritize-with-improvement-checklist`
and upgrade them to quality parity with the checked quests listed in `docs/qa/v3.md` §4.5.

## Ground truth and references
- Problem backlog: `docs/design/v3-quest-quality-review.md`.
- QA-validated exemplars: checked quests in `docs/qa/v3.md` §4.5, especially:
  - `composting/start`
  - `hydroponics/nutrient-check`
  - `sysadmin/basic-commands`
  - `welcome/run-tests`
- Quest JSON source: `frontend/src/pages/quests/json/<tree>/<quest>.json`.
- Coupled docs: `frontend/src/pages/docs/md/<tree>.md`.
- NPC tone reference: `frontend/src/pages/docs/md/npcs.md`.

## Scope
- Upgrade 5-10 quests in one tree (or one tightly related set).
- Keep quest IDs stable unless rename is required for canonical consistency.
- Keep changes minimally invasive outside the selected batch.

## Required parity upgrades per quest
1. Add interaction depth (avoid thin `start -> middle -> finish` shells).
2. Add at least one troubleshooting/recovery branch.
3. Add at least one mechanics-backed evidence step (process output and/or gated proof).
4. Ensure gating is explicit (`requiresItems`, `requiresQuests`, or both) before completion.
5. Make rewards proportionate and domain-specific; avoid generic trophy spam.
6. Keep lore voice aligned with tree docs and NPC style.

## Quest ↔ docs contract (required)
For every edited quest JSON, update the corresponding tree skills doc in
`frontend/src/pages/docs/md/<tree>.md` in the same PR:
- Update gates, grants, reward flow, process IO, and QA walkthrough notes.
- Do not claim grants that do not exist in quest JSON.
- If prerequisites branch, document branch structure explicitly.

## Structural and quality checks
Run and report all relevant checks:
- `npm run lint`
- `npm run link-check`
- `npm run type-check`
- `npm run build`
- Bulk quest validation:
  `for f in frontend/src/pages/quests/json/*/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`
- Targeted tests impacted by your changes (add/update tests where useful).

If available, also run:
- `npm run test:ci`
- `npm run coverage`

## Output
Create a PR-ready patch that includes:
- Upgraded quests with richer structure and robust gates.
- Matching docs updates for each touched tree.
- Test additions/updates proving the new behavior.
- A summary table of upgraded quests and which parity requirements were addressed.
```

## Upgrade prompt

```markdown
# Upgrade the v3 quest parity prompt

You are Codex reviewing `docs/prompts/codex/v3-quest-parity.md`.
Refresh the prompt so it stays copy/paste ready and aligned with current DSPACE workflows.

## Instructions
1. Verify referenced files/sections/commands still exist and are accurate.
2. Tighten wording to minimize ambiguity for autonomous runs.
3. Preserve the quest↔docs coupling requirements and anti-thin-shell guardrails.
4. Ensure the prompt still enforces robust testing and quality evidence.
5. Add missing safeguards discovered from recent v3 quest QA incidents.
6. Return a single updated fenced code block for the main prompt, plus a refreshed upgrade prompt.
```
