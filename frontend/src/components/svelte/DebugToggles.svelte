<script>
    import { onDestroy, onMount } from 'svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameStateStore,
    } from '../../utils/gameState/common.js';
    import { normalizeSettings } from '../../utils/settingsDefaults.js';

    const TOGGLES = [
        {
            key: 'showQuestGraphVisualizer',
            title: 'Show quest dependency map on /quests',
            description: 'Show an interactive dependency map on the Quests page.',
            ariaLabel: 'Show quest dependency map on the quests page',
            testId: 'quest-graph-visualizer-toggle',
        },
        {
            key: 'showChatDebugData',
            title: 'Show full chat payload on /chat',
            description:
                'Highlight the RAG context and main messages that power the chat prompt.',
            ariaLabel: 'Show debug chat payload on the chat page',
            testId: 'chat-debug-toggle',
        },
    ];

    let hydrated = false;
    let enabled = {
        showQuestGraphVisualizer: false,
        showChatDebugData: false,
    };
    let loading = true;
    let unsubscribe;

    const syncFromState = (value) => {
        const normalized = normalizeSettings(value?.settings);
        enabled = {
            showQuestGraphVisualizer: normalized.showQuestGraphVisualizer,
            showChatDebugData: normalized.showChatDebugData,
        };
    };

    onMount(async () => {
        await ready;
        const current = loadGameState();
        syncFromState(current);
        unsubscribe = gameStateStore.subscribe((value) => syncFromState(value));
        hydrated = true;
        loading = false;
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    const persistSetting = async (key, nextValue) => {
        await ready;
        const current = loadGameState();
        const normalized = normalizeSettings(current.settings);
        const nextSettings = {
            ...normalized,
            [key]: Boolean(nextValue),
        };

        await saveGameState({
            ...current,
            settings: nextSettings,
        });
    };

    const toggle = async (key) => {
        const next = !enabled[key];
        enabled = { ...enabled, [key]: next };
        await persistSetting(key, next);
    };
</script>

<section class="panel" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Debug</h2>
        <p>Enable debug overlays and tooling for testing and validation.</p>
    </div>

    {#each TOGGLES as toggleItem (toggleItem.key)}
        <label class="toggle">
            <div class="toggle__label">
                <span class="title">{toggleItem.title}</span>
                <span class="description">{toggleItem.description}</span>
            </div>
            <button
                type="button"
                class="toggle__control"
                class:enabled={enabled[toggleItem.key]}
                aria-pressed={enabled[toggleItem.key]}
                aria-label={toggleItem.ariaLabel}
                disabled={loading}
                on:click={() => toggle(toggleItem.key)}
                data-testid={toggleItem.testId}
            >
                <span aria-hidden="true" class="toggle__thumb"></span>
                <span class="toggle__state">{enabled[toggleItem.key] ? 'On' : 'Off'}</span>
            </button>
        </label>
    {/each}
</section>

<style>
    .panel {
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0b1221, #0d1828);
        color: #e2e8f0;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        color: #e2e8f0;
    }

    p {
        margin: 0;
        color: #cbd5e1;
    }

    .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        background: rgba(15, 23, 42, 0.65);
    }

    .toggle__label {
        display: grid;
        gap: 0.25rem;
    }

    .title {
        font-weight: 600;
        color: #e2e8f0;
    }

    .description {
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .toggle__control {
        position: relative;
        width: 70px;
        height: 36px;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        background: #0f172a;
        color: #cbd5e1;
        cursor: pointer;
        transition:
            background 0.2s ease,
            border-color 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        box-sizing: border-box;
        font-weight: 600;
    }

    .toggle__control:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .toggle__control.enabled {
        background: #0ea5e9;
        border-color: #38bdf8;
        color: #0b1221;
    }

    .toggle__thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: #e2e8f0;
        transition: transform 0.2s ease;
    }

    .toggle__control.enabled .toggle__thumb {
        transform: translateX(34px);
        background: #0b1221;
    }

    .toggle__state {
        position: relative;
        z-index: 1;
        font-size: 0.9rem;
        margin-left: auto;
    }
</style>
