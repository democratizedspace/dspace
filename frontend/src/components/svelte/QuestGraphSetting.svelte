<script>
    import { onMount } from 'svelte';
    import { DEFAULT_SETTINGS, ready, state } from '../../utils/gameState/common.js';
    import { getSettings, updateSettings } from '../../utils/settings.js';

    let enabled = DEFAULT_SETTINGS.showQuestGraphVisualizer;
    let hydrated = false;
    let saving = false;
    let unsubscribe;

    const syncFromState = (value) => {
        enabled = Boolean(
            value?.settings?.showQuestGraphVisualizer ?? DEFAULT_SETTINGS.showQuestGraphVisualizer
        );
    };

    const handleToggle = async () => {
        const nextValue = !enabled;
        enabled = nextValue;
        saving = true;

        try {
            await updateSettings({ showQuestGraphVisualizer: nextValue });
        } catch (error) {
            console.error('Failed to update quest dependency graph setting', error);
            enabled = !nextValue;
        } finally {
            saving = false;
        }
    };

    onMount(async () => {
        await ready;
        syncFromState(getSettings());
        unsubscribe = state.subscribe((value) => syncFromState(value));
        hydrated = true;

        return () => unsubscribe?.();
    });
</script>

<section class="quest-graph-setting" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="heading">
        <h2>Quest dependency graph</h2>
        <p id="quest-graph-description">Shows an interactive dependency map on the Quests page.</p>
    </div>

    <button
        type="button"
        class:enabled
        class="toggle"
        aria-pressed={enabled}
        aria-describedby="quest-graph-description"
        on:click={handleToggle}
        data-testid="quest-graph-visualizer-toggle"
        disabled={saving}
    >
        <span class="thumb" aria-hidden="true"></span>
        <span class="state">{enabled ? 'On' : 'Off'}</span>
    </button>
</section>

<style>
    .quest-graph-setting {
        border: 1px solid #22c55e;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0f1f12, #08150c);
        color: #ecfdf3;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    p {
        margin: 0;
        color: #bbf7d0;
    }

    .toggle {
        position: relative;
        width: 86px;
        border-radius: 999px;
        border: 2px solid #4ade80;
        background: linear-gradient(90deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.6));
        color: #ecfdf3;
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
        outline: 2px solid #4ade80;
        outline-offset: 2px;
    }

    .toggle:hover:not(:disabled) {
        transform: translateY(-1px);
    }

    .toggle:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .toggle.enabled {
        background: linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(22, 101, 52, 0.7));
        border-color: #22c55e;
    }

    .thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ecfdf3;
        transition: transform 120ms ease-in-out;
        transform: translateX(0);
    }

    .toggle.enabled .thumb {
        transform: translateX(20px);
    }

    .state {
        font-weight: 700;
    }

    @media (max-width: 540px) {
        .quest-graph-setting {
            flex-direction: column;
            align-items: flex-start;
        }

        .toggle {
            width: 100%;
            justify-content: center;
        }
    }
</style>
