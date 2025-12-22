const KNOWN_DATABASES = ['dspaceGameState', 'dspaceDB', 'CustomContent'];

function clearStorage(storage) {
    try {
        storage?.clear();
    } catch (error) {
        console.warn('Failed to clear storage', error);
    }
}

function clearCookies() {
    if (typeof document === 'undefined') return;
    const cookies = document.cookie ? document.cookie.split(';') : [];
    cookies.forEach((cookie) => {
        const [rawName] = cookie.split('=');
        const name = rawName?.trim();
        if (!name) return;
        document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    });
}

function deleteDatabase(name) {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
        } catch (error) {
            console.warn('Failed to delete database', name, error);
            resolve();
        }
    });
}

async function clearIndexedDB() {
    if (typeof indexedDB === 'undefined') return;
    const deletions = [];
    if (typeof indexedDB.databases === 'function') {
        try {
            const databases = await indexedDB.databases();
            databases
                ?.map((db) => db?.name)
                .filter(Boolean)
                .forEach((name) => deletions.push(deleteDatabase(name)));
        } catch (error) {
            console.warn('Failed to list IndexedDB databases', error);
        }
    }

    KNOWN_DATABASES.forEach((name) => deletions.push(deleteDatabase(name)));
    await Promise.all(deletions);
}

export async function clearBrowserData() {
    clearStorage(typeof localStorage === 'undefined' ? undefined : localStorage);
    clearStorage(typeof sessionStorage === 'undefined' ? undefined : sessionStorage);
    clearCookies();
    await clearIndexedDB();
}
