# token.place Context Benchmarking

DSPACE includes a local, privacy-safe benchmark for measuring prompt size before later context-tier routing work. It is Phase 0 instrumentation only: it does not change token.place routing, encryption, relay behavior, response handling, settings, or production chat output.

## Run the benchmark

From the repository root:

```bash
npm run benchmark:token-place-context
```

The command writes local artifacts under `artifacts/benchmarks/token-place-context/`:

- `<timestamp>.json` for machine-readable comparisons.
- `<timestamp>.md` for a readable summary table.

These files are generated from synthetic fixtures and should normally stay uncommitted because timings are machine-specific.

## Metrics

The metrics helper returns counts only, never prompt content:

- `messageCount`: number of chat messages in the measured payload.
- `roleCounts`: count of messages by role, such as `system`, `user`, and `assistant`.
- `totalCharacters`: JavaScript string length across message content.
- `totalUtf8Bytes`: UTF-8 encoded byte length across message content.
- `perMessage`: index, role, character count, and UTF-8 byte count for each message.
- `componentTotals`: message, character, and byte totals for identifiable prompt components:
  - system instructions;
  - docs RAG / DSPACE knowledge context;
  - player state;
  - chat history;
  - latest user message.
- `timingsMs.promptBuild`: prompt build duration when the caller supplies it.
- `timingsMs.rag`: docs RAG duration when available.

## Privacy constraints

Benchmark outputs and prompt metrics must not include user prompts, RAG excerpts, player state, chat content, keys, ciphertext, decrypted responses, or secrets. Component accounting is based on message indexes and size counts. Committed fixtures are synthetic and repository-owned.

## Comparing 8K and 64K readiness

Use the JSON or Markdown report to identify the dominant component and compare the rough prompt size against target tiers:

- `8k-fast` is intended for token-lite and small prompts.
- `64k-full` is intended for full-fat DSPACE prompts, RAG-heavy prompts, and larger player state.

As a quick screen, divide `totalCharacters` by four for a rough token estimate, then leave room for chat-template overhead, system-added tokens, safety margin, and reserved output tokens. Prompts near or above an 8K budget should be treated as likely `64k-full` candidates until exact compute-side token admission is implemented.

## Character counts are not model tokens

Character counts, byte counts, and whitespace counts are useful for deterministic browser-side measurement, but they are not exact model tokens. Token counts depend on the model tokenizer and chat template. UTF-8 byte counts also diverge from token counts for non-ASCII text. Future phases may add an optional exact Llama 3.1 tokenizer hook for local benchmarking, but the benchmark remains useful without it.
