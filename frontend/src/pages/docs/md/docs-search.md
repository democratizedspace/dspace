---
title: 'Docs search'
slug: 'docs-search'
---

The docs index page (`/docs`) now supports full-text search. When you type keywords into the
search box, matching docs are pulled from both doc titles and doc body content.

## How matching works

- Keywords are split on whitespace and compared case-insensitively.
- `has:` filters (for example, `has:link`) still work the same way and only filter by metadata.
- When multiple keywords match a doc, the snippet uses the alphabetically first keyword.

## Snippet behavior

When a match comes from the body text, the docs index shows a short context snippet under the
link. The snippet shows the first match for the chosen keyword, with up to two words before and
after the match. The matching word is bolded, and snippets update live as you type.
