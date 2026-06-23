# token.place Context Benchmark

Run the synthetic DSPACE prompt-size benchmark from the repository root:

```bash
npm run benchmark:token-place-context
```

The command writes JSON and Markdown reports under `artifacts/benchmarks/token-place-context/`.
Those generated reports are local artifacts and should not be committed.

## Metrics

- `sourceMessageCount`: synthetic messages before token.place request shaping.
- `tokenPlaceMessageCount`, `messageCount`, and `roleCounts`: API-style chat message counts after `sanitizeTokenPlaceMessages` applies token.place chunking and request caps.
- `totalCharacters`: JavaScript UTF-16 string length across message content.
- `totalUtf8Bytes`: UTF-8 byte length across message content.
- `perMessage`: content-free size summaries for each message.
- `componentTotals`: content-free totals for system instructions, RAG, player state, chat history,
  and the latest user message.
- `promptBuildDurationMs` and `ragDurationMs`: local timing fields when available.
- `estimator`: deterministic DSPACE tier classification for the sanitized API v1 message payload, including estimated prompt tokens, reserved output tokens, safety margin, selected `8k-fast`/`64k-full` tier, over-limit status, and estimator version.
- `calibration`: exact-token error fields when a lightweight development-only Llama 3.1 tokenizer hook is available; otherwise `null`.

## Privacy constraints

The helper and benchmark must not return, log, or persist user prompts, RAG excerpts, player state,
chat content, keys, ciphertext, or decrypted responses. Committed fixtures are synthetic and labeled
as benchmark-only data.

## Comparing 8K and 64K readiness

Use the generated report to identify dominant context components and compare the heuristic token
count with the named `8k-fast` (8,192 total context tokens) and `64k-full` (65,536 total context tokens) profiles. The estimator reserves 512 output tokens by default, adds chat-template overhead per message, then applies an 8% safety margin before marking a tier as fitting. A scenario that does not fit 8K but fits 64K is a candidate for full-fat routing in later phases. The report also flags whether the token.place-shaped request remains under the 131,072-character request ceiling.

## Token caveat

Character counts, byte counts, and whitespace are not exact model tokens. Tokenizers split text by model-specific rules and chat templates add overhead. The estimator counts UTF-8 bytes as well as JavaScript characters, intentionally overestimates common prompt shapes, and works offline in the browser without sending text to any server. These estimates are only local planning signals until compute-side exact token admission is available; heuristic estimates must not be labeled as exact.
