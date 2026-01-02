<script>
    import { onMount } from 'svelte';
    import Chip from './Chip.svelte';
    import {
        ready,
        loadGameState,
        saveGameState,
        isGameStateReady,
    } from '../../utils/gameState/common.js';
    import { VERSIONS } from '../../utils/gameState.js';
    import {
        LEGACY_LOCAL_STORAGE_KEYS,
        applyItemsToState,
        clearLegacyLocalStorage,
        hasGameProgress,
        mergeGameStates,
        normalizeStateVersion,
        readLegacyLocalStorageState,
    } from '../../utils/legacySaves.js';
    import { isBrowser } from '../../utils/ssr.js';
    import items from '../../pages/inventory/json/items';

    const EARLY_ADOPTER_ID = items.find((item) => item.name === 'Early Adopter Token')?.id;

    export let v1Items = [];

    let hasV1Cookies = v1Items.length > 0;
    let legacyV2State = null;
    let v3State = null;
    let status = '';
    let busy = false;
    let parseError = '';

    const refreshStateSnapshots = async () => {
        if (!isBrowser) return;

        await ready;
        v3State = loadGameState();

        const { state, error } = readLegacyLocalStorageState();
        legacyV2State = state;
        parseError = error ? 'Could not read legacy v2 save from localStorage.' : '';

        hasV1Cookies = Array.isArray(v1Items) && v1Items.length > 0;
    };

    const clearV1Cookies = () => {
        if (typeof document === 'undefined') return;
        const names = new Set(v1Items.map((item) => `item-${item.id}`));

        names.forEach((name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
    };

    const updateStatus = (message) => {
        status = message;
    };

    const guard = async (fn) => {
        if (busy) return;
        busy = true;
        status = '';
        try {
            await fn();
        } finally {
            busy = false;
        }
    };

    const withVersion = (state) => {
        const normalized = normalizeStateVersion(state, VERSIONS.V3);
        normalized.versionNumberString = VERSIONS.V3;
        return normalized;
    };

    const finishUpgrade = async (state, options = { clearLegacy: true, clearCookies: false }) => {
        await saveGameState(state);
        if (options.clearLegacy) {
            clearLegacyLocalStorage();
        }
        if (options.clearCookies) {
            clearV1Cookies();
        }
        await refreshStateSnapshots();
    };

    const upgradeV1ToV3 = (mode = 'merge') =>
        guard(async () => {
            await ready;
            const current = loadGameState();
            const targetBase = mode === 'replace' ? {} : current;

            const itemsToApply = [
                EARLY_ADOPTER_ID ? { id: EARLY_ADOPTER_ID, count: 1 } : null,
                ...v1Items,
            ].filter(Boolean);

            const next = applyItemsToState({
                baseState: targetBase,
                items: itemsToApply,
                versionNumber: VERSIONS.V3,
            });

            await finishUpgrade(next, { clearLegacy: false, clearCookies: true });
            updateStatus(
                mode === 'replace'
                    ? 'Replaced current save with your v1 items and upgraded to v3.'
                    : 'Merged v1 items into your current save and upgraded to v3.'
            );
        });

    const upgradeV2ToV3 = (mode = 'merge') =>
        guard(async () => {
            if (!legacyV2State) {
                updateStatus('No v2 save found to upgrade.');
                return;
            }

            await ready;
            const current = loadGameState();
            const normalizedLegacy = withVersion(legacyV2State);
            const next =
                mode === 'replace'
                    ? normalizedLegacy
                    : {
                          ...mergeGameStates(current, normalizedLegacy),
                          versionNumberString: VERSIONS.V3,
                      };

            await finishUpgrade(next);
            updateStatus(
                mode === 'replace'
                    ? 'Replaced your v3 save with the legacy v2 data.'
                    : 'Merged legacy v2 data into your v3 save.'
            );
        });

    const mergeEverything = () =>
        guard(async () => {
            if (!legacyV2State) {
                updateStatus('No legacy v2 save available to merge.');
                return;
            }
            await ready;
            const current = loadGameState();
            const normalizedLegacy = withVersion(legacyV2State);

            const merged = mergeGameStates(current, normalizedLegacy);
            merged.versionNumberString = VERSIONS.V3;

            await finishUpgrade(merged, { clearLegacy: true, clearCookies: hasV1Cookies });
            updateStatus('Merged legacy data into v3 and cleaned up old storage.');
        });

    const replaceWithLegacy = () =>
        guard(async () => {
            if (!legacyV2State) {
                updateStatus('No legacy v2 save available to replace with.');
                return;
            }
            const normalizedLegacy = withVersion(legacyV2State);
            await finishUpgrade(normalizedLegacy, {
                clearLegacy: true,
                clearCookies: hasV1Cookies,
            });
            updateStatus('Replaced v3 save with legacy data and upgraded to v3.');
        });

    const discardLegacy = () =>
        guard(async () => {
            clearLegacyLocalStorage();
            clearV1Cookies();
            await refreshStateSnapshots();
            updateStatus('Removed legacy v1/v2 data.');
        });

    const autoUpgradeV2IfSafe = () => {
        if (!legacyV2State || !isGameStateReady()) return;
        if (hasGameProgress(v3State)) return;
        upgradeV2ToV3('replace');
    };

    onMount(async () => {
        if (!isBrowser) return;
        await refreshStateSnapshots();
        autoUpgradeV2IfSafe();
    });

    $: hasV2LocalStorage = Boolean(legacyV2State);
    $: v2HasProgress = hasGameProgress(legacyV2State);
    $: v3HasProgress = hasGameProgress(v3State);
    $: conflict = hasV2LocalStorage && v2HasProgress && v3HasProgress;
</script>

<section class="save-upgrader">
    <div class="heading">
        <h2>Legacy save upgrades</h2>
        <p>
            Detect and upgrade older DSPACE saves (v1 cookies, v2 localStorage) to the current v3
            IndexedDB format.
        </p>
    </div>

    <div class="status-grid">
        <div class="status-chip" data-state={hasV1Cookies ? 'present' : 'missing'}>
            <span>v1 cookies</span>
            <strong>{hasV1Cookies ? 'Detected' : 'Not found'}</strong>
        </div>
        <div class="status-chip" data-state={hasV2LocalStorage ? 'present' : 'missing'}>
            <span>v2 localStorage</span>
            <strong>{hasV2LocalStorage ? 'Detected' : 'Not found'}</strong>
        </div>
        <div class="status-chip" data-state={v3HasProgress ? 'present' : 'missing'}>
            <span>v3 IndexedDB</span>
            <strong>{v3HasProgress ? 'Detected' : 'Empty'}</strong>
        </div>
    </div>

    {#if parseError}
        <p class="warning">{parseError}</p>
    {/if}

    {#if hasV1Cookies}
        <div class="card">
            <div class="card-text">
                <h3>Upgrade v1 (cookies) to v3</h3>
                <p>
                    Converts your v1 cookie data to v3. You can merge items into your current save
                    or replace it entirely.
                </p>
            </div>
            <div class="actions">
                <Chip
                    text="Merge v1 into v3"
                    onClick={() => upgradeV1ToV3('merge')}
                    disabled={busy}
                />
                <Chip
                    text="Replace with v1 data"
                    onClick={() => upgradeV1ToV3('replace')}
                    disabled={busy}
                />
            </div>
        </div>
    {/if}

    {#if hasV2LocalStorage}
        <div class="card">
            <div class="card-text">
                <h3>Upgrade v2 (localStorage) to v3</h3>
                <p>
                    Move your legacy v2 save into v3&apos;s IndexedDB storage.
                    Choose whether to merge it with your current save or replace it.
                </p>
            </div>
            <div class="actions">
                <Chip
                    text="Merge v2 into v3"
                    onClick={() => upgradeV2ToV3('merge')}
                    disabled={busy}
                />
                <Chip
                    text="Replace with v2 data"
                    onClick={() => upgradeV2ToV3('replace')}
                    disabled={busy}
                />
            </div>
        </div>
    {/if}

    {#if conflict}
        <div class="card warning-card">
            <div class="card-text">
                <h3>Conflict detected</h3>
                <p>
                    Legacy data and current v3 data both exist. Decide whether to merge, replace, or
                    remove the legacy data.
                </p>
            </div>
            <div class="actions">
                <Chip text="Merge everything" onClick={mergeEverything} disabled={busy} />
                <Chip text="Replace with legacy" onClick={replaceWithLegacy} disabled={busy} />
                <Chip text="Delete legacy data" onClick={discardLegacy} disabled={busy} />
            </div>
        </div>
    {/if}

    {#if !hasV1Cookies && !hasV2LocalStorage}
        <p>No legacy saves detected. You&apos;re fully on v3.</p>
    {/if}

    <div class="footnote">
        <p>
            Legacy keys checked: {LEGACY_LOCAL_STORAGE_KEYS.join(
                ', '
            )}. Upgrades remove legacy storage to prevent mixed saves.
        </p>
    </div>

    {#if status}
        <p class="status-message" role="status" aria-live="polite">{status}</p>
    {/if}
</section>

<style>
    .save-upgrader {
        border: 1px solid #1f2937;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
        background: linear-gradient(135deg, #0b1220, #0c1626);
        color: #e5e7eb;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.5rem;
    }

    h2,
    h3 {
        margin: 0;
    }

    p {
        margin: 0;
        color: #cbd5e1;
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
    }

    .status-chip {
        padding: 0.75rem;
        border-radius: 10px;
        border: 1px solid #1f2937;
        background: #111827;
        display: grid;
        gap: 0.35rem;
    }

    .status-chip[data-state='present'] {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.12);
    }

    .status-chip[data-state='missing'] {
        border-color: #374151;
    }

    .warning {
        color: #fbbf24;
    }

    .card {
        border: 1px solid #1f2937;
        border-radius: 10px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: #0f172a;
    }

    .warning-card {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.08);
    }

    .card-text {
        display: grid;
        gap: 0.35rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .status-message {
        color: #10b981;
        font-weight: 600;
    }

    .footnote {
        font-size: 0.9rem;
        color: #9ca3af;
    }

    @media (max-width: 640px) {
        .save-upgrader {
            padding: 1rem;
        }
    }
</style>
