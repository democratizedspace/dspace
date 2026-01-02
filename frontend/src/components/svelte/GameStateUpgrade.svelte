<script>
    import { onMount } from 'svelte';
    import Chip from './Chip.svelte';
    import {
        loadGameState,
        saveGameState,
        ready,
        isUsingLocalStorage,
    } from '../../utils/gameState/common.js';
    import {
        determineStateVersion,
        stateHasContent,
        normalizeToV3State,
        mergeGameStates,
        buildV1InventoryState,
    } from '../../utils/gameState/migrations.js';
    import { isBrowser } from '../../utils/ssr.js';

    export let v1CookieItems = [];

    let statusMessage = '';
    let legacyDescription = '';
    let currentDescription = '';
    let busy = false;
    let legacyState = null;
    let currentState = null;
    let hasCurrentData = false;
    let foundLegacy = false;

    const describeSources = ({ hasV1, hasV2 }) => {
        const sources = [];
        if (hasV1) sources.push('v1 cookies');
        if (hasV2) sources.push('v2 localStorage');
        return sources.join(' and ') || 'none';
    };

    const clearLegacyCookies = () => {
        if (!isBrowser) return;
        const cookieNames = (document.cookie || '')
            .split(';')
            .map((c) => c.trim().split('=')[0])
            .filter((name) => /^item-\d+$/.test(name));

        cookieNames.forEach((name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
    };

    const clearLegacyLocalStorage = () => {
        if (!isBrowser || isUsingLocalStorage()) return;
        try {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameStateBackup');
        } catch (err) {
            console.warn('Failed to clear legacy localStorage keys', err);
        }
    };

    const clearLegacy = () => {
        clearLegacyCookies();
        clearLegacyLocalStorage();
    };

    const describeState = (state) => {
        const version = determineStateVersion(state);
        const hasData = stateHasContent(state);
        const parts = [];
        parts.push(version === 'unknown' ? 'unknown version' : `v${version.slice(1)}`);
        parts.push(hasData ? 'with data' : 'empty');
        return parts.join(', ');
    };

    const loadLegacyState = () => {
        if (!isBrowser) return { state: null, description: describeSources({}) };

        let legacyV2;
        if (!isUsingLocalStorage()) {
            try {
                const legacyString = localStorage.getItem('gameState');
                if (legacyString) {
                    const parsed = JSON.parse(legacyString);
                    if (determineStateVersion(parsed) !== 'v3') {
                        legacyV2 = parsed;
                    }
                }
            } catch (err) {
                console.warn('Unable to read legacy v2 save from localStorage', err);
            }
        }

        const hasV2 = Boolean(legacyV2);
        const hasV1 = Array.isArray(v1CookieItems) && v1CookieItems.length > 0;
        let combinedLegacy = null;

        if (legacyV2) {
            combinedLegacy = normalizeToV3State(legacyV2);
        }

        if (hasV1) {
            const v1State = buildV1InventoryState(v1CookieItems);
            combinedLegacy = combinedLegacy ? mergeGameStates(combinedLegacy, v1State) : v1State;
        }

        const description = describeSources({ hasV1, hasV2 });
        return { state: combinedLegacy, description, hasV1, hasV2 };
    };

    const refresh = async () => {
        await ready;
        currentState = loadGameState();
        hasCurrentData = stateHasContent(currentState);
        currentDescription = describeState(currentState);

        const { state, description, hasV1, hasV2 } = loadLegacyState();
        legacyState = state;
        foundLegacy = Boolean(state);
        legacyDescription = foundLegacy
            ? `Found ${description}.`
            : 'No legacy saves detected in cookies or localStorage.';

        if (hasCurrentData && foundLegacy) {
            statusMessage =
                'Both legacy and current saves are present. Choose whether to merge, replace, or discard legacy data.';
        } else if (foundLegacy) {
            statusMessage =
                'Legacy save data is available. Upgrade it to v3 (IndexedDB) to continue playing.';
        } else {
            statusMessage =
                'Your save data is already using the current v3 format (IndexedDB). Nothing to do.';
        }
    };

    const persistState = async (nextState, message) => {
        if (!nextState) return;
        busy = true;
        statusMessage = 'Applying changes…';

        try {
            await saveGameState(normalizeToV3State(nextState));
            clearLegacy();
            await refresh();
            statusMessage = message;
        } catch (err) {
            console.error('Failed to apply migration', err);
            statusMessage = 'Migration failed. Please try again or contact support.';
        } finally {
            busy = false;
        }
    };

    const upgradeLegacy = () => {
        if (!legacyState) return;
        persistState(legacyState, 'Legacy save upgraded to v3 and stored in IndexedDB.');
    };

    const mergeLegacy = () => {
        if (!legacyState) return;
        const merged = mergeGameStates(currentState, legacyState);
        persistState(merged, 'Legacy save merged into your current v3 data.');
    };

    const replaceWithLegacy = () => {
        if (!legacyState) return;
        persistState(legacyState, 'Current v3 save replaced with legacy data and upgraded.');
    };

    const discardLegacy = () => {
        clearLegacy();
        statusMessage = 'Legacy data cleared. Your existing v3 save is unchanged.';
        refresh();
    };

    onMount(async () => {
        await refresh();
    });
</script>

<section class="panel">
    <div class="header">
        <h2>Legacy save upgrade</h2>
        <p>Convert DSPACE v1/v2 saves (cookies or localStorage) to the v3 IndexedDB format.</p>
    </div>

    <div class="status">
        <p>
            <strong>Current save:</strong>
            {currentDescription}
        </p>
        <p>
            <strong>Legacy data:</strong>
            {legacyDescription}
        </p>
    </div>

    <div class="actions">
        {#if foundLegacy}
            {#if hasCurrentData}
                <Chip text="Merge legacy into current" onClick={mergeLegacy} disabled={busy} />
                <Chip
                    text="Replace current with legacy"
                    onClick={replaceWithLegacy}
                    hazard={true}
                    disabled={busy}
                />
                <Chip
                    text="Discard legacy data"
                    onClick={discardLegacy}
                    inverted={true}
                    disabled={busy}
                />
            {:else}
                <Chip text="Upgrade legacy save to v3" onClick={upgradeLegacy} disabled={busy} />
                <Chip
                    text="Discard legacy data"
                    onClick={discardLegacy}
                    inverted={true}
                    disabled={busy}
                />
            {/if}
        {:else}
            <Chip text="No legacy data detected" disabled={true} inverted={true} />
        {/if}
    </div>

    {#if statusMessage}
        <p class="message" role="status" aria-live="polite">{statusMessage}</p>
    {/if}
</section>

<style>
    .panel {
        border: 1px solid #0ea5e9;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
        max-width: 640px;
        background: radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.18), transparent),
            radial-gradient(circle at 80% 0%, rgba(6, 182, 212, 0.14), transparent), #0b1320;
        color: #e2f3ff;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.38);
    }

    .header {
        display: grid;
        gap: 0.35rem;
    }

    h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    p {
        margin: 0;
    }

    .status {
        display: grid;
        gap: 0.35rem;
        background: rgba(255, 255, 255, 0.04);
        padding: 0.75rem 1rem;
        border-radius: 10px;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .message {
        color: #38bdf8;
        font-weight: 600;
    }

    @media (max-width: 640px) {
        .panel {
            padding: 1rem;
        }

        .actions {
            flex-direction: column;
            align-items: stretch;
        }

        nav {
            width: 100%;
        }

        nav button {
            width: 100%;
        }
    }
</style>
