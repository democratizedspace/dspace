---
title: 'Content Development Guide'
slug: 'content-development'
---

# DSPACE Content Development Guide

This is the canonical in-game guide for building v3 custom content.

## v3 content model (three coupled systems)

DSPACE custom content has three first-class types:

1. **Quests** (branching progression, gates, rewards)
2. **Items** (resources/tools/currencies)
3. **Processes** (timed transformations with requires/consumes/creates)

For non-trivial contributions, treat these as a coupled system and ship them together.

## Authoring and management routes

### Create

- Quests: `/quests/create`
- Items: `/inventory/create`
- Processes: `/processes/create`

### Manage

- Quests: `/quests/manage`
- Items: `/inventory/manage`
- Processes: `/processes/manage`

Built-in content is read-only. Custom content is editable/removable.

## What changed in v3

- Full in-game editors for all three content types
- Schema-aware validation and richer dependency checks
- Bundle export/import via `/contentbackup`
- PR-oriented submission workflow via `/quests/submit` and docs guidance

## Validation expectations

Before exporting or submitting:

- Validate route links and quest IDs/dependencies
- Ensure quest options reference real items/processes
- Ensure docs are updated for every changed quest tree
- Verify import/export round-trip on a clean profile

Recommended commands from repo root:

```bash
npm run lint
npm run type-check
npm run build
npm run test:ci
node scripts/link-check.mjs
for f in frontend/src/pages/quests/json/*/*.json; do node scripts/validate-quest.js "$f" || exit 1; done
```

## Bundle workflow

1. Create/edit content in-game.
2. Export with `/contentbackup`.
3. Re-import on a clean profile to verify deterministic behavior.
4. Submit via `/bundles/submit` or repo PR workflow.

Read [Custom Content Bundles](/docs/custom-bundles) and
[Quest Submission Guide](/docs/quest-submission) for format + review expectations.

## Coupled docs contract (required)

When quest JSON changes:

- Update matching tree docs in `frontend/src/pages/docs/md/<tree>.md` in the same PR.
- Do not claim grants in docs unless they actually exist in quest JSON.
- Document branch prerequisites honestly (no fake linear paths).

## Practical quality checklist

- [ ] Every quest has start, middle, completion flow and finish option.
- [ ] Every quest references at least one item or process.
- [ ] Process durations and item counts are valid.
- [ ] Docs and quest trees are synchronized.
- [ ] Backup bundle imports cleanly.

## Related docs

- [Quest Guidelines](/docs/quest-guidelines)
- [Quest Schema](/docs/quest-schema)
- [Quest Template](/docs/quest-template)
- [Quest Contribution Guide](/docs/quest-contribution)
- [Item Guidelines](/docs/item-guidelines)
- [Process Guidelines](/docs/process-guidelines)
