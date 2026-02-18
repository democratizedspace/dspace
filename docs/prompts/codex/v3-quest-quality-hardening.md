# v3 quest quality hardening prompts

Use these prompts to harden quest content tied to still-unchecked entries in
`docs/qa/v3.md` §4.5, using the deterministic backlog in
`docs/design/v3-quest-quality-review.md`.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (unchecked §4.5 backlog → manual flip-ready)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3–8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them so they are ready
for a human to manually verify and flip from unchecked to checked in `docs/qa/v3.md` §4.5.

## Selection and determinism rules (required)

1. Only select quests that are currently unchecked in `docs/qa/v3.md` §4.5.
2. Prefer one tree per pass unless a mixed pass is explicitly justified.
3. For each selected tree, copy and use only the quest IDs listed on that tree's
   `Exemplar anchors (checked in docs/qa/v3.md §4.5)` line.
4. Determine rubric type from the problematic checklist text using **first-match wins** keyword
   classification. Apply only the first matching type for each quest.
5. Do not invent new rubric types. Use the tree checklist language as canonical.

## Rubric type classification (first-match wins)

Classify each quest by scanning its checklist bullets in order and taking the first match:

1. `install/verify/rollback` if checklist includes install/config/verify/rollback semantics.
2. `measurement/threshold/retest` if checklist includes measured values, bounds, interpretation, or
   out-of-range corrective loops.
3. `logging/monitoring/anomaly` if checklist includes required logs, cadence, monitoring snapshots,
   anomaly handling, or follow-up windows.
4. `lifecycle/staged-evidence` if checklist includes staged setup/outcome artifacts or lifecycle
   proof sequencing.
5. `cleanup/pre-post-proof` if checklist includes pre/post proof of state change for maintenance,
   cleaning, or restoration tasks.
6. `generic-branching-hardening` for remaining entries that call for non-linear flow + evidence
   gates + troubleshooting loops.

## Quality bar for each selected quest (must satisfy)

- Remove thin-shell flow (`start -> one step -> finish`) unless explicitly justified in quest text.
- Add at least one mechanics-backed evidence gate (`requiresItems`, `launchesProcess`, measurement
  artifact, log artifact, or equivalent).
- Add at least one troubleshooting/recovery branch with a retry or rollback checkpoint.
- Add safety/operational checks where domain-relevant.
- Keep tone and character voice aligned with `frontend/src/pages/docs/md/npcs.md`.

## Implementation requirements

- Edit quest JSON under `frontend/src/pages/quests/json/<tree>/<quest>.json`.
- Keep quest IDs stable unless correcting a proven canonical mismatch.
- If flow changes materially, update paired docs in `frontend/src/pages/docs/md/<tree>.md`.
- Do not create or edit binary image assets.
- If quality hardening requires a new item/quest image, reuse an existing in-repo image reference
  and note that a human will deduplicate/replace images later.
- Ensure requirements, rewards, and process references resolve to valid item/process/quest IDs.

## Validation commands (required)

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm run test:ci`
5. `npm run link-check` (run when docs/markdown changed)
6. `for f in frontend/src/pages/quests/json/<tree>/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`

## REQUIRED output format for your PR summary

Output exactly these sections in order:

1. `Selected quests`
   - Bullet list of selected quest IDs (each must currently be unchecked in `docs/qa/v3.md` §4.5).
2. `Exemplar anchors used`
   - Bullet list mapping each quest to anchor ID(s), copied from that tree's anchor line.
3. `Rubric type assignment (first-match wins)`
   - Bullet list: quest ID → rubric type + matched checklist phrase.
4. `Before/after structural summary`
   - Per quest: branches added, evidence gates added, troubleshooting/safety paths added.
5. `Manual checkbox flip candidates`
   - Bullet list of quest IDs judged ready for human manual verification in `docs/qa/v3.md` §4.5.
6. `Tests and checks run`
   - Bullet list of commands and pass/fail status.
7. `Follow-ups`
   - Deferred work or explicit `None`.
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
- Keep the prompt focused on hardening quests that are still unchecked in `docs/qa/v3.md` §4.5.
- Preserve the binary-asset limitation: no new binary files; reuse existing image references when
  needed and note human follow-up for dedup/replacement.

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- Determinism source of truth: `docs/design/v3-quest-quality-review.md` anchor lines and checklist
  bullets.
- Human is responsible for final manual verification and checkbox flips in `docs/qa/v3.md` §4.5.
