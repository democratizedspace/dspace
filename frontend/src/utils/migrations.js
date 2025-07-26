export const MIGRATIONS = {
    2: async (db) => {
        const stores = ['items', 'processes', 'quests'];
        for (const storeName of stores) {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            const records = await new Promise((resolve, reject) => {
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e.target.error);
            });
            for (const record of records) {
                if (!record.createdAt) {
                    record.createdAt = new Date().toISOString();
                    store.put(record);
                }
            }
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = (e) => reject(e.target.error);
            });
        }
    },
};

export async function getCurrentSchemaVersion(db) {
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const req = store.get('schemaVersion');
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result ?? 0);
        req.onerror = (e) => reject(e.target.error);
    });
}

export async function setSchemaVersion(db, version) {
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');
    store.put(version, 'schemaVersion');
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

export async function runMigrations(db, targetVersion) {
    let current = await getCurrentSchemaVersion(db);
    const end = targetVersion;
    while (current < end) {
        const next = current + 1;
        if (MIGRATIONS[next]) {
            await MIGRATIONS[next](db);
        }
        await setSchemaVersion(db, next);
        current = next;
    }
}
