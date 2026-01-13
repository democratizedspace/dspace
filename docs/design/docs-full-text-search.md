# Docs full-text search

## Problem statement
The `/docs` index currently filters results using only titles (and optional keywords), which makes
it difficult to find documentation where a term appears only in the body of the markdown content.
Players expect full-text discovery while they are already in the docs index, and they need
lightweight context to confirm the match without opening every page.

## UX specification
- **Search scope**: for standard queries (no `has:` predicates), match keywords against doc titles,
  keywords, and full doc body text.
- **Predicate mode**: queries containing `has:` predicates keep the existing feature-filtering
  behavior and do **not** show body snippets.
- **Snippets**:
  - Display a single line under each matching link when the match comes from body text.
  - Show up to two words before and after the matched word.
  - Bold the matched word.
  - Update snippets live as the user types.
  - Clear snippets when the query is empty.
- **Determinism**:
  - Split the query on whitespace into keywords (case-insensitive, ignore empty tokens).
  - Pick the first keyword in alphabetical order for snippet generation.
  - Use the first occurrence of that keyword in the document body.

## Algorithm
1. **Preprocessing** (once per page load):
   - Load markdown content for each `/docs/<slug>` page.
   - Convert markdown to plain text by stripping code fences, inline code, links, and tags.
   - Store `bodyText` and normalized searchable values (title, keywords, body text) per link.
2. **Query parsing**:
   - Normalize the raw query to lowercase.
   - Split on whitespace.
   - Extract `has:` operators and store remaining keywords (deduped, alphabetically sorted).
3. **Matching**:
   - A link matches when **all** keywords appear in **any** searchable value and all operators match
     available doc features.
4. **Snippet extraction**:
   - For each link, attempt keywords in alphabetical order.
   - Find the first body word containing the keyword (case-insensitive).
   - Capture up to two words before and after the match.
   - Render the snippet with the matched word bolded.

## Performance considerations
- Markdown parsing and normalization happens once during `/docs` page render and is passed to the
  client as plain text.
- Client-side filtering uses precomputed lowercase strings for quick `includes()` checks.
- Snippet generation is only performed when a query is present and no `has:` predicate exists.

## Test plan
- **Unit tests**: cover query parsing, keyword sorting, snippet extraction boundaries, and
  deterministic keyword selection.
- **Integration/E2E**: verify searching for a body-only term (e.g., `turbine`) shows the Solar
  power entry plus a bolded snippet, and clears the snippet when the input is reset.
