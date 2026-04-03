# Release QA Checklist (Template)

## Release metadata

Canonical release index: [docs/release-history.md](../release-history.md).

- [ ] Release name: `vX.Y[.Z]`
- [ ] Tag/commit:
- [ ] Staging URL:
- [ ] Prod URL:
- [ ] Stop-ship criteria agreed and documented

## Automation

- [ ] Quick command index updated (lint, type-check, schema checks, link checks, grouped tests)
- [ ] CI parity command passes locally
- [ ] Data validators (quests, processes, items) pass
- [ ] Image validation run and triaged
- [ ] Link checker passes (internal + external, as applicable)

## Route smoke

- [ ] Main navigation routes load without errors
- [ ] Secondary/utility routes load without errors
- [ ] External links open and point to the expected destinations

## Core systems

- [ ] Quests load, render, and complete (dependencies, rewards, gating)
- [ ] Processes start, pause/cancel, and complete with correct inventory deltas
- [ ] Inventory renders correctly with images, categories, and stats
- [ ] Achievements/titles/guilds (if applicable) behave as expected

## Custom content

- [ ] Custom item creation/edit/delete works with image upload + validation
- [ ] Custom process creation and execution works (requires/consumes/creates)
- [ ] Custom quest editor flow works (nodes/options, validation, preview/simulation)
- [ ] Import/export/backup flows work and protect custom data
- [ ] Cloud sync copies both saves and custom content safely

## Docs / changelog

- [ ] Docs nav loads; links and images work
- [ ] Docs content matches shipped features and providers
- [ ] Changelog entry matches the tag, date, and highlights

## Deploy smoke

- [ ] Staging smoke (nav + 1 quest + 1 process + chat + custom content) passes
- [ ] Prod smoke (same checklist) passes after deploy
- [ ] Post-deploy monitoring shows no new errors
