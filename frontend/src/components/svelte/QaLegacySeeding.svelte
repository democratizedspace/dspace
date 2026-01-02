<script>
    import { onMount } from 'svelte';
    import {
        clearSeededLegacySaves,
        seedSampleV1CookieSave,
        seedSampleV2LocalStorageSave,
    } from '../../dev/legacySaveSeeding';
    import {
        initializeQaCheats,
        qaCheatsAvailability,
        qaCheatsEnabled,
    } from '../../lib/qaCheats';
    import Chip from './Chip.svelte';

    export let cheatsAvailable = false;

    let available = cheatsAvailable;
    let enabled = false;
    let hydrated = false;
    let statusMessage = '';
    let errorMessage = '';
    let working = '';

    const reloadForDetection = () => {
        if (typeof window === 'undefined') return;
        window.location.reload();
    };

    const runAction = (actionName, action, successMessage) => {
        if (working) return;
        statusMessage = '';
        errorMessage = '';
        working = actionName;
        try {
            const ok = action();
            if (!ok) {
                errorMessage =
                    'Unable to update legacy saves in this environment. Try again in the browser.';
                return;
            }
            statusMessage = successMessage;
            setTimeout(reloadForDetection, 50);
        } catch (error) {
            errorMessage =
                error?.message ?? 'Something went wrong while seeding legacy saves for QA.';
            console.error(error);
        } finally {
            working = '';
        }
    };

    const handleSeedV1 = () =>
        runAction('seed-v1', seedSampleV1CookieSave, 'Seeded sample v1 cookies. Reloading…');
    const handleSeedV2 = () =>
        runAction(
            'seed-v2',
            seedSampleV2LocalStorageSave,
            'Seeded sample v2 localStorage save. Reloading…'
        );
    const handleClearSeeds = () =>
        runAction('clear-seeds', clearSeededLegacySaves, 'Cleared seeded legacy saves. Reloading…');

    onMount(() => {
        initializeQaCheats(cheatsAvailable);

        const unsubscribeAvailability = qaCheatsAvailability.subscribe((value) => {
            available = value;
            if (!value) {
                enabled = false;
            }
        });

        const unsubscribeEnabled = qaCheatsEnabled.subscribe((value) => {
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
            <div>
                <h3>Legacy save seeding</h3>
                <p>
                    Dev/staging only: create sample legacy saves so you can exercise the upgrade
                    flows without external tools.
                </p>
            </div>
            <p class="note">
                Seeds mimic v1 cookies and v2 localStorage saves from historical releases.
            </p>
        </div>

        {#if enabled}
            <div class="actions">
                <Chip
                    text={working === 'seed-v1' ? 'Seeding v1…' : 'Seed sample v1 save (cookies)'}
                    onClick={handleSeedV1}
                    inverted={true}
                    disabled={Boolean(working)}
                    data-testid="qa-seed-v1"
                />
                <Chip
                    text={working === 'seed-v2'
                        ? 'Seeding v2…'
                        : 'Seed sample v2 save (localStorage)'}
                    onClick={handleSeedV2}
                    inverted={true}
                    disabled={Boolean(working)}
                    data-testid="qa-seed-v2"
                />
                <Chip
                    text={
                        working === 'clear-seeds' ? 'Clearing legacy seeds…' : 'Clear legacy saves'
                    }
                    onClick={handleClearSeeds}
                    hazard={true}
                    disabled={Boolean(working)}
                    data-testid="qa-clear-legacy"
                />
            </div>
        {:else}
            <p class="muted">Enable QA cheats above to access the legacy seeding tools.</p>
        {/if}

        {#if statusMessage}
            <p class="status" role="status" aria-live="polite">{statusMessage}</p>
        {/if}
        {#if errorMessage}
            <p class="status error" role="alert">{errorMessage}</p>
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

    .note {
        color: #93c5fd;
        font-size: 0.95rem;
    }

    .actions {
        display: grid;
        gap: 0.5rem;
    }

    .muted {
        color: #9ca3af;
    }

    .status {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        background: #0b3a1f;
        color: #bbf7d0;
        border: 1px solid #15803d;
    }

    .status.error {
        background: #3b0a0f;
        color: #fecdd3;
        border-color: #be123c;
    }
</style>
