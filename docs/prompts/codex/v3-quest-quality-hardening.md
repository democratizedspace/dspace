# v3 quest quality hardening prompts

Use these copy/paste prompts to harden unchecked quest rows in `docs/qa/v3.md` §4.5 using the
prioritized backlog in `docs/design/v3-quest-quality-review.md`.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (unchecked QA rows → parity)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3–8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them so they are
ready for a human to manually verify and check in `docs/qa/v3.md` §4.5.

## Deterministic source rules (required)

1. Treat `docs/design/v3-quest-quality-review.md` as the task selector and rubric source.
2. For each quest tree, use only quest IDs listed on that tree's
   `Exemplar anchors (checked in docs/qa/v3.md §4.5)` line.
3. Determine rubric type by checklist keyword with **first-match wins**. Use this fixed order:
   - `measurement/check`
   - `logging/monitoring`
   - `install/config/validate`
   - `calibration/tolerance`
   - `before/after cleaning cycle`
   - `lifecycle/staged outcome`
   - fallback: `thin-shell branching + evidence`
4. Apply only the matched rubric's structure; do not blend multiple rubric templates unless the
   checklist text explicitly requires it.

## Quality bar per quest (must satisfy)

- Replace thin-shell progression (`start -> one step -> finish`) unless explicitly justified.
- Add at least one mechanics-backed evidence gate (`requiresItems`, `launchesProcess`,
  measurement/log artifact, or equivalent).
- Add at least one troubleshooting/recovery branch with retry before `finish`.
- Add safety or operational checks when domain-relevant.
- Keep voice aligned with `frontend/src/pages/docs/md/npcs.md`.

## Implementation requirements

- Edit quests in `frontend/src/pages/quests/json/<tree>/<quest>.json`.
- Keep quest IDs stable unless correcting a proven canonical mismatch.
- If quest flow changes materially, update matching docs in
  `frontend/src/pages/docs/md/<tree>.md` in the same PR.
- Codex cannot create/edit binary image assets: if new items/quests need images, reuse existing
  in-repo image references and document follow-up dedup/replacement work.
- Ensure all quest requirements, rewards, item IDs, and process IDs resolve to valid IDs.

## Validation commands (required)

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm run test:ci`
5. `npm run link-check` (run when docs/markdown changed)
6. `for f in frontend/src/pages/quests/json/<tree>/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`

## REQUIRED output format

Output exactly these sections in this exact order:

1. `Selected quests`
   - Bullet list of selected quest IDs.
2. `Unchecked QA rows targeted`
   - Bullet list mapping each selected quest ID to its row in `docs/qa/v3.md` §4.5.
3. `Exemplar anchors used`
   - Bullet list mapping each selected quest to anchor ID(s) copied from the tree anchor line.
4. `Rubric type assignment (first-match)`
   - Bullet list mapping each selected quest to its matched rubric type and matched keyword.
5. `Before/after structural summary`
   - Per quest: branches, evidence gates, troubleshooting/safety additions.
6. `Tests and checks run`
   - Bullet list of commands with pass/fail status.
7. `Manual verification follow-ups`
   - List any remaining human verification needed before checking boxes in `docs/qa/v3.md`, or
     explicit `None`.
```

## Upgrade prompt

```markdown
# Upgrade the v3 quest quality hardening prompt

You are updating `docs/prompts/codex/v3-quest-quality-hardening.md`.

Goals:

- Keep the prompt copy/paste-ready.
- Keep all referenced paths and commands valid for this repository.
- Preserve deterministic rules: verified exemplar anchors, rubric type first-match behavior, and
  required output format.
- Keep the prompt optimized for hardening still-unchecked quest rows in `docs/qa/v3.md` §4.5.
- Preserve the Codex binary-asset limitation guidance (reuse existing image references; note
  human follow-up for dedup/replacement).

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- `docs/qa/v3.md` checkboxes remain human-verified; this prompt prepares high-quality candidates.
- If repository scripts or paths change, update this file immediately so automation stays
  deterministic.
