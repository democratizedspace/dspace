# Release QA template

> Copy this template for each release and fill in the details for the target version. Keep the
> quick commands at the top so the team can run automation fast.

---

## Quick command index

- [ ] `npm run qa:smoke` — lint + format check, type-check, root tests, content validation,
      link validation
- [ ] `npm test` — cross-platform suite (grouped Playwright E2E)  
      `SKIP_E2E=1 npm test` to skip Playwright locally
- [ ] `npm run link-check` — docs/internal route validation
- [ ] `npm run itemValidation` — built-in content schema validation
- [ ] `python -m scripts.image_issues find-image-issues` — image duplicates/missing assets sweep

---

## 0) Release metadata

- [ ] RC commit SHA: `__________`
- [ ] RC tag/version string: `vX.Y.Z`
- [ ] Staging URL verified: `https://__________`
- [ ] Prod URL verified: `https://__________`
- [ ] Stop-ship criteria agreed and documented

---

## 1) Automation

- [ ] CI is green for the release branch
- [ ] `npm run qa:smoke` passes locally
- [ ] Playwright suites green on release candidate (full or grouped)
- [ ] Docs/link checker green
- [ ] Content validation green (quests/processes/items)
- [ ] Image issues script run and triaged

---

## 2) Route smoke (top navigation + utilities)

- [ ] Home (`/`)
- [ ] Quests (`/quests`)
- [ ] Inventory (`/inventory`)
- [ ] Energy (`/energy`)
- [ ] Wallet (`/wallet`)
- [ ] Profile (`/profile`)
- [ ] Docs (`/docs`)
- [ ] Chat (`/chat`)
- [ ] Changelog (`/changelog`)
- [ ] Gamesaves (`/gamesaves`)
- [ ] Cloud Sync (`/cloudsync`)
- [ ] Content Backup (`/contentbackup`)
- [ ] Toolbox (`/toolbox`)
- [ ] Settings (`/settings`)

---

## 3) Core systems

- [ ] Quests: list, detail, dependencies, rewards, images
- [ ] Processes: create/start/cancel/collect, requirements, timings
- [ ] Items + inventory: categories, detail cards, images, interactions
- [ ] Achievements/titles (if relevant to the release)
- [ ] Economy sanity (no runaway rewards or blockers)

---

## 4) Custom content

- [ ] Custom items: create/edit/delete, upload images, persistence
- [ ] Custom processes: create/edit/delete, duration parsing, inventory effects
- [ ] Custom quests: editor flows, simulation, dependencies, rewards
- [ ] Custom quests visible and playable in `/quests`
- [ ] PR submission flow (token scopes, safe error handling)

---

## 5) Docs + changelog

- [ ] `/docs` landing and navigation render
- [ ] All docs links (internal + external) are valid
- [ ] Release notes accurate (version, highlights, breaking changes, known issues)
- [ ] Docs match shipped behaviors (custom content, processes, chat providers, backups)

---

## 6) Deploy smoke

- [ ] Staging build came from tagged commit
- [ ] Hard refresh loads app shell and routes above
- [ ] One quest completion succeeds
- [ ] One process start/cancel/collect succeeds
- [ ] Custom item create + delete succeeds
- [ ] Chat send/receive succeeds
- [ ] Post-deploy monitoring window complete and clean
