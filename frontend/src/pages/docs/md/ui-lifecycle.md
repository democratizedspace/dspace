---
title: 'UI Lifecycle Overview'
slug: 'ui-lifecycle'
---

# UI Lifecycle Overview

DSPACE uses **Astro** for server-side rendering (SSR) and **Svelte** for interactive components.
Pages render HTML on the server and then hydrate on the client. Understanding this lifecycle is
crucial when developing or testing new components.

## Rendering flow

1. **Server render** – Astro renders HTML on the server. Interactive Svelte components output static
   markup at this stage.
2. **Hydration** – When the page loads in the browser, Astro hydrates Svelte components. Client-side
   code runs starting inside the `onMount` hook.
3. **Interactivity** – After hydration, the component can access browser APIs and respond to user
   input.

## Component pattern

To avoid hydration mismatches and make tests predictable, follow this pattern in every Svelte
component:

```svelte
<script>
    import { onMount } from 'svelte';
    let isClientSide = false;
    onMount(() => {
        isClientSide = true;
        // client-only initialization here
    });
</script>

<div data-hydrated={isClientSide ? 'true' : 'false'}>
    {#if isClientSide}
        <!-- interactive content -->
    {:else}
        <!-- server-rendered placeholder -->
    {/if}
</div>
```

- Use `onMount` for any code that depends on the browser environment.
- Include a `data-hydrated="true"` attribute once the component is ready. Tests wait for this
  attribute before interacting with the component.

## UI responsiveness metrics

The `<UIResponsiveness>` component (`frontend/src/components/svelte/UIResponsiveness.svelte`)
reports hydration time using the `startTime` prop when it is truthy; otherwise it falls back to
`window.dspaceStart ?? performance.timing.navigationStart` inside its `onMount` hook. The homepage
sets `window.dspaceStart = performance.now()` via an inline script in
`frontend/src/pages/index.astro`.

## Debugging tips

- Check the browser console for hydration warnings. They usually mean a mismatch between the
  server-rendered HTML and the hydrated component.
- When writing Playwright tests, wait for `[data-hydrated="true"]` before performing actions.
- If a component behaves differently in tests versus the browser, ensure initialization logic is
  wrapped in `onMount`.

For additional details on testing strategies, see the [Testing Guide](/docs/testing-guide) and the
broader [Developer Guide](https://github.com/democratizedspace/dspace/blob/main/DEVELOPER_GUIDE.md).
