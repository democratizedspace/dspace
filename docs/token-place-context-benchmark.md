# token.place context benchmark

Run the privacy-safe DSPACE prompt-size benchmark from the repository root:

```bash
npm run benchmark:token-place-context
```

The command writes local artifacts under `artifacts/benchmarks/token-place-context/`:

- `*.json` contains machine-readable counts and timings.
- `*.md` contains a human-readable scenario table.

These artifacts are generated from synthetic repository-owned text and should normally stay
uncommitted because they include machine-specific timing measurements.

## Metrics

- **message count**: number of token.place API v1 messages after local shaping.
- **role counts**: message totals by `system`, `user`, `assistant`, or `unknown` role.
- **total characters**: JavaScript string length across message content.
- **total UTF-8 bytes**: encoded byte size across message content.
- **per-message summaries**: index, role, safe component label, character count, and byte count.
- **component totals**: safe aggregate counts for system instructions, RAG, player state, chat
  history, and latest user message.
- **prompt-build duration** and **RAG duration**: elapsed milliseconds when available.

The metrics helper never returns prompt content strings. It reports counts only.

## Privacy constraints

Do not add real user prompts, chat transcripts, RAG excerpts, player saves, keys, ciphertext, or
secrets to benchmark fixtures or outputs. Synthetic fixtures should use obvious placeholder text.
Production chat output, token.place network requests, relay routing, encryption, and response
handling are not changed by this benchmark path.

## Comparing 8K and 64K readiness

Use component totals to identify what dominates context use, then compare the prompt-size trend
against the target profile:

- `8k-fast`: token-lite and compact full-fat prompts should fit comfortably after reserving output
  tokens and safety margin.
- `64k-full`: typical full-fat, RAG-heavy, long-history, and large-player-state scenarios should
  fit with enough remaining room for the model response.

The near-ceiling scenario checks the current token.place API v1 request boundaries rather than a
model context window.

## Characters are not model tokens

Character counts, whitespace counts, and UTF-8 byte counts are useful stable size signals, but they
are not exact Llama tokens. Tokenization depends on the model tokenizer, chat template, role
markers, special tokens, and whitespace segmentation. Treat these metrics as conservative prompt
budget diagnostics unless an optional exact tokenizer is added to the local benchmark environment.
