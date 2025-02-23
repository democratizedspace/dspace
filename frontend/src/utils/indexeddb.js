const DB_NAME = 'dspaceDB';
const DB_VERSION = 1;
const STORE_NAME = 'quests';

let dbInstance = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            return resolve(dbInstance);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
}

function getTransaction(storeName, mode) {
    return openDB().then((db) => {
        const transaction = db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    });
}

export function addEntity(entity) {
    return getTransaction(STORE_NAME, 'readwrite').then((store) => {
        return new Promise((resolve, reject) => {
            const request = store.add(entity);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => {
                console.error('Add entity failed:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}

export function getEntity(id) {
    return getTransaction(STORE_NAME, 'readonly').then((store) => {
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => {
                console.error('Get entity failed:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}

export async function updateEntity(updatedEntity) {
    return getTransaction(STORE_NAME, 'readwrite').then((store) => {
        return new Promise((resolve, reject) => {
            const getRequest = store.get(updatedEntity.id);

            getRequest.onsuccess = () => {
                const existingEntity = getRequest.result;
                if (!existingEntity) {
                    reject(new Error('Entity not found'));
                    return;
                }
                const mergedEntity = { ...existingEntity, ...updatedEntity };
                const updateRequest = store.put(mergedEntity);

                updateRequest.onsuccess = () => {
                    resolve(updateRequest.result);
                };

                updateRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };

            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}

export function deleteEntity(id) {
    return getTransaction(STORE_NAME, 'readwrite').then((store) => {
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (event) => {
                console.error('Delete entity failed:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}
