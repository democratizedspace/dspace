<script>
    import { onMount } from 'svelte';
    import Chip from './Chip.svelte';
    import {
        buildV2StateFromV1Items,
        discardLegacyLocalState,
        mergeGameStates,
        normalizeToV3State,
        VERSIONS,
    } from '../../utils/gameState.js';
    import {
        getPersistedStateSnapshots,
        loadGameState,
        ready,
        saveGameState,
    } from '../../utils/gameState/common.js';
    import { clearItemCookies, getCookieItems } from '../../utils/migrationCookies.js';

    export let initialV1Items = [];

    let legacyV1Items = initialV1Items;
    let legacyV2State;
    let currentV3State;
    let usingLocalStorageFallback = false;
    let statusMessage = '';
    let errorMessage = '';
    let busyAction = '';

    const setMessage = (message) => {
        statusMessage = message;
        errorMessage = '';
    };

    const setError = (message) => {
        statusMessage = '';
        errorMessage = message;
    };

    const refreshDetection = async () => {
        await ready;
        const cookieString = typeof document !== 'undefined' ? document.cookie : '';
        legacyV1Items = getCookieItems(cookieString);

        const snapshots = await getPersistedStateSnapshots();
        usingLocalStorageFallback = snapshots.usingLocalStorage;

        const indexedVersion = snapshots.indexedDbState?.versionNumberString;
        const localVersion = snapshots.localState?.versionNumberString;

        legacyV2State =
            snapshots.indexedDbState && (!indexedVersion || indexedVersion === VERSIONS.V2)
                ? snapshots.indexedDbState
                : snapshots.localState &&
                  (!localVersion || localVersion === VERSIONS.V2) &&
                  snapshots.localState;

        currentV3State =
            snapshots.indexedDbState && indexedVersion === VERSIONS.V3
                ? snapshots.indexedDbState
                : snapshots.localState && localVersion === VERSIONS.V3
                  ? snapshots.localState
                  : undefined;

        if (!legacyV1Items.length && !legacyV2State) {
            setMessage('No legacy saves detected.');
        } else {
            setMessage('Legacy data detected — choose how to migrate.');
        }
    };

    const updateState = async (nextState, { clearV1Cookies = false } = {}) => {
        await ready;
        await saveGameState(normalizeToV3State(nextState));

        if (clearV1Cookies) {
            clearItemCookies();
        }
        await refreshDetection();
    };

    const buildLegacyV1State = () => normalizeToV3State(buildV2StateFromV1Items(legacyV1Items));

    const resolveLegacySource = () => {
        if (legacyV2State) return normalizeToV3State(legacyV2State);
        if (legacyV1Items.length) return buildLegacyV1State();
        return undefined;
    };

    const mergeLegacyIntoCurrent = async () => {
        if (!legacyV1Items.length && !legacyV2State) {
            setError('No legacy data to merge.');
            return;
        }
        busyAction = 'merge';
        try {
            await ready;
            const incoming = resolveLegacySource();
            const base = currentV3State ?? loadGameState();
            await updateState(mergeGameStates(base, incoming), {
                clearV1Cookies: legacyV1Items.length > 0,
            });
            setMessage('Legacy data merged into your current v3 save.');
        } catch (err) {
            console.error('Failed to merge legacy data', err);
            setError('Unable to merge legacy data. Please try again.');
        } finally {
            busyAction = '';
        }
    };

    const replaceWithLegacy = async () => {
        const confirmed =
            typeof window === 'undefined' ||
            window.confirm('Replace the current v3 save with legacy data?');
        if (!confirmed) return;

        busyAction = 'replace';
        try {
            const incoming = resolveLegacySource();
            if (!incoming) {
                setError('No legacy save is available to replace the current state.');
                busyAction = '';
                return;
            }
            await updateState(incoming, { clearV1Cookies: legacyV1Items.length > 0 });
            setMessage('Replaced current save with legacy data and upgraded to v3.');
        } catch (err) {
            console.error('Failed to replace v3 data with legacy state', err);
            setError('Unable to replace the current save. Please try again.');
        } finally {
            busyAction = '';
        }
    };

    const upgradeSingleSource = async (source) => {
        busyAction = source;
        try {
            if (source === 'v1' && legacyV1Items.length) {
                await updateState(buildLegacyV1State(), { clearV1Cookies: true });
                setMessage('Upgraded v1 save to v3 and cleared legacy cookies.');
            } else if (source === 'v2' && legacyV2State) {
                await updateState(normalizeToV3State(legacyV2State));
                setMessage('Upgraded v2 save to v3 storage.');
            } else {
                setError('No matching legacy data found to upgrade.');
            }
        } catch (err) {
            console.error('Failed to upgrade legacy data', err);
            setError('Unable to upgrade the legacy save. Please try again.');
        } finally {
            busyAction = '';
        }
    };

    const discardLegacyData = async () => {
        busyAction = 'discard';
        try {
            if (legacyV1Items.length) {
                clearItemCookies();
            }
            if (legacyV2State) {
                discardLegacyLocalState();
            }
            await refreshDetection();
            setMessage('Legacy save data removed. Your v3 save was left untouched.');
        } catch (err) {
            console.error('Failed to discard legacy data', err);
            setError('Unable to discard legacy data right now.');
        } finally {
            busyAction = '';
        }
    };

    onMount(() => {
        refreshDetection();
    });

    $: hasLegacy = legacyV1Items.length > 0 || !!legacyV2State;
    $: hasV3 = !!currentV3State;
    $: conflict = hasLegacy && hasV3;
    $: showV1Upgrade = legacyV1Items.length > 0;
    $: showV2Upgrade = !!legacyV2State;
