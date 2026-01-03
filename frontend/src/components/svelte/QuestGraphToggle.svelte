<script>
    import { onDestroy, onMount } from 'svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameState,
    } from '../../utils/gameState/common.js';

    let enabled = false;
    let hydrated = false;
    let working = false;

    const syncFromState = (value) => {
        enabled = Boolean(value?.settings?.showQuestGraphVisualizer);
    };

    let unsubscribe;

    onMount(async () => {
        await ready;
        syncFromState(loadGameState());
        unsubscribe = gameState.subscribe(syncFromState);
        hydrated = true;

        return () => {
            unsubscribe?.();
        };
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    const togglePreference = async () => {
        if (working) return;
        working = true;
        await ready;

        const current = loadGameState();
        current.settings = current.settings || {};
        current.settings.showQuestGraphVisualizer = !enabled;
        await saveGameState(current);
        working = false;
    };
</script>

<section class="quest-graph" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Quest dependency graph</h2>
        <p>Shows an interactive dependency map on the Quests page.</p>
    </div>

    <label class="toggle">
        <div class="toggle__label">
            <span class="title">Show quest dependency map on /quests</span>
        </div>
        <button
            type="button"
            class:enabled
            class="toggle__control"
            aria-pressed={enabled}
            on:click={togglePreference}
            disabled={working}
            data-testid="quest-graph-toggle"
        >
            <span aria-hidden="true" class="toggle__thumb"></span>
            <span class="toggle__state">{enabled ? 'On' : 'Off'}</span>
        </button>
    </label>
</section>

<style>
    .quest-graph {
        border: 1px solid #22c55e;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0b1f0d, #07210c);
        color: #ecfdf3;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        color: #bbf7d0;
    }

    p {
        margin: 0;
        color: #dcfce7;
    }

    .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid rgba(34, 197, 94, 0.4);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        background: rgba(34, 197, 94, 0.08);
    }

    .toggle__label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .title {
        font-weight: 700;
        color: #bbf7d0;
    }

    .toggle__control {
        position: relative;
        width: 88px;
        height: 38px;
        border-radius: 9999px;
        border: 1px solid rgba(34, 197, 94, 0.6);
        background: rgba(34, 197, 94, 0.12);
        color: #bbf7d0;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle__control:focus-visible {
        outline: 2px solid #34d399;
        outline-offset: 2px;
    }

    .toggle__control:hover {
        background: rgba(34, 197, 94, 0.18);
    }

    .toggle__control.enabled {
        background: linear-gradient(135deg, #16a34a, #22c55e);
        color: #052e16;
        border-color: #34d399;
    }

    .toggle__thumb {
        position: absolute;
        left: 6px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #ecfdf3;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
    }

    .toggle__control.enabled .toggle__thumb {
        transform: translateX(42px);
        background: #052e16;
    }

    .toggle__state {
        font-size: 0.95rem;
    }

    .toggle__control:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>
