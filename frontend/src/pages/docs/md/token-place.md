---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE v3.1 uses token.place as the default provider for the NPC Chat experience at `/chat`.
Fresh users can open Chat, choose an NPC/persona when needed, and send a message without creating an
account, adding an API key, or configuring a provider first.

## What token.place does in DSPACE

- token.place powers the default Chat completion request for DSPACE NPC conversations.
- The Chat UI still provides DSPACE-specific context such as NPC persona instructions, relevant docs
  context, and local player-state summaries.
- DSPACE does not charge users for token.place Chat access and does not ask players for token.place
  credentials.
- No token.place API key is stored, requested, or sent by the DSPACE client.

## Provider choices

The default Chat provider is **token.place**. OpenAI remains available as an optional
bring-your-own-key provider:

1. Open [/settings](/settings).
2. Choose OpenAI as the Chat provider.
3. Save your own OpenAI API key.

Switching back to token.place in `/settings` returns Chat to the no-key default path. `/chat` no
longer requires an OpenAI key unless you explicitly select OpenAI as your provider.

## Current API behavior

DSPACE currently talks to token.place with direct HTTPS API v1 requests:

- Endpoint: `POST /api/v1/chat/completions` on the configured token.place origin.
- Default origin: `https://token.place`.
- Staging origin: `https://staging.token.place` when configured by the deployment.
- Response text comes from the OpenAI-compatible `choices[0].message.content` field.
- API v1 is non-streaming, so responses may appear only after the full completion is ready.

The integration will move to the token.place npm package only after that package path is ready for
DSPACE's browser-side Chat use case. v3.1 does not use token.place API v2 and does not send
streaming requests.

## Deployment overrides

Operators can override the default token.place origin and model with these environment variables:

```bash
VITE_TOKEN_PLACE_URL=https://staging.token.place
VITE_TOKEN_PLACE_CHAT_MODEL=gpt-5-chat-latest
```

Do not configure user-facing token.place credentials for DSPACE; the v3.1 Chat path is designed to
run without them.
