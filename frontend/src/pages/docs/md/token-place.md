---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE uses the [token.place](https://token.place) API for in-game AI features like chat.
The `tokenPlaceChat` utility sends messages to the service and returns the model's reply.

The API endpoint defaults to `https://token.place/api`, but token.place is **disabled by default**
to keep staging and local builds on OpenAI unless you explicitly opt in.

You can enable token.place in two ways:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game settings**: set a custom URL in your saved game state (automatically enables the feature).

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL by resetting your game state.

`tokenPlaceChat` accepts an optional `AbortSignal` and throws a descriptive error when the
service returns one, making failures easier to diagnose.
