<script lang="ts">
    import { onMount } from 'svelte';
    import {
        clearLegacyV1CookieSave,
        clearLegacyV2LocalStorageSave,
        seedSampleV1CookieSave,
        seedSampleV2LocalStorageSave,
    } from '../../qa/legacySaveSeeding';
    import { initializeQaCheats, qaCheatsAvailability, qaCheatsEnabled } from '../../lib/qaCheats';

    export let cheatsAvailable = false;

    let available = cheatsAvailable;
    let enabled = false;
    let status = '';
    let error = '';
    let working = '';

    let unsubscribeAvailability: (() => void) | undefined;
    let unsubscribeEnabled: (() => void) | undefined;

    const resetMessages = () => {
        status = '';
        error = '';
    };

    const handleAction = (action: string, fn: () => boolean) => {
        resetMessages();
        working = action;
        try {
            const ok = fn();
            if (!ok) {
                error = 'Action failed. Confirm this environment supports QA cheats.';
            } else if (!error) {
                status = 'Done. Refreshing detection…';
            }
        } catch (err) {
            console.error(err);
            error =
                err instanceof Error && err.message
                    ? err.message
                    : 'Unable to complete the requested action.';
        } finally {
            working = '';
        }
    };

    const seedV1 = () => handleAction('v1', seedSampleV1CookieSave);
    const seedV2 = () => handleAction('v2', seedSampleV2LocalStorageSave);
    const clearSeeds = () =>
        handleAction('clear', () => {
            const clearedV1 = clearLegacyV1CookieSave({ refresh: false });
            const clearedV2 = clearLegacyV2LocalStorageSave({ refresh: false });
            if (clearedV1 || clearedV2) {
                window.location.reload();
                return true;
            }
            return false;
        });

    onMount(() => {
        initializeQaCheats(cheatsAvailable);

        unsubscribeAvailability = qaCheatsAvailability.subscribe((value) => {
            available = value;
        });
        unsubscribeEnabled = qaCheatsEnabled.subscribe((value) => {
            enabled = value;
        });

        return () => {
            unsubscribeAvailability?.();
            unsubscribeEnabled?.();
        };
    });
</script>

{#if available && enabled}
    <section class="legacy-seeding" data-testid="legacy-seeding-controls">
        <div class="legacy-seeding__header">
            <h3>Legacy save seeding</h3>
            <p>Quickly create importable v1 cookies or v2 localStorage data.</p>
        </div>
        <div class="legacy-seeding__actions">
            <button
                type="button"
                class="action"
                on:click={seedV1}
                disabled={Boolean(working)}
                data-testid="seed-v1-save"
            >
                {working === 'v1' ? 'Seeding v1…' : 'Seed sample v1 save (cookies)'}
            </button>
            <button
                type="button"
                class="action"
                on:click={seedV2}
                disabled={Boolean(working)}
                data-testid="seed-v2-save"
            >
                {working === 'v2' ? 'Seeding v2…' : 'Seed sample v2 save (localStorage)'}
            </button>
            <button
                type="button"
                class="action action--secondary"
                on:click={clearSeeds}
                disabled={Boolean(working)}
                data-testid="clear-legacy-seeds"
            >
                {working === 'clear' ? 'Clearing…' : 'Clear seeded legacy saves'}
            </button>
        </div>
        {#if status}
            <p class="legacy-seeding__status" role="status" aria-live="polite">{status}</p>
        {/if}
        {#if error}
            <p class="legacy-seeding__status legacy-seeding__status--error" role="alert">
                {error}
            </p>
        {/if}
    </section>
{/if}

<style>
    .legacy-seeding {
        border: 1px dashed #38bdf8;
        border-radius: 10px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: rgba(14, 165, 233, 0.06);
        color: #e0f2ff;
    }

    .legacy-seeding__header {
        display: grid;
        gap: 0.25rem;
    }

    h3 {
        margin: 0;
        color: #e0f2ff;
    }

    p {
        margin: 0;
        color: #c3dafe;
    }

    .legacy-seeding__actions {
        display: grid;
        gap: 0.5rem;
    }

    .action {
        border: 1px solid rgba(56, 189, 248, 0.6);
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(8, 47, 73, 0.5));
        color: #e0f2ff;
        border-radius: 8px;
        padding: 0.65rem 0.75rem;
        text-align: left;
        cursor: pointer;
        transition:
            transform 120ms ease,
            border-color 120ms ease;
    }

    .action:hover {
        transform: translateY(-1px);
        border-color: rgba(168, 85, 247, 0.8);
    }

    .action:disabled {
        cursor: not-allowed;
        opacity: 0.65;
        transform: none;
    }

    .action--secondary {
        border-color: rgba(100, 116, 139, 0.8);
        background: rgba(100, 116, 139, 0.15);
    }

    .legacy-seeding__status {
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        border: 1px solid #0ea5e9;
        background: rgba(14, 165, 233, 0.12);
        color: #dbeafe;
    }

    .legacy-seeding__status--error {
        border-color: #f87171;
        background: rgba(248, 113, 113, 0.1);
        color: #fecdd3;
    }
</style>
