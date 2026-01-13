---
title: 'Docs search'
slug: 'docs-search'
---

The `/docs` index includes a search box that now looks at both titles and body text, so you can
find entries even when the keyword only appears inside the article itself. For example, searching
for `turbine` will still surface the Solar power page because its body mentions wind turbines.

## Snippet behavior

When your query matches the body of a document, the index shows a short context snippet beneath the
link:

- The snippet uses the **first** matching keyword (alphabetical order) from your query.
- It shows up to two words before and after the match.
- The matched word is bolded for quick scanning.
- Snippets disappear when the search box is cleared.

## `has:` operators

Queries that include `has:` predicates (like `has:image` or `has:link`) still filter by those
features. Snippets only appear for plain text searches without `has:` operators.
