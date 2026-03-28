<script>
    import { onMount } from 'svelte';
    import { calculateHydrationTime } from '../../utils/uiMetrics.js';

    export let startTime = 0;
    export let compact = false;
    let hydration = 0;
    let hydrated = false;

    onMount(() => {
        const start = startTime || (window.dspaceStart ?? performance.timing.navigationStart);
        hydration = calculateHydrationTime(start, performance.now());
        hydrated = true;
    });
</script>

<div
    data-testid="hydration-time"
    class="hydration-time"
    class:compact
    data-hydrated={hydrated ? 'true' : 'false'}
>
    Hydration time: {Math.round(hydration)} ms
</div>

<style>
    .hydration-time {
        margin-top: 1rem;
        font-size: 0.9rem;
    }

    .hydration-time.compact {
        margin-top: 0;
    }
</style>
