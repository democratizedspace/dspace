<script>
    import { onMount } from 'svelte';
    import {
        DEFAULT_SETTINGS,
        loadGameState,
        ready,
        saveGameState,
        state,
    } from '../../utils/gameState/common.js';

    const SETTING_KEY = 'showQuestDependencyMap';

    let hydrated = false;
    let enabled = false;
    let saving = false;
    let errorMessage = '';
    let unsubscribe;

    const applySnapshot = (snapshot) => {
        enabled = Boolean(snapshot?.settings?.[SETTING_KEY]);
    };

    const persistSetting = async (nextValue) => {
        saving = true;
        errorMessage = '';

        try {
            const snapshot = loadGameState();
            snapshot.settings = {
                ...DEFAULT_SETTINGS,
                ...(snapshot.settings ?? {}),
                [SETTING_KEY]: nextValue,
            };
            await saveGameState(snapshot);
            enabled = nextValue;
        } catch (error) {
            console.error('Failed to save quest graph visibility setting', error);
            errorMessage = 'Unable to save this setting right now.';
        } finally {
            saving = false;
        }
    };

    const handleToggle = async () => {
        await persistSetting(!enabled);
    };

    onMount(async () => {
        await ready;
        applySnapshot(loadGameState());
        hydrated = true;

        unsubscribe = state.subscribe((snapshot) => applySnapshot(snapshot));

        return () => {
            unsubscribe?.();
        };
    });
</script>

<section class="settings-card" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Quest dependency graph</h2>
        <p>Show an interactive dependency map on the Quests page.</p>
    </div>

    <div class="toggle-row">
        <div class="label">
            <span class="title">Show quest dependency map on /quests</span>
            <span class="hint">Applies to this device.</span>
        </div>
        <button
            type="button"
            class:enabled
            class="toggle"
            aria-pressed={enabled}
            on:click={handleToggle}
            disabled={saving}
            data-testid="quest-graph-visibility-toggle"
        >
            <span aria-hidden="true" class="thumb"></span>
            <span class="state">{enabled ? 'On' : 'Off'}</span>
        </button>
    </div>

    {#if errorMessage}
        <p class="status error" role="alert">{errorMessage}</p>
    {/if}
</section>

<style>
    .settings-card {
        border: 1px solid #3aa650;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #123a1f, #0b2414);
        color: #e8f7ec;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
    }

    .heading {
        display: grid;
        gap: 0.25rem;
    }

    h2 {
        margin: 0;
        color: #e8f7ec;
    }

    p {
        margin: 0;
        color: #c7e6d0;
    }

    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid rgba(58, 166, 80, 0.5);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        background: rgba(58, 166, 80, 0.08);
    }

    .label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .title {
        font-weight: 700;
        color: #e8f7ec;
    }

    .hint {
        font-size: 0.9rem;
        color: #a9d8b5;
    }

    .toggle {
        position: relative;
        width: 86px;
        border-radius: 999px;
        border: 2px solid #3aa650;
        background: linear-gradient(90deg, rgba(58, 166, 80, 0.2), rgba(10, 49, 21, 0.6));
        color: #e8f7ec;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        cursor: pointer;
        transition:
            background-color 120ms ease-in-out,
            border-color 120ms ease-in-out,
            transform 120ms ease-in-out;
    }

    .toggle:focus-visible {
        outline: 2px solid #3aa650;
        outline-offset: 2px;
    }

    .toggle:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: #54c471;
        background: linear-gradient(90deg, rgba(58, 166, 80, 0.3), rgba(10, 49, 21, 0.8));
    }

    .toggle:disabled {
        opacity: 0.7;
        cursor: progress;
    }

    .toggle.enabled {
        background: linear-gradient(90deg, rgba(58, 166, 80, 0.45), rgba(10, 49, 21, 0.9));
        border-color: #54c471;
    }

    .thumb {
        position: relative;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #e8f7ec;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }

    .toggle.enabled .thumb {
        background: #b3f1c1;
    }

    .state {
        font-weight: 700;
    }

    .status {
        margin: 0;
        font-weight: 600;
    }

    .status.error {
        color: #ff9f9f;
    }
</style>
