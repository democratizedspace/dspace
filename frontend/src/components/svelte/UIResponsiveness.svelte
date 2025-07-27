<script>
    import { onMount } from 'svelte';
    import { calculateHydrationTime } from '../../utils/uiMetrics.js';

    export let startTime = 0;
    let hydration = 0;

    onMount(() => {
        const start = startTime || (window.dspaceStart ?? performance.timing.navigationStart);
        hydration = calculateHydrationTime(start, performance.now());
    });
</script>

<div data-testid="hydration-time">Hydration time: {Math.round(hydration)} ms</div>

<style>
    div {
        margin-top: 1rem;
        font-size: 0.9rem;
    }
</style>

