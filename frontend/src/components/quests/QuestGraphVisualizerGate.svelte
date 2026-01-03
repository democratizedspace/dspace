<script>
    import { onMount } from 'svelte';
    import { DEFAULT_SETTINGS, ready, state } from '../../utils/gameState/common.js';

    export let graph;

    let showVisualizer = DEFAULT_SETTINGS.showQuestGraphVisualizer;
    let VisualizerComponent = null;
    let hydrated = false;
    let loading = false;

    $: showVisualizer = Boolean(
        $state?.settings?.showQuestGraphVisualizer ?? DEFAULT_SETTINGS.showQuestGraphVisualizer
    );

    const loadVisualizer = async () => {
        if (!showVisualizer || VisualizerComponent || loading || typeof window === 'undefined') {
            return;
        }

        loading = true;
        try {
            const module = await import('./QuestGraphVisualizer.svelte');
            VisualizerComponent = module.default;
        } catch (error) {
            console.error('Failed to load quest dependency graph visualizer', error);
        } finally {
            loading = false;
        }
    };

    onMount(async () => {
        await ready;
        hydrated = true;
        if (showVisualizer) {
            await loadVisualizer();
        }
    });

    $: if (hydrated && showVisualizer) {
        loadVisualizer();
    }
</script>

{#if hydrated && showVisualizer && VisualizerComponent}
    <svelte:component this={VisualizerComponent} {graph} />
{/if}
