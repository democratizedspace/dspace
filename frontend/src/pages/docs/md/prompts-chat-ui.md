---
title: 'Chat UI Prompts'
slug: 'prompts-chat-ui'
---

# Chat UI prompts for the _dspace_ repo

DSPACE's chat experience is built with Astro pages and hydrated Svelte components. Use this
prompt when modernizing the chat interface to resemble contemporary assistants like ChatGPT or
Claude. Focus on `frontend/src/pages/index.astro` for the shell and related components under
`frontend/src/components` and `frontend/src/lib`.

## Goals

-   Present messages in tidy bubbles with clear separation between user and system output.
-   Keep the input field pinned to the bottom with a prominent send button and `Enter` binding.
-   Support light and dark themes with accessible color contrast and readable fonts.
-   Provide typing indicators or streamed responses to mimic real-time chat behavior.

## Patterns

-   Prefer semantic HTML (`<main>`, `<form>`, `<section>`) and label chat logs with `aria-live`.
-   Hydrate Svelte pieces with `client:idle` and mark roots with `data-hydrated="true"`.
-   Defer heavy scripts and images, and respect `prefers-reduced-motion` for animations.
-   Use CSS variables or Tailwind utilities for theme tokens rather than hard-coded values.

> **TL;DR**
>
> 1. Touch only files under `frontend/` related to the chat UI.
> 2. Align the layout and interaction model with modern chatbots.
> 3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 4. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 5. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before
committing.

USER:
1. Refine the chat interface in `frontend/src/pages/index.astro` and supporting components.
2. Match the UX of contemporary chat assistants.
3. Keep components accessible and responsive.
4. Run the checks above and scan staged changes for secrets.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request improving the chat UI with passing checks.
```
