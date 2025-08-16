---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE uses the [token.place](https://token.place) API for in-game AI features like chat.
The `tokenPlaceChat` utility sends messages to the service and returns the model's reply.

The API endpoint defaults to `https://token.place/api`. You can override it with or without a trailing slash:

-   **Game settings**: set a custom URL in your saved game state.
-   **Environment variable**: set `VITE_TOKEN_PLACE_URL` when building or running tests.

```bash
VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL by resetting your game state. Trailing slashes are ignored.
