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
        getLegacyV1SeedItems,
        getLegacyV2SeedItems,
        LEGACY_V1_SEED_PROFILES,
        LEGACY_V2_SEED_PROFILES,
        seedLegacyV1Save,
        seedLegacyV2LocalStorageSave,
    } from '../../utils/legacySaveSeeding';

    export let cheatsAvailable = false;

    let available = cheatsAvailable;
    let enabled = false;
    let hydrated = false;
    let workingAction = '';
    let statusMessage = '';
    let errorMessage = '';
    let lastSeedSummary = null;
    let v1Profile = LEGACY_V1_SEED_PROFILES[0]?.id ?? 'minimal';
    let v2Profile = LEGACY_V2_SEED_PROFILES[0]?.id ?? 'minimal';
    $: v1SeedItems = getLegacyV1SeedItems(v1Profile);
    $: v2SeedItems = getLegacyV2SeedItems(v2Profile);

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
            const summary = seedLegacyV1Save(v1Profile);
            lastSeedSummary = summary;
            statusMessage = `Seeded v1 ${summary.profileLabel}. Reloading…`;
            notifyLegacyUpgradeRefresh(true);
        });

    const seedV2Save = () =>
        withStatus('seed-v2', async () => {
            const summary = seedLegacyV2LocalStorageSave(v2Profile);
            lastSeedSummary = summary;
            statusMessage = `Seeded v2 ${summary.profileLabel}. Refreshing detection…`;
            notifyLegacyUpgradeRefresh(false);
        });

    const clearSeededSaves = () =>
        withStatus('clear-seeded', async () => {
            clearSeededLegacySaves();
            lastSeedSummary = null;
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
            <div class="qa-tools__seed-group">
                <label class="qa-tools__label">
                    <span class="qa-tools__label-text">V1 seed profile</span>
                    <select
                        bind:value={v1Profile}
                        class="qa-tools__select"
                        disabled={Boolean(workingAction)}
                    >
                        {#each LEGACY_V1_SEED_PROFILES as profile}
                            <option value={profile.id}>{profile.label}</option>
                        {/each}
                    </select>
                </label>
                <Chip
                    text={workingAction === 'seed-v1' ? 'Seeding v1…' : 'Seed v1 save'}
                    onClick={seedV1Save}
                    cheat={true}
                    disabled={Boolean(workingAction)}
                    dataTestId="qa-seed-v1"
                />
            </div>
            <div class="qa-tools__seed-group">
                <label class="qa-tools__label">
                    <span class="qa-tools__label-text">V2.1 seed profile</span>
                    <select
                        bind:value={v2Profile}
                        class="qa-tools__select"
                        disabled={Boolean(workingAction)}
                    >
                        {#each LEGACY_V2_SEED_PROFILES as profile}
                            <option value={profile.id}>{profile.label}</option>
                        {/each}
                    </select>
                </label>
                <Chip
                    text={workingAction === 'seed-v2' ? 'Seeding v2…' : 'Seed v2 save'}
                    onClick={seedV2Save}
                    cheat={true}
                    disabled={Boolean(workingAction)}
                    dataTestId="qa-seed-v2"
                />
            </div>
            <Chip
                text="Clear seeded legacy saves"
                onClick={clearSeededSaves}
                cheat={true}
                disabled={Boolean(workingAction)}
                dataTestId="qa-clear-seeded"
            />
        </div>
        <div class="qa-tools__seeded-items">
            <h4>V1 items in selected profile</h4>
            <p class="qa-tools__seeded-items-description">
                These are the v1 item cookies included with the selected seed profile and their v3
                migration targets.
            </p>
            {#if v1SeedItems.length}
                <ul class="qa-tools__seeded-items-list">
                    {#each v1SeedItems as item}
                        <li>
                            <span class="qa-tools__seeded-item-label">
                                v1 item-{item.v1Id} ({item.v1Name})
                            </span>
                            {#if item.v3Id === 'UNMAPPED'}
                                <span class="qa-tools__seeded-item-map">
                                    → UNMAPPED (v3 id: {item.v3Id})
                                </span>
                            {:else}
                                <span class="qa-tools__seeded-item-map">
                                    → v3 {item.v3Name} ({item.v3Id})
                                </span>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="qa-tools__summary-empty">None</p>
            {/if}
        </div>
        <div class="qa-tools__seeded-items">
            <h4>V2 items in selected profile</h4>
            <p class="qa-tools__seeded-items-description">
                These are the v2 inventory entries included with the selected seed profile, their
                quantities, and v3 migration targets.
            </p>
            {#if v2SeedItems.length}
                <ul class="qa-tools__seeded-items-list">
                    {#each v2SeedItems as item}
                        <li>
                            <span class="qa-tools__seeded-item-label">
                                v2 item-{item.v2Id} ({item.v2Name}) × {item.count}
                            </span>
                            {#if item.v3Id === 'UNMAPPED'}
                                <span class="qa-tools__seeded-item-map">
                                    → UNMAPPED (v3 id: {item.v3Id})
                                </span>
                            {:else}
                                <span class="qa-tools__seeded-item-map">
                                    → v3 {item.v3Name} ({item.v3Id})
                                </span>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="qa-tools__summary-empty">None</p>
            {/if}
        </div>
        {#if lastSeedSummary}
            <div class="qa-tools__summary">
                <h4>Last seeded profile</h4>
                <p class="qa-tools__summary-label">{lastSeedSummary.profileLabel}</p>
                <div class="qa-tools__summary-grid">
                    <div>
                        <p class="qa-tools__summary-title">Cookies written</p>
                        {#if lastSeedSummary.cookies.length}
                            <ul>
                                {#each lastSeedSummary.cookies as cookie}
                                    <li>{cookie}</li>
                                {/each}
                            </ul>
                        {:else}
                            <p class="qa-tools__summary-empty">None</p>
                        {/if}
                    </div>
                    <div>
                        <p class="qa-tools__summary-title">localStorage keys written</p>
                        {#if lastSeedSummary.localStorageKeys.length}
                            <ul>
                                {#each lastSeedSummary.localStorageKeys as key}
                                    <li>{key}</li>
                                {/each}
                            </ul>
                        {:else}
                            <p class="qa-tools__summary-empty">None</p>
                        {/if}
                    </div>
                </div>
            </div>
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
        gap: 0.75rem;
    }

    .qa-tools__seed-group {
        display: grid;
        gap: 0.4rem;
        padding: 0.75rem;
        border-radius: 10px;
        border: 1px solid rgba(59, 130, 246, 0.25);
        background: rgba(15, 23, 42, 0.4);
    }

    .qa-tools__label {
        display: grid;
        gap: 0.35rem;
        font-weight: 600;
        color: #e0f2ff;
    }

    .qa-tools__label-text {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #93c5fd;
    }

    .qa-tools__select {
        border-radius: 8px;
        border: 1px solid rgba(59, 130, 246, 0.4);
        background: rgba(15, 23, 42, 0.6);
        color: #e0f2ff;
        padding: 0.45rem 0.6rem;
        font-size: 0.95rem;
    }

    .qa-tools__seeded-items {
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.6);
        padding: 0.85rem;
        display: grid;
        gap: 0.5rem;
    }

    .qa-tools__seeded-items-description {
        margin: 0;
        color: #cbd5f5;
    }

    .qa-tools__seeded-items-list {
        margin: 0;
        padding-left: 1.2rem;
        display: grid;
        gap: 0.4rem;
        color: #e2e8f0;
    }

    .qa-tools__seeded-item-label {
        font-weight: 600;
        color: #bfdbfe;
    }

    .qa-tools__seeded-item-map {
        display: block;
        color: #fef3c7;
        font-size: 0.9rem;
    }

    .qa-tools__summary {
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.6);
        padding: 0.85rem;
        display: grid;
        gap: 0.5rem;
    }

    .qa-tools__summary-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .qa-tools__summary-label {
        margin: 0;
        font-weight: 700;
    }

    .qa-tools__summary-title {
        margin: 0 0 0.35rem 0;
        font-weight: 600;
        color: #bfdbfe;
    }

    .qa-tools__summary-empty {
        margin: 0;
        color: #94a3b8;
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
