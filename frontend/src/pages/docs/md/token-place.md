---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE v3.1 uses token.place as the default provider for the in-game Chat experience. That means a
fresh player can open `/chat`, choose an NPC persona, and send a message without signing in,
creating an API key, or configuring billing.

## What token.place does in DSPACE Chat

- token.place powers the default NPC Chat path in `/chat`.
- DSPACE sends OpenAI-compatible chat messages to token.place API v1 at
  `https://token.place/api/v1/chat/completions`.
- DSPACE reads the assistant reply from `choices[0].message.content` and displays it in the same
  NPC Chat interface used by the other provider option.
- The Chat payload can include DSPACE's normal persona, quest, item, process, docs context, and safe
  non-secret request metadata so answers stay grounded in the game.

DSPACE does not charge players for this default Chat path, does not ask players for token.place
credentials, and does not store a token.place API key.

## Default provider behavior

For new or reset saves, Chat defaults to token.place. No token.place setup is required from the
player.

If you previously used OpenAI, you can keep using it by selecting OpenAI in `/settings`. The OpenAI
path is optional and uses your own OpenAI key stored in DSPACE's existing local client storage.

## OpenAI opt-in through Settings

Use `/settings` when you want to change Chat providers:

1. Keep **token.place** selected for the default no-key Chat experience.
2. Select **OpenAI** only if you want to bring your own OpenAI API key.
3. Clear the OpenAI key or switch back to token.place whenever you want to return to the default
   provider.

The `/chat` page itself should not require an OpenAI key for the default v3.1 experience.

## Current limitations and implementation notes

- token.place API v1 is non-streaming. Responses may appear after the full completion is ready
  rather than token-by-token.
- DSPACE uses direct HTTPS API v1 requests for now. It will move to the token.place npm package only
  after that package path is ready for this integration.
- DSPACE does not send a token.place `Authorization` header, OpenAI key, token.place credential, raw
  save data, or detailed inventory payload in token.place metadata.

## Deployment configuration

Production uses `https://token.place` by default. Staging deployments should set:

```bash
VITE_TOKEN_PLACE_URL=https://staging.token.place
```

Operators can also set `VITE_TOKEN_PLACE_URL=https://token.place` explicitly in production, or set
`VITE_TOKEN_PLACE_CHAT_MODEL` to override the default chat model for a deployment.
