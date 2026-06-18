---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE v3.1 uses token.place as the default provider for the in-game NPC Chat experience. Fresh
players can open [/chat](/chat), choose a persona, and ask for quest, item, process, or progression
help without creating an account or entering any API key.

## What token.place does in DSPACE Chat

When Chat is set to token.place, DSPACE sends the same NPC persona instructions, safe player-state
summary, and docs context used by the Chat UI to token.place API v1. token.place returns an
OpenAI-compatible completion, and DSPACE displays the assistant text in the normal Chat panel.

DSPACE does **not** charge users for this default Chat path and does **not** ask users for
`token.place` credentials. There is no token.place API-key field in DSPACE settings.

## Default provider behavior

- New and reset saves default to token.place for `/chat`.
- `/chat` works without DSPACE auth, without an OpenAI key, and without a token.place key.
- OpenAI is still available as an optional bring-your-own-key provider from [/settings](/settings).
- If you switch to OpenAI, DSPACE uses the existing client-side OpenAI key storage. Switch back to
  token.place when you want the no-key default provider again.

## API v1 behavior and limits

DSPACE currently integrates with token.place by making direct HTTPS API v1 requests to
`/api/v1/chat/completions`. The request uses OpenAI-compatible `model` and `messages` fields and may
include only safe, optional metadata for DSPACE correlation. It never includes a token.place API key
or an OpenAI API key.

Known v3.1 limitation: token.place API v1 is non-streaming. Responses may appear only after the full
completion is ready, so the Chat loading state can last longer than a streamed response would.
DSPACE will move to the token.place npm package only after that package path is ready for this app.

## Deployment overrides

Most users never need to configure token.place. Operators can adjust deployment behavior with these
environment variables:

```bash
VITE_TOKEN_PLACE_URL=https://staging.token.place
VITE_TOKEN_PLACE_CHAT_MODEL=gpt-5-chat-latest
```

`VITE_TOKEN_PLACE_URL` defaults to `https://token.place` in production. `VITE_TOKEN_PLACE_CHAT_MODEL`
defaults to the model selected by the app for token.place Chat compatibility.
