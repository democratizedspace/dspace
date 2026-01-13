# Docs Full-Text Search

## Problem statement

The `/docs` index page currently searches only document titles and keyword tags. Players who
remember a detail from inside a doc (e.g., “turbines” in the Solar Power doc) cannot discover it
via search, which makes the in-game help system feel incomplete.

## UX specification

- Default search (non-`has:` queries) matches both doc titles and full document body text.
- If the query contains a `has:` predicate, keep existing operator behavior and do **not** render
  body-text snippets.
- When a body-text match is found, show one snippet line under the doc link:
  - The snippet shows the first matching word for the chosen keyword.
  - Include up to two adjacent words before and after the match.
  - Bold the matched word.
  - Snippets update live as the user types and disappear when the query is cleared.
- If multiple keywords match a doc, choose the snippet keyword deterministically by alphabetical
  order (lowercased), then use that keyword’s first occurrence in the doc text.

## Algorithm details

### Tokenization

- Parse the user query into lowercase keywords by splitting on whitespace and removing empty
  tokens.
- Detect `has:` operators separately and store them as feature filters.
- Deduplicate and sort keywords alphabetically so snippet selection is deterministic.

### Matching

- Normalize searchable text to lowercase.
- A doc matches if **all** keywords appear in either the title, tag keywords, or the doc body text.
- `has:` operators are evaluated against the precomputed doc feature list.

### Snippet extraction

1. Convert markdown content to plain text by stripping code blocks, inline code, markdown syntax,
   and HTML tags, then collapse whitespace.
2. Tokenize the plain text into word tokens (letters/digits plus apostrophes/hyphens).
3. Find the first word that contains the chosen keyword (case-insensitive).
4. Return up to two words before and after that word and render the matched word in `<strong>`.

## Performance considerations

- The docs page builds an in-memory index (title + keywords + plain-text body + feature flags) once
  per page load.
- Search filtering and snippet extraction run in-memory on this index, avoiding any server-side
  dependencies.
- Snippet extraction only runs for filtered links when the query has keywords and no `has:`
  predicates.

## Test plan

- Unit tests for:
  - Query parsing (keywords, operator detection, deterministic sorting).
  - Snippet extraction (start/end boundaries, case-insensitive matching, two-word window).
  - Deterministic snippet selection by keyword order and first occurrence.
- Playwright test that:
  - Searches `/docs` for a term appearing only in a doc body (e.g., “turbine” in Solar Power).
  - Confirms the doc appears in results and renders a snippet with `<strong>` on the match.