</script>

<section class="migration">
    <div class="header">
        <div>
            <h2>Game save upgrades</h2>
            <p>
                Detects DSPACE v1 cookie saves and v2 <code>localStorage</code> saves, then upgrades them
                into the v3 IndexedDB format.
            </p>
        </div>
        <Chip
            text="Re-run detection"
            onClick={refreshDetection}
            disabled={busyAction !== ''}
            inverted={true}
        />
    </div>

    <div class="status-grid">
        <div class="card">
            <p class="label">v1 cookies</p>
            <p class="value">
                {legacyV1Items.length ? `${legacyV1Items.length} item cookies found` : 'Not found'}
            </p>
        </div>
        <div class="card">
            <p class="label">v2 localStorage</p>
            <p class="value">{legacyV2State ? 'Legacy save detected' : 'Not found'}</p>
        </div>
        <div class="card">
            <p class="label">v3 storage</p>
            <p class="value">{hasV3 ? 'Active' : 'No v3 save yet'}</p>
            {#if usingLocalStorageFallback}
                <p class="hint">IndexedDB unavailable—currently using localStorage.</p>
            {/if}
        </div>
    </div>

    {#if conflict}
        <div class="notice">
            <p>
                Legacy data and a v3 save were both found. Choose whether to merge, replace the v3
                save with the legacy data, or delete the legacy copy.
            </p>
        </div>
        <div class="actions">
            <Chip
                text="Merge legacy into current"
                onClick={mergeLegacyIntoCurrent}
                disabled={busyAction !== ''}
            />
            <Chip
                text="Replace v3 with legacy"
                onClick={replaceWithLegacy}
                disabled={busyAction !== ''}
                hazard={true}
            />
            <Chip
                text="Delete legacy data"
                onClick={discardLegacyData}
                disabled={busyAction !== ''}
                inverted={true}
            />
        </div>
    {:else}
        <div class="actions">
            {#if showV1Upgrade}
                <Chip
                    text="Upgrade v1 save to v3"
                    onClick={() => upgradeSingleSource('v1')}
                    disabled={busyAction !== ''}
                />
            {/if}
            {#if showV2Upgrade}
                <Chip
                    text="Upgrade v2 save to v3"
                    onClick={() => upgradeSingleSource('v2')}
                    disabled={busyAction !== ''}
                />
            {/if}
            {#if !hasLegacy}
                <p class="hint">No legacy saves detected on this device.</p>
            {/if}
        </div>
    {/if}

    {#if statusMessage}
        <p class="status" role="status" aria-live="polite">{statusMessage}</p>
    {:else if errorMessage}
        <p class="error" role="alert">{errorMessage}</p>
    {/if}
</section>

<style>
    .migration {
        border: 1px solid #1f2937;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
        background: linear-gradient(135deg, #0b1220, #0e1a2e);
        color: #e5e7eb;
        max-width: 900px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }

    h2 {
        margin: 0 0 0.25rem 0;
        font-size: 1.2rem;
    }

    p {
        margin: 0;
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
    }

    .card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid #1f2937;
        border-radius: 10px;
        padding: 0.75rem;
        display: grid;
        gap: 0.25rem;
    }

    .label {
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.8rem;
        color: #9ca3af;
    }

    .value {
        font-weight: 600;
        color: #f9fafb;
    }

    .hint {
        color: #9ca3af;
    }

    .notice {
        border-left: 4px solid #fcd34d;
        background: rgba(252, 211, 77, 0.08);
        padding: 0.75rem;
        border-radius: 8px;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
    }

    .status {
        color: #34d399;
        font-weight: 600;
    }

    .error {
        color: #f87171;
        font-weight: 600;
    }

    @media (max-width: 640px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
        }
    }
</style>
