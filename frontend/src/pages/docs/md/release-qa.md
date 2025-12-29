---
title: 'Release QA'
slug: 'release-qa'
---

Use the repo-hosted QA checklists to keep releases consistent:

- [QA checklists index](https://github.com/democratizedspace/dspace/tree/v3/docs/qa)
- [v3 QA checklist](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3)
- [QA template](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/template.md)

Quick commands from the v3 flow:

```bash
npm run qa:smoke   # type-check, full PR suite, docs link check, image scan
npm run link-check # docs + route link validation
```

Copy the latest checklist for each release (v3.0.1, v3.1, etc.) and keep the
“Quick command index” section near the top so contributors know how to run
automation without hunting for scripts.
