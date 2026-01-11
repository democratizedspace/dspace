<script>
    import { onMount } from 'svelte';
    import {
        importV1V3,
        importV2V3,
        mergeLegacyStateIntoCurrent,
        normalizeCount,
    } from '../../utils/gameState.js';
    import { inspectGameStateStorage } from '../../utils/gameState/common.js';
    import { qaCheatsEnabled } from '../../lib/qaCheats';
    import { clearV3GameStateStorage } from '../../utils/legacySaveSeeding';
    import { detectLegacyArtifacts, detectV1CookieItems } from '../../utils/legacySaveDetection';
    import Chip from './Chip.svelte';

    export let cheatsAvailable = false;

    const normalizeForStableSerialization = (value, seen = new WeakSet()) => {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        if (seen.has(value)) {
            return '[Circular]';
        }
        seen.add(value);
        if (Array.isArray(value)) {
            return value.map((item) => normalizeForStableSerialization(item, seen));
        }
        const normalized = {};
        const keys = Object.keys(value).sort();
        for (const key of keys) {
            normalized[key] = normalizeForStableSerialization(value[key], seen);
        }
        return normalized;
    };

    const stableSerialize = (value) => JSON.stringify(normalizeForStableSerialization(value));

    const filterLegacyItems = (items) =>
        (Array.isArray(items) ? items : [])
            .map(({ id, count }) => ({ id, count: normalizeCount(count) }))
            .filter(({ id, count }) => id && count > 0);

    let v1CookieItems = [];
    let v1CookieKeys = [];
    let v1CookieIssues = [];
    let invalidV1CookieSummary = '';
    let normalizedV1Items = filterLegacyItems(v1CookieItems);
    let detection = {
        loading: true,
        hasV3State: false,
        hasLegacyV2: false,
        hasV1Cookies: normalizedV1Items.length > 0,
        indexedDbSupported: false,
        usingFallback: false,
        conflict: false,
        pendingLocalState: undefined,
    };
    let statusMessage = '';
    let errorMessage = '';
    let workingAction = '';
    let qaEnabled = false;
    $: showV2V3ConflictWarning = detection.hasLegacyV2 && detection.hasV3State;

    $: normalizedV1Items = filterLegacyItems(v1CookieItems);
    $: invalidV1CookieSummary = v1CookieIssues
        .map(({ name, value }) => `${name}=${value}`)
        .join(', ');

    const refreshStatus = async () => {
        detection = { ...detection, loading: true };

        const v1Detection = detectV1CookieItems();
        v1CookieItems = v1Detection.items;
        v1CookieKeys = v1Detection.cookieKeys;
        v1CookieIssues = v1Detection.invalidCookies;

        const inspection = await inspectGameStateStorage();
        const {
            indexedDbState,
            localStorageState,
            indexedDbSupported,
            usesLocalStorageFallback,
            legacyV2State,
            hasLegacyV2Keys,
        } = inspection;

        const hasIndexedDbState = Boolean(indexedDbState);
        const statesMatch =
            indexedDbState &&
            legacyV2State &&
            stableSerialize(indexedDbState) === stableSerialize(legacyV2State);

        const treatLocalAsLegacy =
            indexedDbSupported &&
            !usesLocalStorageFallback &&
            Boolean(legacyV2State) &&
            (!hasIndexedDbState || !statesMatch);

        const pendingLocalState = treatLocalAsLegacy ? legacyV2State : undefined;
        const usingFallback =
            usesLocalStorageFallback ||
            (!indexedDbSupported && (localStorageState || legacyV2State));

        const artifacts = detectLegacyArtifacts(v1Detection);
        const hasV1Artifacts = artifacts.hasV1Cookies || normalizedV1Items.length > 0;
        const hasV3State = hasIndexedDbState || Boolean(usingFallback);
        const hasLegacyV2 =
            Boolean(pendingLocalState) ||
            (!hasIndexedDbState && !usingFallback && hasLegacyV2Keys) ||
            (!hasIndexedDbState && artifacts.hasV2LocalStorage);

        detection = {
            loading: false,
            hasV3State,
            hasLegacyV2,
            hasV1Cookies: hasV1Artifacts,
            indexedDbSupported,
            usingFallback: Boolean(usingFallback),
            conflict: (hasV1Artifacts || Boolean(pendingLocalState)) && hasV3State,
            pendingLocalState,
            localVsIndexedMismatch:
                Boolean(legacyV2State) && Boolean(indexedDbState) && !statesMatch,
        };
    };

    const expireLegacyCookies = () => {
        if (typeof document === 'undefined') return true;
        const cookies = v1CookieKeys && v1CookieKeys.length > 0 ? v1CookieKeys : [];
        if (cookies.length === 0) return true;

        const candidatePaths = (() => {
            if (typeof location === 'undefined' || !location.pathname) return ['/'];
            const segments = location.pathname.split('/').filter(Boolean);
            const paths = new Set(['/']);
            let currentPath = '';
            segments.forEach((segment) => {
                currentPath += `/${segment}`;
                paths.add(currentPath);
            });
            return Array.from(paths);
        })();

        const candidateDomains = (() => {
            if (typeof location === 'undefined' || !location.hostname) return [undefined];
            const host = location.hostname;
            const parts = host.split('.').filter(Boolean);
            const domains = new Set([undefined, host, `.${host}`]);
            for (let i = 0; i < parts.length - 1; i++) {
                const domain = parts.slice(i).join('.');
                domains.add(domain);
                domains.add(`.${domain}`);
            }
            return Array.from(domains);
        })();

        try {
            cookies.forEach((name) => {
                candidatePaths.forEach((path) => {
                    candidateDomains.forEach((domain) => {
                        const expiry = 'Thu, 01 Jan 1970 00:00:00 GMT';
                        let cookieString = `${name}=; expires=${expiry}; path=${path}`;
                        if (domain) {
                            cookieString += `; domain=${domain}`;
                        }
                        document.cookie = cookieString;
                    });
                });
            });
            return true;
        } catch (error) {
            console.error('Failed to expire legacy cookies', error);
            return false;
        }
    };

    const withStatus = async (actionName, fn) => {
        workingAction = actionName;
        statusMessage = '';
        errorMessage = '';
        try {
            await fn();
        } catch (err) {
            errorMessage = err?.message
                ? err.message
                : `Something went wrong while upgrading saves: ${String(err)}`;
            console.error(err);
        } finally {
            workingAction = '';
            await refreshStatus();
        }
    };

    const upgradeV1 = async (mode) => {
        if (!normalizedV1Items.length) {
            statusMessage = 'No v1 cookies detected on this device.';
            return;
        }
        await withStatus(mode === 'replace' ? 'replace-v1' : 'merge-v1', async () => {
            await importV1V3(normalizedV1Items, { replaceExisting: mode === 'replace' });
            const cleared = expireLegacyCookies();
            statusMessage =
                mode === 'replace'
                    ? 'Replaced current save with converted v1 data.'
                    : 'Merged v1 items into your current save.';
            if (!cleared) {
                statusMessage += ' Legacy cookies may persist; clear them manually if needed.';
            }
        });
    };

    const upgradeV2 = async (mode) => {
        if (!detection.pendingLocalState) {
            statusMessage = 'No legacy v2 localStorage save detected.';
            return;
        }
        await withStatus(mode === 'replace' ? 'replace-v2' : 'merge-v2', async () => {
            if (mode === 'replace') {
                await importV2V3(detection.pendingLocalState);
                statusMessage = 'Replaced the current save with migrated v2 data.';
            } else {
                await mergeLegacyStateIntoCurrent(detection.pendingLocalState);
                statusMessage =
                    'Merged compatible legacy v2 data into your current save. Inventory was ' +
                    'combined; existing quests and processes were kept.';
            }
        });
    };

    const discardLegacyV2 = async () => {
        if (detection.usingFallback && !detection.indexedDbSupported) {
            errorMessage =
                'This browser is already using localStorage for the active save. Remove legacy ' +
                'data only after exporting a backup.';
            return;
        }
        await withStatus('discard-v2', async () => {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameStateBackup');
            statusMessage =
                'Removed legacy v2 localStorage data. Your current v3 save remains in IndexedDB.';
        });
    };

    const clearV3ForTesting = async () => {
        await withStatus('clear-v3', async () => {
            const cleared = await clearV3GameStateStorage();
            statusMessage = cleared
                ? 'Cleared v3 IndexedDB save for QA testing. Reloading…'
                : 'Unable to confirm v3 save deletion. Reload and verify manually.';
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('legacy-upgrade-refresh'));
                window.setTimeout(() => window.location.reload(), 50);
            }
        });
    };

    const handleExternalRefresh = () => {
        refreshStatus();
    };

    onMount(() => {
        refreshStatus();

        if (typeof window !== 'undefined') {
            window.addEventListener('legacy-upgrade-refresh', handleExternalRefresh);
        }

        let unsubscribeQa;
        if (cheatsAvailable) {
            unsubscribeQa = qaCheatsEnabled.subscribe((value) => {
                qaEnabled = Boolean(value);
            });
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('legacy-upgrade-refresh', handleExternalRefresh);
            }
            unsubscribeQa?.();
        };
    });
