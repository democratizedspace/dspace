---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE includes an optional [token.place](https://token.place) chat integration. The wiring is in
place today, but the provider is **disabled by default**, so OpenAI remains the active chat
provider unless you explicitly opt in.

The API endpoint defaults to `https://token.place/api`. Requests are sent to `${baseUrl}/chat` and
expect a JSON response with a `reply` field.

Enable token.place in one of these ways:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game state**: save `tokenPlace.enabled=true` in your game state (for example, via devtools or a
  custom settings screen). Optionally pair this with a custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL (or the opt-in flag) by resetting your game state or unsetting the
environment variable.

The `tokenPlaceChat` helper accepts an optional `AbortSignal` and surfaces descriptive service
errors when the provider is enabled.
