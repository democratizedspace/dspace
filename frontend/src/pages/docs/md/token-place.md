---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE v3.1 uses token.place as the default provider for in-game NPC Chat. Open [/chat](/chat),
choose a persona if you want one, and send a message: fresh users do not need DSPACE auth, an
OpenAI API key, or token.place credentials.

## What token.place does in DSPACE Chat

[token.place](https://token.place) supplies the default LLM completion endpoint behind DSPACE's
Chat UI. DSPACE still builds the game-aware prompt locally from the selected NPC persona, quest and
process context, docs retrieval, and safe player-state summary. token.place returns the assistant
message that the Chat UI displays.

## Default provider behavior

- token.place is selected by default for new and migrated users.
- DSPACE does not charge players for token.place Chat usage.
- DSPACE does not ask users for token.place credentials.
- DSPACE does not store token.place credentials because none are required for the v3.1 Chat flow.
- token.place requests do not use your OpenAI key, even if you have one saved for the optional
  OpenAI provider.

## Optional OpenAI path

OpenAI remains available as a bring-your-own-key provider:

1. Open [/settings](/settings).
2. Change the Chat provider from token.place to OpenAI.
3. Save your OpenAI API key in the OpenAI key field.
4. Return to [/chat](/chat).

If OpenAI is selected without a saved key, Chat should guide you back to Settings instead of making
an empty-key request. Switch the provider back to token.place in Settings to return to the no-key
default.

## v3.1 relay E2EE implementation target

DSPACE v3.1 uses token.place API v1 relay E2EE routes for the default Chat path. The browser
generates a DSPACE `/chat` client keypair, estimates the sanitized API v1 message payload locally,
requests the selected context tier with `GET /api/v1/relay/servers/next?model=...&context_tier=...`,
builds a `tokenplace_api_v1_relay_e2ee` envelope with `client_public_key`, encrypts that API v1
chat request envelope for the compute node, dispatches ciphertext with
`POST /api/v1/relay/requests`, polls `POST /api/v1/relay/responses/retrieve`, then decrypts and
validates the response client-side before reading `api_v1_response.message.content` or
`api_v1_response.choices[0].message.content`.

## Context tiers and bounded retry

DSPACE estimates the complete sanitized token.place API v1 messages in the browser before relay
selection. The estimator chooses `8k-fast` when the prompt estimate plus output reservation and
safety margin fits 8,192 tokens, chooses `64k-full` when it needs the larger 65,536-token tier, and
fails locally with a context-budget message when the request is estimated above 64K. The estimate is
only a routing hint; the compute node remains authoritative.

The encrypted API v1 request includes `routing.context_tier` with the requested tier. The
relay-visible request remains ciphertext-only plus the existing public routing envelope and does not
include exact token counts, prompt text, docs/RAG snippets, player state, private keys, ciphertext in
logs, or decrypted content. DSPACE validates the relay-selected node metadata, accepts controlled
spillover from an `8k-fast` request to a `64k-full` node, and records safe diagnostics such as
requested tier, selected tier, spillover, estimator version, token estimates, timeout class, and safe
error code.

If an `8k-fast` attempt lands on an 8K node and the encrypted compute response reports
`compute_node_context_window_exceeded` as retryable or recommends `64k-full`, DSPACE retries exactly
once on `64k-full`. The retry reuses the unchanged sanitized message payload, reselects a fresh
64K-capable node, re-encrypts for the new public key, and uses a new request ID and cancel token.
DSPACE does not retry 64K overflows, request-too-large errors, invalid requests, malformed responses,
policy errors, model unsupported errors, provider errors, or network errors beyond existing safe
behavior.

The relay request payload must be ciphertext-only plus safe routing metadata. token.place
relay-owned state and logs must not receive plaintext DSPACE prompt messages, player state, docs
grounding, raw inventory, save data, OpenAI keys, token.place credentials, or other secrets. The
default Chat path must not send plaintext `{ model, messages }` directly to
`/api/v1/chat/completions`, use token.place API v2, stream responses, use the token.place npm
package, send token.place auth/API keys, or fall back to deprecated legacy relay routes.

API v1 remains non-streaming inside the encrypted envelope. Responses may appear after the full
completion is ready rather than as a streaming token-by-token transcript.

The default token.place origin is `https://token.place`, and the default token.place API v1
Chat model is `llama-3.1-8b-instruct`. Deployment operators should override the origin and
model at runtime with public, non-secret environment variables when a token.place deployment
requires a different API v1 model:

- `DSPACE_TOKEN_PLACE_URL`
- `DSPACE_TOKEN_PLACE_CHAT_MODEL`

The `/config.json` endpoint and the server-rendered `/chat` page both read these runtime values, so
one immutable image can move between staging and production without rebuilding. Staging should use
`DSPACE_TOKEN_PLACE_URL=https://staging.token.place`. Production can omit the URL override or set
`DSPACE_TOKEN_PLACE_URL=https://token.place` explicitly.

`VITE_TOKEN_PLACE_URL` and `VITE_TOKEN_PLACE_CHAT_MODEL` remain local-development and build-time
compatibility fallbacks only. Runtime `DSPACE_TOKEN_PLACE_URL` takes precedence over legacy saved
`state.tokenPlace.url` values so an old browser save cannot keep a staging deployment pointed at a
production token.place origin.
