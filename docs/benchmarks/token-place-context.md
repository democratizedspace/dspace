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
- `contextEstimate`: the deterministic DSPACE context classifier result for the complete sanitized
  token.place API v1 message payload.

## Context estimator

The production estimator is browser-safe, deterministic, offline, and privacy-preserving. It never
sends prompt text to a tokenizer service and benchmark output stores only aggregate counts. It uses
UTF-8 byte counts of the sanitized API v1 message payload, not JavaScript string length alone, then
adds conservative chat-template overhead.

Named profiles are:

| Profile    | Total context tokens |
| ---------- | -------------------: |
| `8k-fast`  |                8,192 |
| `64k-full` |               65,536 |

The classifier reserves 512 output tokens by default, matching the current DSPACE/token.place
planning budget. It also applies an 8% safety margin with a 256-token minimum so heuristic estimates
prefer conservative overestimation. Tier selection is pure: select `8k-fast` only when prompt tokens,
output reservation, and margin fit 8,192; otherwise select `64k-full` when they fit 65,536; otherwise
return an explicit over-limit result. The estimator does not truncate prompts or change relay routing.

## Privacy constraints

The helper and benchmark must not return, log, or persist user prompts, RAG excerpts, player state,
chat content, keys, ciphertext, or decrypted responses. Committed fixtures are synthetic and labeled
as benchmark-only data.

## Comparing 8K and 64K readiness

Use the generated report to identify dominant context components and compare the estimated prompt
count plus reserved output and safety margin with the 8,192-token and 65,536-token tiers. A scenario
that does not fit 8K but fits 64K is a candidate for full-fat routing in later phases. The report also
flags whether the token.place-shaped request remains under the 131,072-character request ceiling.

## Token caveat and calibration

Character counts, byte counts, and whitespace are not exact model tokens. Tokenizers split text by
model-specific rules and chat templates add overhead. The benchmark labels these values as estimates,
not exact token counts. When an existing lightweight development-only Llama 3.1 tokenizer path is
available, benchmark output may include exact-token calibration error; otherwise calibration is marked
unavailable.
