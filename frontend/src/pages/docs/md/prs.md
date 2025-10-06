---
title: 'Pull Requests'
slug: 'prs'
---

Pull requests are welcome! See our [Contribution Guide](/docs/contribute) for details on how to get started.

Before opening a pull request:

-   run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`
-   scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`
    -   The script prints "Potential secret detected" when AWS keys, GitHub tokens, or other
        credential-like values slip into the staged diff, so you can remove them before pushing.
-   use an emoji-prefixed commit message
