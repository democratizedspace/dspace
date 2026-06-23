# token.place Context Benchmark

Run the synthetic DSPACE prompt-size benchmark from the repository root:

```bash
npm run benchmark:token-place-context
```

The command writes JSON and Markdown reports under `artifacts/benchmarks/token-place-context/`.
Those generated reports are local artifacts and should not be committed.

## Metrics

- `messageCount` and `roleCounts`: API-style chat message counts by role.
- `totalCharacters`: JavaScript UTF-16 string length across message content.
- `totalUtf8Bytes`: UTF-8 byte length across message content.
- `perMessage`: content-free size summaries for each message.
- `componentTotals`: content-free totals for system instructions, RAG, player state, chat history,
  and the latest user message.
- `promptBuildDurationMs` and `ragDurationMs`: local timing fields when available.

## Privacy constraints

The helper and benchmark must not return, log, or persist user prompts, RAG excerpts, player state,
chat content, keys, ciphertext, or decrypted responses. Committed fixtures are synthetic and labeled
as benchmark-only data.

## Comparing 8K and 64K readiness

Use the generated report to identify dominant context components and compare the heuristic token
count with 8,192-token and 65,536-token tiers. A scenario that does not fit 8K but fits 64K is a
candidate for full-fat routing in later phases.

## Token caveat

Character counts, byte counts, and whitespace are not exact model tokens. Tokenizers split text by
model-specific rules and chat templates add overhead. The benchmark's heuristic token estimate is
only a local planning signal until compute-side exact token admission is available.
