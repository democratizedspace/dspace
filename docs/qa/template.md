# DSPACE Release QA Checklist (Template)

> Copy this file for each release (`vX.Y`, `vX.Y.Z`) and fill in the details.

## Release metadata

- [ ] Release version/tag: `vX.Y.Z`
- [ ] RC commit SHA: `__________`
- [ ] Staging URL: `https://staging.example.com`
- [ ] Production URL: `https://example.com`
- [ ] Stop-ship criteria defined and agreed

## Quick command index

List the exact local commands for automation. Example:

- `npm run qa:smoke` – lint/format check, type-check, root CI-parity suite (SKIP_E2E), and docs
  link check.
- `npm run test:e2e:groups` – optimized Playwright groups from `frontend/`.
- `npm run link-check` – docs/internal link validation.

## Automation

- [ ] Lint
- [ ] Type-check
- [ ] Unit + integration tests
- [ ] E2E (grouped) tests
- [ ] Link check
- [ ] Data validation (quests/processes/items)
- [ ] Image analysis (duplicates/missing)

## Route smoke (top navigation + utilities)

List the critical routes to visit (home, quests, inventory, docs, chat, toolbox, etc.).

## Core systems

- Quests: onboarding flow, dependency graph, rewards sanity, narrative quality
- Processes: lifecycle (start/cancel/collect), UI integrity, timing expectations
- Items/Inventory: rendering, metadata, broken/duplicated images

## Custom content

- Custom items: create/edit/delete with image upload
- Custom processes: create, validate, run, cancel, collect
- Custom quests: editor UX, validation, dependencies, rewards, submission flow
- Exports/imports: gamesave vs custom-content-only

## Docs and changelog

- Docs index loads, links work, and content matches reality
- Changelog entry matches release version/date and highlights

## Deploy smoke

- Staging cut: deploy RC, run smoke, confirm logs/monitoring
- Production cut: deploy, run smoke (nav, quest, process, custom item, chat), monitor post-release
- Post-deploy: tag + release notes, triage remaining issues
