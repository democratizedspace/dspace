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

## v3.1 / P8 relay E2EE implementation target

The relay E2EE flow below is the v3.1 / P8 implementation target and the production/staging
promotion gate for P8b. Until that client implementation lands, the shipped DSPACE Chat client is
being corrected from its legacy plaintext token.place API v1 request path. Operators should not use
the relay-route sequence below as evidence that today's shipped `/chat` client already dispatches
relay-blind requests; use it as the required target for the P8b implementation PR and release
sign-off.

DSPACE v3.1 / P8 requires token.place API v1 relay E2EE routes for the default Chat path. The
browser must generate a DSPACE `/chat` client keypair, fetch a compute node with
`GET /api/v1/relay/servers/next`, build a `tokenplace_api_v1_relay_e2ee` envelope with
`client_public_key`, encrypt that API v1 chat request envelope for the compute node, dispatch
ciphertext with `POST /api/v1/relay/requests`, poll
`POST /api/v1/relay/responses/retrieve`, then decrypt and validate the response client-side
before reading `api_v1_response.choices[0].message.content`.

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