</script>

<section class="legacy-upgrade">
    <div class="heading">
        <h2>Legacy save upgrades</h2>
        <p>
            Convert older saves to the current IndexedDB format and clean up cookies or localStorage
            artifacts.
        </p>
    </div>

    {#if detection.loading}
        <p role="status" aria-live="polite">Detecting saved data…</p>
    {:else}
        <div class="status-grid">
            <div class="card">
                <div class="card-header">
                    <h3>V1 (cookie saves)</h3>
                    <p>
                        {normalizedV1Items.length
                            ? `${normalizedV1Items.length} item cookies detected`
                            : 'No v1 cookies found'}
                    </p>
                </div>
                {#if v1CookieIssues.length}
                    <p class="warning">
                        {normalizedV1Items.length
                            ? 'Some legacy v1 cookies could not be parsed and were skipped.'
                            : 'Legacy v1 cookie keys were found, but counts could not be parsed.'}
                    </p>
                    <p class="muted">
                        {invalidV1CookieSummary}. Clear the cookies or re-seed a sample save and
                        refresh the page.
                    </p>
                {/if}
                {#if normalizedV1Items.length}
                    {#if detection.hasV3State}
                        <p class="warning">
                            Current v3 data exists. Choose whether to merge v1 items into it or
                            replace it entirely.
                        </p>
                    {/if}
                    <div class="actions">
                        <Chip
                            text={workingAction === 'merge-v1'
                                ? 'Merging v1…'
                                : 'Merge v1 into current save'}
                            onClick={() => upgradeV1('merge')}
                            inverted={true}
                            disabled={Boolean(workingAction)}
                        />
                        <Chip
                            text={workingAction === 'replace-v1'
                                ? 'Replacing with v1…'
                                : 'Replace current save with v1'}
                            onClick={() => upgradeV1('replace')}
                            hazard={true}
                            disabled={Boolean(workingAction)}
                        />
                        <Chip
                            text="Delete v1 cookies"
                            onClick={() => {
                                const cleared = expireLegacyCookies();
                                statusMessage = cleared
                                    ? 'Removed legacy v1 cookies.'
                                    : 'Unable to confirm removal. Clear cookies manually.';
                            }}
                            inverted={true}
                            disabled={Boolean(workingAction)}
                        />
                    </div>
                {:else}
                    <p class="muted">No v1 cookie data is available to import.</p>
                {/if}
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>V2 (localStorage saves)</h3>
                    <p>
                        {#if detection.pendingLocalState}
                            Legacy v2 localStorage data detected
                        {:else}
                            No standalone v2 localStorage save detected
                        {/if}
                    </p>
                </div>
                {#if !detection.indexedDbSupported}
                    <p class="warning">
                        IndexedDB is unavailable in this browser. You can keep using localStorage,
                        but upgrading to v3 storage is disabled here.
                    </p>
                {/if}
                {#if detection.pendingLocalState}
                    {#if detection.hasV3State}
                        <p class="warning">
                            Both legacy localStorage data and a current v3 save exist. Choose to
                            merge or replace to avoid mixed state.
                        </p>
                    {/if}
                    {#if showV2V3ConflictWarning}
                        <div class="warning-panel" role="alert">
                            <p class="warning-title">Legacy + v3 save conflict detected</p>
                            <p class="warning-body">
                                A v2 localStorage save and a v3 IndexedDB save both exist. Importing
                                could overwrite or merge data. Back up your v3 save first. For QA,
                                clear v3 before testing legacy imports.
                            </p>
                            {#if cheatsAvailable && qaEnabled}
                                <Chip
                                    text={workingAction === 'clear-v3'
                                        ? 'Clearing v3 save…'
                                        : 'Clear v3 save for testing'}
                                    onClick={clearV3ForTesting}
                                    hazard={true}
                                    disabled={Boolean(workingAction)}
                                />
                            {/if}
                        </div>
                    {/if}
                    {#if detection.localVsIndexedMismatch}
                        <p class="warning">
                            LocalStorage and IndexedDB saves differ. Upgrading will reconcile them.
                        </p>
                    {/if}
                    <div class="actions">
                        <Chip
                            text={workingAction === 'merge-v2'
                                ? 'Merging v2…'
                                : 'Merge legacy into current'}
                            onClick={() => upgradeV2('merge')}
                            inverted={true}
                            disabled={Boolean(workingAction) || !detection.indexedDbSupported}
                        />
                        <Chip
                            text={workingAction === 'replace-v2'
                                ? 'Replacing with v2…'
                                : 'Replace current save with v2'}
                            onClick={() => upgradeV2('replace')}
                            hazard={true}
                            disabled={Boolean(workingAction) || !detection.indexedDbSupported}
                        />
                        <Chip
                            text={workingAction === 'discard-v2'
                                ? 'Removing legacy data…'
                                : 'Discard legacy v2 data'}
                            onClick={discardLegacyV2}
                            inverted={true}
                            disabled={Boolean(workingAction)}
                        />
                    </div>
                {:else}
                    <p class="muted">
                        Legacy v2 data is not present or already matches the current v3 save.
                    </p>
                {/if}
            </div>
        </div>

        {#if statusMessage}
            <p class="status" role="status" aria-live="polite">{statusMessage}</p>
        {/if}
        {#if errorMessage}
            <p class="status error" role="alert">{errorMessage}</p>
        {/if}
    {/if}
</section>

<style>
    .legacy-upgrade {
        border: 1px solid #1f2937;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
        max-width: 960px;
        background: linear-gradient(135deg, #0f172a, #0b1222);
        color: #f9fafb;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
    }

    .heading {
        display: grid;
        gap: 0.25rem;
    }

    h2,
    h3 {
        margin: 0;
    }

    p {
        margin: 0;
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
    }

    .card {
        border: 1px solid #243049;
        border-radius: 10px;
        padding: 1rem;
        background: #0e1526;
        display: grid;
        gap: 0.75rem;
    }

    .card-header {
        display: grid;
        gap: 0.25rem;
    }

    .actions {
        display: grid;
        gap: 0.5rem;
    }

    .warning {
        color: #fcd34d;
        margin: 0;
    }

    .warning-panel {
        display: grid;
        gap: 0.35rem;
        padding: 0.75rem;
        border-radius: 10px;
        border: 1px solid rgba(234, 179, 8, 0.65);
        background: rgba(234, 179, 8, 0.12);
    }

    .warning-title {
        margin: 0;
        font-weight: 700;
    }

    .warning-body {
        margin: 0;
        color: #fcd34d;
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

    @media (max-width: 640px) {
        .legacy-upgrade {
            padding: 1rem;
        }
    }
</style>
