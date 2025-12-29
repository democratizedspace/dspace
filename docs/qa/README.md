# DSPACE QA Checklists

Release QA checklists live here. Each release copies the template, adds a “Quick command index”
near the top, and tracks both automation and manual gates.

## Current checklists

- [DSPACE v3 QA checklist](./v3.md) — release candidate → production
- [DSPACE v3.1 QA checklist](./v3.1.md) — token.place integration + re-run v3 suite

## How to use this folder

1. Copy an existing checklist (for example `v3.md`) for each release (`v3.0.1`, `v3.1`, etc.).
2. Keep a “Quick command index” near the top with the exact scripts used for automation.
3. Update links to staging/prod endpoints as needed for the release.
4. Keep automation commands aligned with `package.json` scripts; do not invent new ones unless they
   already exist elsewhere in the repo.

## Template

Start new releases from the [QA checklist template](./template.md) and fill in
release-specific details.
