<script>
    import { onMount } from 'svelte';
    import { calculateHydrationTime } from '../../utils/uiMetrics.js';

    export let environment = 'unknown';
    export let version = 'unknown';
    export let onlineText = 'Online';
    export let offlineText = 'Offline - changes will sync when connection restores';

    let online = true;
    let hydration = 0;
    let hydrated = false;

    function updateStatus() {
        if (typeof navigator !== 'undefined') {
            online = navigator.onLine;
        }
    }

    onMount(() => {
        const start = window.dspaceStart ?? performance.timing.navigationStart;
        hydration = calculateHydrationTime(start, performance.now());
        hydrated = true;

        updateStatus();
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
        };
    });
</script>

<section
    class="runtime-meta"
    data-testid="runtime-meta"
    data-hydrated={hydrated ? 'true' : 'false'}
    aria-label="Runtime metadata"
>
    <span class="meta-item build-pill">
        <span class="env">{environment}</span>
        <span>{version}</span>
    </span>
    <span class="meta-item" data-testid="connection-status">
        {#if online}
            {onlineText}
        {:else}
            {offlineText}
        {/if}
    </span>
    <span class="meta-item" data-testid="hydration-time">Hydration time: {Math.round(hydration)} ms</span>
</section>

<style>
    .runtime-meta {
        display: flex;
        gap: 0.65rem;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: wrap;
        font-size: 0.85rem;
        line-height: 1.2;
    }

    .meta-item {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .build-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        background-color: #f4f4f5;
    }

    .env {
        font-weight: 600;
        text-transform: lowercase;
    }
</style>
