// import { log } from './devLog.js';
import { runMigrations } from './migrations.js';

// Legacy DB helpers (kept for backward compatibility)
const DB_NAME = 'dspaceDB';
const DB_VERSION = 1;
const LEGACY_STORE_NAME = 'quests';

let dbInstance = null;

function getIndexedDB() {
    const g = typeof window !== 'undefined' ? window : globalThis;
    return g.indexedDB || g.webkitIndexedDB || g.mozIndexedDB || g.msIndexedDB || null;
}

const hasIndexedDB = typeof globalThis !== 'undefined' && 'indexedDB' in globalThis;

function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            return resolve(dbInstance);
        }

        const idb = getIndexedDB();
        if (!idb) {
            reject(new Error('IndexedDB is not supported'));
            return;
        }

        const request = idb.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
                db.createObjectStore(LEGACY_STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
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
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    return openCustomContentDB().then((db) => {
        const transaction = db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    });
}

export function addEntity(entity) {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(entity.type);
    return getTransaction(storeName, 'readwrite').then((store) => {
        return new Promise((resolve, reject) => {
            const request = store.add(entity);
            request.onsuccess = () => resolve(request.result);
            /* istanbul ignore next */
            request.onerror = (event) => {
                console.error('Add entity failed:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}

export function getEntity(id, entityType) {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(entityType);
    return getTransaction(storeName, 'readonly').then((store) => {
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            /* istanbul ignore next */
            request.onerror = (event) => {
                console.error('Get entity failed:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}

export async function updateEntity(updatedEntity) {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(updatedEntity.type);
    return getTransaction(storeName, 'readwrite').then((store) => {
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

                /* istanbul ignore next */
                updateRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };

            /* istanbul ignore next */
            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}

export function deleteEntity(id, entityType) {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(entityType);
    return getTransaction(storeName, 'readwrite').then((store) => {
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            /* istanbul ignore next */
            request.onerror = (event) => {
                console.error('Delete entity failed:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}

/**
 * Get the store name for a given entity type
 * @param {string} entityType - The type of entity (quest, item, process)
 * @returns {string} The store name for the entity type
 * @throws {Error} If the entity type is not supported
 */
export function getStoreForEntityType(entityType) {
    switch (entityType) {
        case 'quest':
            return 'quests';
        case 'item':
            return 'items';
        case 'process':
            return 'processes';
        default:
            throw new Error(`Unknown entity type: ${entityType}`);
    }
}

export const CUSTOM_CONTENT_DB_VERSION = 3;

export const openCustomContentDB = () => {
    return new Promise((resolve, reject) => {
        const idb = getIndexedDB();
        if (!idb) {
            reject(new Error('IndexedDB is not supported'));
            return;
        }
        const request = idb.open('CustomContent', CUSTOM_CONTENT_DB_VERSION);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta');
            }

            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains('items')) {
                db.createObjectStore('items', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('processes')) {
                db.createObjectStore('processes', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('quests')) {
                db.createObjectStore('quests', { keyPath: 'id' });
            }

            const metaStore = request.transaction.objectStore('meta');
            const oldVersion = e.oldVersion || 0;
            const versionToStore = oldVersion === 0 ? CUSTOM_CONTENT_DB_VERSION : oldVersion;
            metaStore.put(versionToStore, 'schemaVersion');
        };

        request.onsuccess = async () => {
            const db = request.result;
            try {
                await runMigrations(db, CUSTOM_CONTENT_DB_VERSION);
                resolve(db);
            } catch (err) {
                reject(err);
            }
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

export const getSchemaVersion = async () => {
    if (!hasIndexedDB) {
        return CUSTOM_CONTENT_DB_VERSION;
    }
    const db = await openCustomContentDB();
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const request = store.get('schemaVersion');
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result ?? CUSTOM_CONTENT_DB_VERSION);
            db.close();
        };
        request.onerror = (event) => {
            reject(event.target.error);
            db.close();
        };
    });
};

// DB Transaction
export const saveItem = async (item) => {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('items', 'readwrite');
        const store = tx.objectStore('items');
        store.put(item);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            /* istanbul ignore next */
            tx.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error saving item:', error);
        return Promise.reject(error);
    }
};

// Get all items
export const getItems = async () => {
    if (!hasIndexedDB) {
        return [];
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('items', 'readonly');
        const store = tx.objectStore('items');
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
                db.close();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting items:', error);
        return Promise.reject(error);
    }
};

// Get an item by id
export const getItem = async (id) => {
    if (!hasIndexedDB) {
        return null;
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('items', 'readonly');
        const store = tx.objectStore('items');
        const request = store.get(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
                db.close();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting item:', error);
        return Promise.reject(error);
    }
};

// DB Transaction
export const saveProcess = async (process) => {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('processes', 'readwrite');
        const store = tx.objectStore('processes');
        store.put(process);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            /* istanbul ignore next */
            tx.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error saving process:', error);
        return Promise.reject(error);
    }
};

// Get all processes
export const getProcesses = async () => {
    if (!hasIndexedDB) {
        return [];
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('processes', 'readonly');
        const store = tx.objectStore('processes');
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
                db.close();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting processes:', error);
        return Promise.reject(error);
    }
};

// Get a process by id
export const getProcess = async (id) => {
    if (!hasIndexedDB) {
        return null;
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('processes', 'readonly');
        const store = tx.objectStore('processes');
        const request = store.get(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
                db.close();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting process:', error);
        return Promise.reject(error);
    }
};

// Delete processes by id
export const deleteProcess = async (id) => {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('processes', 'readwrite');
        const store = tx.objectStore('processes');
        store.delete(id);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            /* istanbul ignore next */
            tx.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error deleting process:', error);
        return Promise.reject(error);
    }
};

// DB Transaction
export const saveQuest = async (quest) => {
    if (!hasIndexedDB) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('quests', 'readwrite');
        const store = tx.objectStore('quests');
        store.put(quest);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            /* istanbul ignore next */
            tx.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error saving quest:', error);
        return Promise.reject(error);
    }
};

// Get all quests
export const getQuests = async () => {
    if (!hasIndexedDB) {
        return [];
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('quests', 'readonly');
        const store = tx.objectStore('quests');
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
                db.close();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting quests:', error);
        return Promise.reject(error);
    }
};

// Get a quest by id
export const getQuest = async (id) => {
    if (!hasIndexedDB) {
        return null;
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('quests', 'readonly');
        const store = tx.objectStore('quests');
        const request = store.get(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
                db.close();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                reject(event.target.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting quest:', error);
        return Promise.reject(error);
    }
};
