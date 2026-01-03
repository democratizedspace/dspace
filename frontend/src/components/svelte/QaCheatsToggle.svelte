<script>
    import { onMount } from 'svelte';
    import {
        initializeQaCheats,
        qaCheatsAvailability,
        qaCheatsEnabled,
        setQaCheatsPreference,
    } from '../../lib/qaCheats';
    import Chip from './Chip.svelte';
    import {
        clearSeededLegacySaves,
        seedSampleV1CookieSave,
        seedSampleV2LocalStorageSave,
    } from '../../utils/legacySaveSeeding';

    export let cheatsAvailable = false;

    let available = cheatsAvailable;
    let enabled = false;
    let hydrated = false;
    let workingAction = '';
    let statusMessage = '';
    let errorMessage = '';

    let unsubscribeAvailability;
    let unsubscribeEnabled;

    const handleToggle = () => {
        setQaCheatsPreference(!enabled);
    };

    const notifyLegacyUpgradeRefresh = (shouldReload = false) => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('legacy-upgrade-refresh'));
        if (shouldReload) {
            window.setTimeout(() => window.location.reload(), 50);
        }
    };

    const withStatus = async (actionName, fn) => {
        workingAction = actionName;
        statusMessage = '';
        errorMessage = '';
        try {
            await fn();
        } catch (error) {
            errorMessage = error?.message ?? 'Unable to complete the requested legacy save action.';
        } finally {
            workingAction = '';
        }
    };

    const seedV1Save = () =>
        withStatus('seed-v1', async () => {
            seedSampleV1CookieSave();
            statusMessage = 'Seeded sample v1 cookie save. Reloading…';
            notifyLegacyUpgradeRefresh(true);
        });

    const seedV2Save = () =>
        withStatus('seed-v2', async () => {
            seedSampleV2LocalStorageSave();
            statusMessage = 'Seeded sample v2 localStorage save. Refreshing detection…';
            notifyLegacyUpgradeRefresh(false);
        });

    const clearSeededSaves = () =>
        withStatus('clear-seeded', async () => {
            clearSeededLegacySaves();
            statusMessage = 'Cleared seeded legacy saves. Reloading…';
            notifyLegacyUpgradeRefresh(true);
        });

    onMount(() => {
        initializeQaCheats(cheatsAvailable);

        unsubscribeAvailability = qaCheatsAvailability.subscribe((value) => {
            available = value;
        });
        unsubscribeEnabled = qaCheatsEnabled.subscribe((value) => {
            enabled = value;
        });

        hydrated = true;

        return () => {
            unsubscribeAvailability?.();
            unsubscribeEnabled?.();
        };
    });
</script>

{#if available}
    <section class="qa-cheats" data-hydrated={hydrated ? 'true' : 'false'}>
        <div class="heading">
            <h2>QA Cheats</h2>
            <p>
                Shows testing-only options like “Instant finish” for long-running processes.
                Settings are stored on this device.
            </p>
        </div>

        <label class="cheat-toggle">
            <div class="cheat-toggle__label">
                <span class="title">Enable QA cheats</span>
                <span class="hint">Available only in dev and staging builds.</span>
            </div>
            <button
                type="button"
                class:enabled
                class="cheat-toggle__control"
                aria-pressed={enabled}
                on:click={handleToggle}
                data-testid="qa-cheats-toggle"
            >
                <span aria-hidden="true" class="cheat-toggle__thumb"></span>
                <span class="cheat-toggle__state">{enabled ? 'On' : 'Off'}</span>
            </button>
        </label>
    </section>
{/if}
{#if available && enabled}
    <section class="qa-tools" data-hydrated={hydrated ? 'true' : 'false'}>
        <div class="qa-tools__heading">
            <h3>Legacy save seeding</h3>
            <p>
                Create or clear sample legacy saves to test the Legacy save upgrades flows. Actions
                refresh the page so detection reruns immediately.
            </p>
        </div>
        <div class="qa-tools__actions">
            <Chip
                text={workingAction === 'seed-v1' ? 'Seeding v1…' : 'Seed sample v1 save (cookies)'}
                onClick={seedV1Save}
                cheat={true}
                disabled={Boolean(workingAction)}
                dataTestId="qa-seed-v1"
            />
            <Chip
                text={workingAction === 'seed-v2'
                    ? 'Seeding v2…'
                    : 'Seed sample v2 save (localStorage)'}
                onClick={seedV2Save}
                cheat={true}
                disabled={Boolean(workingAction)}
                dataTestId="qa-seed-v2"
            />
            <Chip
                text="Clear seeded legacy saves"
                onClick={clearSeededSaves}
                cheat={true}
                disabled={Boolean(workingAction)}
                dataTestId="qa-clear-seeded"
            />
        </div>
        {#if statusMessage}
            <p class="status" role="status" aria-live="polite">{statusMessage}</p>
        {/if}
        {#if errorMessage}
            <p class="status error" role="alert">{errorMessage}</p>
        {/if}
    </section>
{/if}

<style>
    .qa-cheats {
        border: 1px solid #0ea5e9;
        border-radius: 12px;
        padding: 1.25rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #0b1f2e, #07131d);
        color: #e0f2ff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        color: #e0f2ff;
    }

    p {
        margin: 0;
        color: #c3dafe;
    }

    .cheat-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid rgba(14, 165, 233, 0.4);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        background: rgba(14, 165, 233, 0.08);
    }

    .cheat-toggle__label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .title {
        font-weight: 700;
        color: #e0f2ff;
    }

    .hint {
        font-size: 0.9rem;
        color: #93c5fd;
    }

    .cheat-toggle__control {
        position: relative;
        width: 86px;
        border-radius: 999px;
        border: 2px solid #38bdf8;
        background: linear-gradient(90deg, rgba(14, 165, 233, 0.2), rgba(8, 47, 73, 0.6));
        color: #e0f2ff;
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

    .cheat-toggle__control:focus-visible {
        outline: 2px solid #38bdf8;
        outline-offset: 2px;
    }

    .cheat-toggle__control:hover {
        transform: translateY(-1px);
    }

    .cheat-toggle__control.enabled {
        background: linear-gradient(90deg, rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.25));
        border-color: #a855f7;
        box-shadow:
            0 0 0 1px rgba(168, 85, 247, 0.4),
            0 8px 16px rgba(0, 0, 0, 0.35);
    }

    .cheat-toggle__thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.35);
    }

    .cheat-toggle__control.enabled .cheat-toggle__thumb {
        background: #a855f7;
        box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.35);
    }

    .cheat-toggle__state {
        font-weight: 700;
        letter-spacing: 0.02em;
    }

    .qa-tools {
        margin-top: 0.75rem;
        border: 1px dashed rgba(249, 115, 22, 0.6);
        border-radius: 10px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: rgba(15, 23, 42, 0.6);
    }

    .qa-tools__heading {
        display: grid;
        gap: 0.25rem;
    }

    .qa-tools h3 {
        margin: 0;
        color: #fed7aa;
    }

    .qa-tools p {
        margin: 0;
        color: #fef3c7;
    }

    .qa-tools__actions {
        display: grid;
        gap: 0.35rem;
    }

    .status {
        margin: 0;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        background: rgba(22, 163, 74, 0.2);
        color: #bbf7d0;
        border: 1px solid rgba(22, 163, 74, 0.6);
    }

    .status.error {
        background: rgba(239, 68, 68, 0.2);
        color: #fecdd3;
        border-color: rgba(239, 68, 68, 0.6);
    }
</style>
