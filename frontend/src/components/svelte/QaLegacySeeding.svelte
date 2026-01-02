<script>
    import { onMount } from 'svelte';
    import {
        clearLegacyV1CookieSave,
        clearLegacyV2LocalStorageSave,
        refreshLegacyDetection,
        seedSampleV1CookieSave,
        seedSampleV2LocalStorageSave,
    } from '../../qa/legacySaveSeeding';
    import {
        initializeQaCheats,
        qaCheatsAvailability,
        qaCheatsEnabled,
    } from '../../lib/qaCheats';
    import Chip from './Chip.svelte';

    let available = false;
    let enabled = false;
    let hydrated = false;
    let statusMessage = '';
    let workingAction = '';

    let unsubscribeAvailability;
    let unsubscribeEnabled;

    const withRefresh = async (actionName, fn) => {
        if (!enabled) {
            statusMessage = 'Enable QA cheats to seed legacy saves.';
            return;
        }

        workingAction = actionName;
        statusMessage = '';
        try {
            const success = await fn();
            statusMessage =
                success === false
                    ? 'No changes were written. Confirm this browser allows storage.'
                    : 'Done! Refreshing legacy detection…';
        } catch (error) {
            console.error(error);
            statusMessage = error?.message ?? 'Unable to complete legacy save action.';
        } finally {
            workingAction = '';
            // Reload so the legacy upgrade card re-runs detection with the seeded data.
            setTimeout(() => refreshLegacyDetection(), 25);
        }
    };

    const seedV1 = () => withRefresh('seed-v1', seedSampleV1CookieSave);
    const seedV2 = () => withRefresh('seed-v2', seedSampleV2LocalStorageSave);
    const clearSeeds = () =>
        withRefresh('clear-seeds', () => {
            clearLegacyV1CookieSave();
            clearLegacyV2LocalStorageSave();
            return true;
        });

    onMount(() => {
        initializeQaCheats();

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
    <section class="qa-legacy" data-hydrated={hydrated ? 'true' : 'false'}>
        <div class="heading">
            <h3>Legacy save seeding</h3>
            <p>
                Create sample legacy saves for QA only. Buttons are hidden on production builds and
                require QA cheats to be enabled.
            </p>
        </div>

        {#if !enabled}
            <p class="muted">Enable QA cheats above to access seeding tools.</p>
        {/if}

        <div class="actions">
            <Chip
                text={workingAction === 'seed-v1' ? 'Seeding v1…' : 'Seed sample v1 save (cookies)'}
                onClick={seedV1}
                disabled={!enabled || Boolean(workingAction)}
                inverted={true}
            />
            <Chip
                text={workingAction === 'seed-v2' ? 'Seeding v2…' : 'Seed sample v2 save (localStorage)'}
                onClick={seedV2}
                disabled={!enabled || Boolean(workingAction)}
                inverted={true}
            />
            <Chip
                text={workingAction === 'clear-seeds' ? 'Clearing…' : 'Clear seeded legacy saves'}
                onClick={clearSeeds}
                disabled={!enabled || Boolean(workingAction)}
                hazard={true}
            />
        </div>

        {#if statusMessage}
            <p class="status" role="status" aria-live="polite">{statusMessage}</p>
        {/if}
    </section>
{/if}

<style>
    .qa-legacy {
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

    h3 {
        margin: 0;
        color: #e0f2ff;
    }

    p {
        margin: 0;
        color: #c3dafe;
    }

    .muted {
        color: #93c5fd;
    }

    .actions {
        display: grid;
        gap: 0.5rem;
    }

    .status {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        background: #0b3a1f;
        color: #bbf7d0;
        border: 1px solid #15803d;
    }
</style>
