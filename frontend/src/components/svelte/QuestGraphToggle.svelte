<script>
    import { onMount } from 'svelte';
    import {
        loadGameState,
        ready,
        saveGameState,
        state as gameStateStore,
    } from '../../utils/gameState/common.js';
    import { normalizeSettings } from '../../utils/settingsDefaults.js';

    const SETTINGS_KEY = 'showQuestGraphVisualizer';

    let hydrated = false;
    let enabled = false;
    let loading = true;
    let unsubscribe;

    const syncFromState = (value) => {
        const normalized = normalizeSettings(value?.settings);
        enabled = normalized[SETTINGS_KEY];
    };

    onMount(async () => {
        await ready;
        const current = loadGameState();
        syncFromState(current);
        unsubscribe = gameStateStore.subscribe((value) => syncFromState(value));
        hydrated = true;
        loading = false;

        return () => {
            unsubscribe?.();
        };
    });

    const persistSetting = async (nextValue) => {
        await ready;
        const current = loadGameState();
        const normalized = normalizeSettings(current.settings);
        const nextSettings = {
            ...normalized,
            [SETTINGS_KEY]: Boolean(nextValue),
        };

        await saveGameState({
            ...current,
            settings: nextSettings,
        });
    };

    const toggle = async () => {
        const next = !enabled;
        enabled = next;
        await persistSetting(next);
    };
</script>

<section class="panel" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Quest dependency graph</h2>
        <p>Show an interactive dependency map on the Quests page.</p>
    </div>

    <label class="toggle">
        <div class="toggle__label">
            <span class="title">Show quest dependency map on /quests</span>
        </div>
        <button
            type="button"
            class="toggle__control"
            class:enabled={enabled}
            aria-pressed={enabled}
            aria-label="Show quest dependency map on the quests page"
            disabled={loading}
            on:click={toggle}
            data-testid="quest-graph-visualizer-toggle"
        >
            <span aria-hidden="true" class="toggle__thumb"></span>
            <span class="toggle__state">{enabled ? 'On' : 'Off'}</span>
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

    .toggle__control {
        position: relative;
        width: 70px;
        height: 36px;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        background: #0f172a;
        color: #cbd5e1;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
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
