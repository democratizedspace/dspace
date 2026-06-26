# token.place Context-tier QA Notes

DSPACE token.place API v1 chat now estimates the sanitized encrypted request payload locally and
requests the smallest compatible relay tier: `8k-fast` or `64k-full`. The relay selection request
carries only coarse routing metadata (`model`, `context_tier`, and DSPACE capability markers); the
actual chat messages, RAG context, and player state remain inside the encrypted API v1 envelope.

## Expected staging checks

1. Register healthy token.place API v1 compute nodes for both `8k-fast` and `64k-full`.
2. Send a token-lite request and confirm it estimates `8k-fast`, routes to an 8K node when one is
   healthy, and succeeds.
3. Send a small full-fat DSPACE chat request and confirm it estimates `8k-fast` and normally uses
   an 8K node.
4. Send a large full-fat/RAG request and confirm it estimates `64k-full`, selects a 64K-capable
   node, and succeeds when compute-side exact admission fits.
5. Force an underestimated 8K overflow and confirm DSPACE retries exactly once on `64k-full` using
   the same sanitized message payload with a new request id, cancel token, and node public key.
6. Stop or saturate 8K capacity, send a small request, and confirm controlled relay spillover to a
   `64k-full` node is accepted and recorded as spillover.
7. Send an over-budget request and confirm DSPACE fails locally before relay selection with a clear
   context-budget message.
8. Inspect relay logs and confirm they contain no prompt text, RAG excerpts, player state,
   decrypted response text, private keys, ciphertext dumps, or raw relay payloads.

Safe diagnostics may include estimated/requested tier, selected tier, spillover, retry escalation,
estimator version, estimated prompt tokens, reserved output tokens, timeout class, safe error code,
and timings.
