# Docs full-text search

## Problem statement

The `/docs` index page only filters by doc titles and static keywords. Players cannot find
information when the relevant term appears in the body text of a doc page (for example, searching
for “turbine” does not surface the Solar Power doc). We need client-side full-text search that
includes doc body text, shows a contextual snippet, and preserves existing `has:` operator
filters.

## UX specification

- **Search scope**: default queries match doc titles and body text.
- **Operators**: queries containing a `has:` predicate keep the existing feature filter behavior and
  do not show body-text snippets.
- **Snippets**:
  - Show a single snippet line under each matched doc link when the query has keywords.
  - Snippet shows the first matching keyword (deterministic) with up to two words before and after
    the match.
  - The matched word is bolded.
  - Snippet updates as the user types and disappears when the search input is empty.

## Algorithm details

### Tokenization

- Parse the query by splitting on whitespace.
- Ignore empty tokens.
- Normalize to lowercase.
- Separate `has:` operators from keywords.
- Sort keywords alphabetically for deterministic selection.

### Matching

1. Build an in-memory search index on page load:
   - **Title**: existing doc title string.
   - **Body text**: markdown stripped to plain text.
   - **Features**: existing `has:` feature detection.
2. For a given query:
   - Match doc if **all keywords** appear in any of the searchable values (title, keywords, body
     text).
   - Match doc only if all `has:` operators exist in the doc’s feature list.

### Snippet extraction

- Choose the snippet keyword as the first keyword in alphabetical order that matches the body
  text.
- Tokenize the body text by whitespace and keep tokens whose stripped core contains at least one
  letter/number (strip leading/trailing non-letter/number characters).
- Match against the stripped, lowercased token value, but render the original token so punctuation
  like `turbine.` remains visible.
- Find the first occurrence of that keyword (left-to-right) in the filtered word tokens.
- Extract up to two word tokens before and after the matched word.
- Render with `<strong>` around the matched word.

### Markdown to plain text

A lightweight strip approach avoids dependencies:

- Remove fenced and inline code.
- Strip markdown links and images, leaving their visible text.
- Remove headings markers, blockquote prefixes, and inline emphasis markers.
- Remove HTML tags.
- Collapse whitespace.

## Performance considerations

- The index is constructed once per `/docs` page load from local markdown content.
- Search runs in-memory on the already-loaded dataset, so filtering and snippet extraction are
  limited to the docs list size.
- Keyword sorting and string normalization are linear in the size of the query and doc text.

## Test plan

- **Unit tests** for query parsing, snippet extraction, and deterministic keyword selection.
- **E2E test** for `/docs` to verify body-text-only matches render a snippet and that clearing the
  input removes snippets.
- Run `npm test` (or `SKIP_E2E=1 npm test` if browsers are unavailable).
