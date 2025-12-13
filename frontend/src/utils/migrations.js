import { validateProcessData } from './customProcessValidation.js';
import { validateQuestData } from './customQuestValidation.js';
import { validateItemData } from './customItemValidation.js';

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
    3: async (db) => {
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
                if (!record.updatedAt) {
                    record.updatedAt = record.createdAt || new Date().toISOString();
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
    const errors = await validateDataIntegrity(db);
    if (errors.length) {
        throw new Error('Data integrity validation failed');
    }
}

export async function validateDataIntegrity(db) {
    const checks = [
        { store: 'items', validator: validateItemData },
        { store: 'processes', validator: validateProcessData },
        { store: 'quests', validator: validateQuestData },
    ];
    const errors = [];
    for (const { store, validator } of checks) {
        const tx = db.transaction(store, 'readonly');
        const storeObj = tx.objectStore(store);
        const req = storeObj.getAll();
        const records = await new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
        for (const record of records) {
            const { valid, errors: valErrors } = validator(record);
            if (!valid) {
                errors.push({ store, id: record.id, errors: valErrors });
            }
        }
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
        });
    }
    return errors;
}
