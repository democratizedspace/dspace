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

    async function wipeAllData() {
        clearing = true;
        statusMessage = '';
        errorMessage = '';

        try {
            await clearAllData();
            statusMessage = 'All local data cleared. You may need to reload the page.';
        } catch (error) {
            console.error('Failed to wipe data', error);
            errorMessage = 'Unable to clear all data. Please try again.';
        } finally {
            clearing = false;
        }
    }

    async function clearAllData() {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Failed to clear localStorage', error);
        }

        await clearIndexedDB();

        try {
            document.cookie
                .split(';')
                .map((cookie) => cookie.trim())
                .filter(Boolean)
                .forEach((cookie) => {
                    const [name] = cookie.split('=');
                    document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
                });
        } catch (error) {
            console.warn('Failed to clear cookies', error);
        }
    }

    async function clearIndexedDB() {
        const idb = globalThis.indexedDB;
        if (!idb) {
            return;
        }

        const databaseNames = new Set(['dspaceDB', 'CustomContent']);

        if (typeof idb.databases === 'function') {
            try {
                const databases = await idb.databases();
                databases.forEach((db) => {
                    if (db?.name) {
                        databaseNames.add(db.name);
                    }
                });
            } catch (error) {
                console.warn('Failed to list IndexedDB databases', error);
            }
        }

        await Promise.all(
            Array.from(databaseNames).map((name) => {
                return new Promise((resolve) => {
                    const request = idb.deleteDatabase(name);
                    request.onsuccess = () => resolve();
                    request.onblocked = () => resolve();
                    request.onerror = () => resolve();
                });
            })
        );
    }
</script>

<section class="data-wipe" data-hydrated={hydrated ? 'true' : 'false'}>
    <div>
        <h3>Erase local app data</h3>
        <p>
            Remove all saved data from this browser, including game saves and custom content stored in
            localStorage, IndexedDB, and cookies.
        </p>
    </div>
    <Chip text={clearing ? 'Wiping…' : 'Wipe all data'} on:click={wipeAllData} hazard={true} />
    {#if statusMessage}
        <p class="status" role="status">{statusMessage}</p>
    {/if}
    {#if errorMessage}
        <p class="error" role="alert">{errorMessage}</p>
    {/if}
</section>

<style>
    .data-wipe {
        background: #2c5837;
        border: 2px solid #007006;
        border-radius: 12px;
        padding: 16px;
        max-width: 640px;
        color: #fff;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    h3 {
        margin: 0 0 6px 0;
    }

    p {
        margin: 0;
        line-height: 1.5;
    }

    .status {
        color: #90ee90;
    }

    .error {
        color: #ff9f9f;
    }
</style>
