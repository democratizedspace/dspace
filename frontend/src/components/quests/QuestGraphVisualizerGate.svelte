<script>
    import { onDestroy, onMount } from 'svelte';
    import { loadGameState, ready, state } from '../../utils/gameState/common.js';

    export let graph;

    let showVisualizer = false;
    let Visualizer = null;
    let loadError = '';
    let unsubscribe;

    const importVisualizer = async () => {
        if (Visualizer) return;
        loadError = '';
        try {
            const module = await import('./QuestGraphVisualizer.svelte');
            Visualizer = module.default;
        } catch (error) {
            console.error('Failed to load QuestGraphVisualizer:', error);
            loadError = 'Unable to load quest dependency map.';
        }
    };

    const updateEnabled = (value) => {
        const next = Boolean(value);
        if (showVisualizer === next) return;
        showVisualizer = next;
        if (next) {
            importVisualizer();
        }
    };

    onMount(async () => {
        await ready;
        const initialState = loadGameState();
        updateEnabled(initialState.settings?.showQuestGraphVisualizer);

        unsubscribe = state.subscribe((currentState) => {
            updateEnabled(currentState?.settings?.showQuestGraphVisualizer);
        });
    });

    onDestroy(() => {
        unsubscribe?.();
    });
</script>

{#if showVisualizer && Visualizer}
    <svelte:component this={Visualizer} {graph} />
{:else if showVisualizer && loadError}
    <p class="visualizer-error">{loadError}</p>
{/if}

<style>
    .visualizer-error {
        color: #ff6b6b;
        margin: 12px 0;
    }
</style>
