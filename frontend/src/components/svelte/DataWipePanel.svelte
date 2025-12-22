<script>
    import { onMount } from 'svelte';
    import Chip from './Chip.svelte';

    let clearing = false;
    let statusMessage = '';
    let errorMessage = '';
    let hydrated = false;

    onMount(() => {
        hydrated = true;
    });

    function clearCookies() {
        if (typeof document === 'undefined') {
            return;
        }

        document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0]?.trim();
            if (!name) {
                return;
            }
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
    }

    function clearWebStorage() {
        try {
            localStorage?.clear();
        } catch (err) {
            console.warn('Unable to clear localStorage', err);
        }

        try {
            sessionStorage?.clear();
        } catch (err) {
            console.warn('Unable to clear sessionStorage', err);
        }
    }

    async function clearIndexedDBData() {
        if (typeof indexedDB === 'undefined' || typeof indexedDB.deleteDatabase !== 'function') {
            return;
        }

        if (typeof indexedDB.databases !== 'function') {
            return;
        }

        const databases = await indexedDB.databases();
        const deleteOperations = databases
            .map((database) => database?.name)
            .filter(Boolean)
            .map(
                (name) =>
                    new Promise((resolve, reject) => {
                        const request = indexedDB.deleteDatabase(name);
                        request.onsuccess = () => resolve(undefined);
                        request.onblocked = () => resolve(undefined);
                        request.onerror = () =>
                            reject(
                                request.error ??
                                    new Error(`Unable to delete IndexedDB database: ${name}`)
                            );
                    })
            );

        await Promise.all(deleteOperations);
    }

    async function handleWipe() {
        if (
            typeof window !== 'undefined' &&
            !window.confirm('Erase all app data on this device?')
        ) {
            return;
        }

        clearing = true;
        statusMessage = '';
        errorMessage = '';

        try {
            clearWebStorage();
            await clearIndexedDBData();
            clearCookies();
            statusMessage = 'All app data cleared from this device.';
        } catch (err) {
            console.error(err);
            errorMessage = 'Failed to clear all data. Please try again.';
        } finally {
            clearing = false;
        }
    }
</script>

<div class="data-wipe-panel" data-hydrated={hydrated ? 'true' : 'false'}>
    <h3>Danger zone</h3>
    <p>
        Remove every trace of this app from your browser. This clears saved sessions, cached data,
        and credentials stored on this device.
    </p>
    <ul>
        <li>localStorage and sessionStorage entries</li>
        <li>IndexedDB databases used by the app</li>
        <li>Cookies set by this site</li>
    </ul>
    <Chip
        text={clearing ? 'Clearing…' : 'Erase all app data'}
        onClick={handleWipe}
        disabled={clearing}
        hazard={true}
    />
    {#if statusMessage}
        <p class="status" role="status" data-testid="wipe-status">{statusMessage}</p>
    {/if}
    {#if errorMessage}
        <p class="error" role="alert" data-testid="wipe-error">{errorMessage}</p>
    {/if}
</div>

<style>
    .data-wipe-panel {
        background: #3d1616;
        border: 2px solid #c01f1f;
        border-radius: 12px;
        padding: 16px;
        max-width: 640px;
        color: #fff;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    h3 {
        margin: 0;
        color: #ffb3b3;
    }

    p {
        margin: 0;
        line-height: 1.5;
    }

    ul {
        margin: 0;
        padding-left: 20px;
        color: #ffd9d9;
        line-height: 1.4;
    }

    .status {
        color: #90ee90;
    }

    .error {
        color: #ff9f9f;
    }
</style>
