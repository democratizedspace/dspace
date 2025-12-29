---
title: 'Release QA'
slug: 'qa'
---

# Release QA

Use the shared QA checklists to prepare releases and future maintenance drops. The source of truth
lives in the repository:

- [QA checklist index](https://github.com/democratizedspace/dspace/blob/main/docs/qa/README.md)
- [DSPACE v3 QA checklist](https://github.com/democratizedspace/dspace/blob/main/docs/qa/v3)
- [QA template for new releases](https://github.com/democratizedspace/dspace/blob/main/docs/qa/template.md)

## Quick commands

- `npm run qa:smoke` — lint/format check, type-check, root tests, content and docs link validation
- `npm test` — grouped Playwright suite; set `SKIP_E2E=1` to skip Playwright locally
- `npm run link-check` — docs/internal route validation
- `python -m scripts.image_issues find-image-issues` — duplicate/missing image gate
