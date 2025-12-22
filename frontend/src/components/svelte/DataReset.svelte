<script>
    import Chip from './Chip.svelte';

    const FALLBACK_DATABASES = ['dspaceGameState', 'dspaceDB', 'dspaceGameSaves', 'CustomContent'];

    let statusMessage = '';
    let isClearing = false;

    const clearLocalStorage = () => {
        if (!('localStorage' in globalThis)) return;
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Failed to clear localStorage', error);
        }
    };

    const clearCookies = () => {
        if (typeof document === 'undefined') return;

        const candidatePaths = (() => {
            if (typeof location === 'undefined' || !location.pathname) {
                return ['/'];
            }

            const segments = location.pathname.split('/').filter(Boolean);
            const paths = new Set(['/']);
            let currentPath = '';

            for (const segment of segments) {
                currentPath += `/${segment}`;
                paths.add(currentPath);
            }

            return Array.from(paths);
        })();

        const candidateDomains = (() => {
            if (typeof location === 'undefined' || !location.hostname) {
                return [undefined];
            }

            const parts = location.hostname.split('.').filter(Boolean);
            const domains = new Set([undefined]);

            for (let i = 0; i < parts.length - 1; i++) {
                const domain = `.${parts.slice(i).join('.')}`;
                domains.add(domain);
            }

            return Array.from(domains);
        })();

        document.cookie.split(';').forEach((cookie) => {
            const [rawName] = cookie.split('=');
            const name = rawName && rawName.trim();
            if (!name) return;

            candidatePaths.forEach((path) => {
                candidateDomains.forEach((domain) => {
                    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
                    if (domain) {
                        cookieString += `; domain=${domain}`;
                    }
                    document.cookie = cookieString;
                });
            });
        });
    };

    const deleteDatabase = (name) =>
        new Promise((resolve) => {
            try {
                const request = indexedDB.deleteDatabase(name);
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
                request.onblocked = () => resolve();
            } catch (error) {
                console.warn(`Failed to request IndexedDB deletion for ${name}`, error);
                resolve();
            }
        });

    const listDatabaseNames = async () => {
        if (!('indexedDB' in globalThis)) return [];

        if (typeof indexedDB.databases === 'function') {
            try {
                const databases = await indexedDB.databases();
                const names = databases
                    .map((database) => database?.name)
                    .filter((name) => typeof name === 'string');

                if (names.length > 0) {
                    return names;
                }
            } catch (error) {
                console.warn('Failed to enumerate IndexedDB databases', error);
            }
        }

        return FALLBACK_DATABASES;
    };

    const clearIndexedDB = async () => {
        if (!('indexedDB' in globalThis)) return;

        const databaseNames = await listDatabaseNames();
        const uniqueNames = Array.from(new Set(databaseNames));

        await Promise.all(uniqueNames.map((name) => deleteDatabase(name)));
    };

    const wipeAppData = async () => {
        if (isClearing) return;
        if (typeof window !== 'undefined') {
            const confirmed = window.confirm(
                'This will remove all DSPACE data saved in this browser, including cookies, ' +
                    'localStorage, and IndexedDB. Continue?'
            );

            if (!confirmed) return;
        }

        isClearing = true;
        statusMessage = '';

        let hadError = false;

        try {
            clearLocalStorage();
            clearCookies();
            await clearIndexedDB();
        } catch (error) {
            console.error('Failed to wipe all app data', error);
            hadError = true;
        } finally {
            statusMessage = hadError
                ? 'Some local app data may not have been removed. Please try again or clear your browser data manually.'
                : 'All local app data was removed.';
            isClearing = false;
        }
    };
</script>

<section class="data-reset">
    <div class="heading">
        <h2>Danger zone</h2>
        <p>Remove all cached saves, cookies, and offline data from this browser.</p>
    </div>

    <Chip
        text={isClearing ? 'Wiping data…' : 'Wipe all app data'}
        onClick={wipeAppData}
        hazard={true}
        disabled={isClearing}
    />

    {#if statusMessage}
        <p class="status" role="status" aria-live="polite">{statusMessage}</p>
    {/if}
</section>

<style>
    .data-reset {
        border: 1px solid #b91c1c;
        border-radius: 12px;
        padding: 1.5rem;
        display: grid;
        gap: 0.75rem;
        max-width: 640px;
        background: linear-gradient(135deg, #2c0c13, #19070c);
        color: #f9fafb;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    }

    .heading {
        display: grid;
        gap: 0.25rem;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    p {
        margin: 0;
    }

    .status {
        color: #fcd34d;
        font-weight: 600;
    }

    @media (max-width: 640px) {
        .data-reset {
            padding: 1rem;
        }
    }
</style>
