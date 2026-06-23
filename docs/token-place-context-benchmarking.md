# token.place context benchmarking

Run the privacy-safe DSPACE prompt benchmark from the repository root:

```bash
npm run benchmark:token-place-context
```

The command writes JSON and Markdown reports under `artifacts/benchmarks/token-place-context/`.
Those generated reports are local artifacts and should not be committed.

## Metrics

- `messageCount` and `roleCounts`: API-style chat message shape counts.
- `totalCharacters`: JavaScript string length across message content.
- `totalUtf8Bytes`: encoded UTF-8 bytes across message content.
- `messages`: per-message index, role, character count, and byte count only.
- `componentTotals`: size totals for system instructions, docs RAG, player state, chat history, and latest user message when safely identified.
- `timings`: prompt-build and RAG durations when the caller supplies them.

## Privacy constraints

The metrics helper and benchmark reports must never return or write actual prompts, RAG excerpts,
player state, chat content, keys, ciphertext, or user text. Committed benchmark scenarios use
synthetic fixture strings only.

## Comparing 8K and 64K readiness

Use the Markdown table to find scenarios whose heuristic token count approaches 8,192 or 65,536.
Prompts near 8K should be treated as candidates for a larger tier because exact chat-template tokens,
reserved output tokens, and tokenizer behavior can push them over the limit. Prompts approaching 64K
need prompt reduction before production routing.

## Character counts are not model tokens

Character counts, byte counts, and whitespace counts are deterministic browser-side measurements,
but Llama 3.1 tokenization depends on the model tokenizer and chat template. The benchmark therefore
labels `characters / 4` as a heuristic only. Exact tokenizer results may be added later when a small
server-side tokenizer is available without changing the production browser bundle.
