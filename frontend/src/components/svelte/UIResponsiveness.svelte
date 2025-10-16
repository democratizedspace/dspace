<script>
    import { onMount } from 'svelte';
    import { calculateHydrationTime } from '../../utils/uiMetrics.js';

    export let startTime = 0;
    let hydration = 0;
    let hydrated = false;

    onMount(() => {
        const start = startTime || (window.dspaceStart ?? performance.timing.navigationStart);
        hydration = calculateHydrationTime(start, performance.now());
        hydrated = true;
    });
</script>

<div data-testid="hydration-time" data-hydrated={hydrated ? 'true' : 'false'}>
    Hydration time: {Math.round(hydration)} ms
</div>

<style>
    div {
        margin-top: 1rem;
        font-size: 0.9rem;
    }
</style>
