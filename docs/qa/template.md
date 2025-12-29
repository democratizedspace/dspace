# DSPACE Release QA Template

> Copy this file for each release and fill in the blanks. Keep the quick command
> index near the top so contributors know how to run automation.

## Quick command index

- `npm run qa:smoke` — replace with the canonical local smoke bundle for this
  release
- `npm run link-check` — docs link validation (adjust if you use a different
  route checker)
- `python -m scripts.image_issues find-image-issues` — image duplicate/missing
  scan (if applicable)

---

## 0) Release metadata

- [ ] RC commit SHA: `__________`
- [ ] RC tag/version string: `vX.Y.___`
- [ ] Staging URL verified: `https://staging.example.com`
- [ ] Prod URL verified: `https://example.com`
- [ ] “Stop ship” criteria agreed (list the non-negotiables)

---

## 1) Automation

- [ ] Local smoke passes (list the commands you expect to run)
- [ ] CI is green on the release branch/tag
- [ ] Content validation passes (quests/processes/items)
- [ ] Docs link checker passes
- [ ] Image duplicate/missing scan passes (if applicable)

---

## 2) Route smoke

- [ ] Top navigation routes load without errors (list your nav)
- [ ] Secondary/utility routes load (gamesaves, settings, stats, etc.)
- [ ] External links open correctly

---

## 3) Core systems

- [ ] Quest flows (list representative chains)
- [ ] Processes lifecycle (start, cancel, collect)
- [ ] Inventory renders with correct metadata and images
- [ ] Chat/AI path behaves (note which provider(s) are in scope)

---

## 4) Custom content

- [ ] Custom items can be created/edited/deleted
- [ ] Custom processes validate and run
- [ ] Custom quests validate, preview, save, and appear in the quest list
- [ ] Import/export/backup paths work for custom content

---

## 5) Docs + changelog

- [ ] Docs are updated for the release scope
- [ ] Changelog entry exists with the correct version/date/highlights
- [ ] Docs vs app behavior spot checks completed

---

## 6) Deploy smoke

- [ ] Staging deploy passes the smoke routes above
- [ ] Production deploy passes the smoke routes above
- [ ] Post-deploy monitoring window completed
