---
title: 'Docs search'
slug: 'docs-search'
---

# Docs search

Use the search box on the `/docs` page to find documentation by title or by the words inside each
page.

## How it works

- **Title + content search**: Typing a word like `turbine` matches docs whose titles _or_ body text
  contain that word.
- **Feature filters**: Queries that include `has:` (for example, `has:image`) still filter by those
  features. The filter works alongside the text query, and snippets are hidden for these operator
  searches.

## Snippets

When a match comes from the body text, the docs list shows a short snippet under the link:

- The snippet shows the **first** matching word for the query.
- It includes up to **two words before and two words after** the match.
- The matched word is **bolded**.

The snippet updates as you type and disappears when the search box is cleared.

Example long URL:
https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/DocsIndex.svelte
