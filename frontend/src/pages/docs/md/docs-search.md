---
title: 'Docs search'
slug: 'docs-search'
---

The docs search box on the `/docs` index now scans both titles and full document text. You can
type plain keywords to find any page that mentions those terms, even if the title does not. When a
keyword match comes from the body text, the docs list shows a short context snippet under the link
highlighting the first matching word with up to two neighboring words on each side.

If you use `has:` filters (like `has:image` or `has:link`), the search keeps the existing behavior
and focuses on those feature tags instead of showing snippets.
