# Docs full-text search design

## Problem statement

The `/docs` index page only searches doc titles and metadata keywords. Players expect to find
content by terms that exist in the body of a doc (for example, "turbines" in the Solar Power
article). We need client-side full-text search with deterministic snippets, without adding a
server-side search service or heavy dependencies.

## UX specification

- **Default search** (no `has:` predicate) matches doc titles, metadata keywords, and full
  doc body text.
- **`has:` predicate search** preserves the existing behavior: apply the predicate filter and
  only match title/keyword metadata. Do not show body snippets in this mode.
- **Snippet display**
  - For body matches, show one snippet line under the doc link.
  - The snippet contains the first occurrence of the selected keyword, with up to two words
    before and after it.
  - The matched word is bolded.
  - Snippets update live as the user types and disappear when the search box is cleared.
- **Determinism**
  - Parse the query into keywords by splitting on whitespace and lowercasing.
  - Sort keywords alphabetically (lowercased). If multiple keywords match a doc, use the first
    keyword in this sorted order.
  - For a chosen keyword, use the first match in the doc body (left-to-right).

## Algorithm details

### Tokenization & query parsing

1. Normalize the raw query by trimming and lowercasing.
2. Split on whitespace into tokens.
3. Tokens prefixed with `has:` become predicate operators.
4. Remaining tokens become keywords.
5. Deduplicate and alphabetically sort keywords for deterministic snippet selection.

### Matching

- Build a client-side in-memory index at page load:
  - Title + metadata keywords
  - Plain-text body content extracted from markdown
- For non-`has:` queries, match keywords against title, metadata keywords, and body text.
- For `has:` queries, match keywords against title + metadata keywords only, then apply the
  predicate filter.

### Snippet extraction

1. For a given keyword, scan the body text tokens (split on whitespace) in order.
2. Find the first token that contains the keyword (case-insensitive substring match so
   `turbine` matches `turbines`).
3. Capture up to two words before and after the match token.
4. Build snippet HTML with a `<strong>` wrapper around the matched substring inside the token.
5. Escape HTML for all other characters to keep snippets safe for `{@html}` rendering.

### Markdown to plain text

Strip the markdown content on the server when building the index:

- Remove fenced code blocks and inline code.
- Replace markdown links with their visible text.
- Remove emphasis markers, headings, and HTML tags.
- Collapse whitespace to a single space.

## Performance considerations

- The body text index is created once per page load using the markdown files already available
  on the server.
- Client-side filtering is a fast substring check across pre-normalized strings.
- Snippets are computed only for docs that already match the query, minimizing per-keystroke
  work.

## Test plan

- **Unit tests**
  - `parseDocsQuery` returns empty keywords for empty input, sorts keywords, and detects
    `has:` predicates.
  - `extractSnippet` handles boundaries, case-insensitive matches, and limits to two words of
    context.
  - `findDocSnippet` selects the alphabetically first keyword and first match in the body.
- **Component/integration test**
  - Render the docs index component with a doc whose body (but not title) contains a keyword.
  - Type the keyword and verify the doc appears with a snippet containing a `<strong>` match
    and surrounding context.
