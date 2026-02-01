<script>
    import { onDestroy, onMount } from 'svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameStateStore,
    } from '../../utils/gameState/common.js';
    import { normalizeSettings } from '../../utils/settingsDefaults.js';
    import { CHAT_PROMPT_VERSION } from '../../utils/openAI.js';

    const QUEST_GRAPH_KEY = 'showQuestGraphVisualizer';
    const CHAT_DEBUG_KEY = 'showChatDebugPayload';

    let hydrated = false;
    let questGraphEnabled = false;
    let chatDebugEnabled = false;
    let loading = true;
    let unsubscribe;
    const appSha = CHAT_PROMPT_VERSION.split(':')[1] || CHAT_PROMPT_VERSION;

    const syncFromState = (value) => {
        const normalized = normalizeSettings(value?.settings);
        questGraphEnabled = normalized[QUEST_GRAPH_KEY];
        chatDebugEnabled = normalized[CHAT_DEBUG_KEY];
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

    const toggleQuestGraph = async () => {
        const next = !questGraphEnabled;
        questGraphEnabled = next;
        await persistSetting(QUEST_GRAPH_KEY, next);
    };

    const toggleChatDebug = async () => {
        const next = !chatDebugEnabled;
        chatDebugEnabled = next;
        await persistSetting(CHAT_DEBUG_KEY, next);
    };
</script>

<section class="panel" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Debug</h2>
        <p>Optional debugging tools for inspecting DSPACE behavior.</p>
        <div class="debug-meta">
            <span>Prompt version: {CHAT_PROMPT_VERSION}</span>
            <span>App SHA: {appSha}</span>
        </div>
    </div>

    <label class="toggle">
        <div class="toggle__label">
            <span class="title">Show quest dependency map on /quests</span>
            <span class="subtitle">Interactive dependency map for quests.</span>
        </div>
        <button
            type="button"
            class="toggle__control"
            class:enabled={questGraphEnabled}
            aria-pressed={questGraphEnabled}
            aria-label="Show quest dependency map on the quests page"
            disabled={loading}
            on:click={toggleQuestGraph}
            data-testid="quest-graph-visualizer-toggle"
        >
            <span aria-hidden="true" class="toggle__thumb"></span>
            <span class="toggle__state">{questGraphEnabled ? 'On' : 'Off'}</span>
        </button>
    </label>

    <label class="toggle">
        <div class="toggle__label">
            <span class="title">Show chat prompt debug on /chat</span>
            <span class="subtitle">Highlights RAG content and main prompt inputs.</span>
        </div>
        <button
            type="button"
            class="toggle__control"
            class:enabled={chatDebugEnabled}
            aria-pressed={chatDebugEnabled}
            aria-label="Show chat prompt debug on the chat page"
            disabled={loading}
            on:click={toggleChatDebug}
            data-testid="chat-debug-prompt-toggle"
        >
            <span aria-hidden="true" class="toggle__thumb"></span>
            <span class="toggle__state">{chatDebugEnabled ? 'On' : 'Off'}</span>
        </button>
    </label>
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

    .debug-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
        color: #94a3b8;
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

    .subtitle {
        font-size: 0.85rem;
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
