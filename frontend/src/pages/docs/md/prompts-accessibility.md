---
title: 'Accessibility Prompts'
slug: 'prompts-accessibility'
---

# Accessibility prompts for the _dspace_ repo

Use this guide when enhancing the project's accessibility. The focus is on semantic HTML,
ARIA attributes, keyboard navigation, and sufficient color contrast.

> **TL;DR**
>
> 1. Limit changes to files that impact user accessibility.
> 2. Follow WCAG 2.1 AA: provide focus states, semantic elements, and ARIA labels.
> 3. Validate with tooling like `npm run lint` and screen‑reader checks when possible.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 6. Commit with an emoji prefix.
