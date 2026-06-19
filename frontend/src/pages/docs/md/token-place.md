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

## Implementation notes for operators

DSPACE v3.1 uses direct HTTPS calls to token.place API v1 for now. It posts to
`/api/v1/chat/completions` with OpenAI-compatible `messages` and `model` fields and reads the reply
from `choices[0].message.content`. The integration will move to the token.place npm package only
after that package path is ready for DSPACE Chat.

API v1 is non-streaming. Responses may appear after the full completion is ready rather than as a
streaming token-by-token transcript.

The default token.place origin is `https://token.place`. Deployment operators may override the
origin and model with:

- `VITE_TOKEN_PLACE_URL`
- `VITE_TOKEN_PLACE_CHAT_MODEL`

Staging should use `VITE_TOKEN_PLACE_URL=https://staging.token.place`. Production can omit the URL
override or set `VITE_TOKEN_PLACE_URL=https://token.place` explicitly.
