// import { log } from './devLog.js';
import { runMigrations } from './migrations.js';
import { isBrowser } from './ssr.js';

// Legacy DB helpers (kept for backward compatibility)
const DB_NAME = 'dspaceDB';
const DB_VERSION = 1;
const LEGACY_STORE_NAME = 'quests';

let dbInstance = null;

const isDev = Boolean(import.meta?.env?.DEV);

const logIndexedDbIssue = (message, error) => {
    const details = error?.message ?? error;
    if (isDev) {
        console.error(message, details);
        return;
    }

    console.warn(message, details);
};

function getIndexedDB() {
    // In browser, use window.indexedDB
    if (isBrowser) {
        return (
            window.indexedDB ||
            window.webkitIndexedDB ||
            window.mozIndexedDB ||
            window.msIndexedDB ||
            null
        );
    }
    // In Node.js, check globalThis for polyfills (e.g., fake-indexeddb for testing)
    const g = globalThis;
    return g.indexedDB || null;
}

function hasIndexedDB() {
    return !!getIndexedDB();
}

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
            logIndexedDbIssue('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
}

function getTransaction(storeName, mode) {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    return openCustomContentDB().then((db) => {
        try {
            const transaction = db.transaction([storeName], mode);
            return { store: transaction.objectStore(storeName), transaction, db };
        } catch (error) {
            db.close();
            throw error;
        }
    });
}

function runTransactionWithResult({ transaction, db }, runner) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let result;

        const finish = (handler, value) => {
            if (settled) {
                return;
            }
            settled = true;
            handler(value);
            db.close();
        };

        const fail = (error) => {
            finish(reject, error);
        };

        transaction.oncomplete = () => {
            finish(resolve, result);
        };
        transaction.onerror = (event) => {
            fail(event.target?.error ?? event);
        };
        transaction.onabort = (event) => {
            fail(event.target?.error ?? event);
        };

        runner({
            setResult: (value) => {
                result = value;
            },
            fail,
        });
    });
}

function runTransactionWithoutResult(transactionMeta, runner) {
    return runTransactionWithResult(transactionMeta, runner);
}

export function addEntity(entity) {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(entity.entityType ?? entity.type);
    return getTransaction(storeName, 'readwrite').then((transactionMeta) =>
        runTransactionWithResult(transactionMeta, ({ setResult, fail }) => {
            const { store } = transactionMeta;
            let request;
            try {
                request = store.add(entity);
            } catch (error) {
                fail(error);
                return;
            }
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                logIndexedDbIssue('Add entity failed:', event.target.error);
                fail(event.target.error);
            };
        })
    );
}

export function getEntity(id, entityType) {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(entityType);
    return getTransaction(storeName, 'readonly').then((transactionMeta) =>
        runTransactionWithResult(transactionMeta, ({ setResult, fail }) => {
            const { store } = transactionMeta;
            let request;
            try {
                request = store.get(id);
            } catch (error) {
                fail(error);
                return;
            }
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                logIndexedDbIssue('Get entity failed:', event.target.error);
                fail(event.target.error);
            };
        })
    );
}

export async function updateEntity(updatedEntity) {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(updatedEntity.entityType ?? updatedEntity.type);
    return getTransaction(storeName, 'readwrite').then((transactionMeta) =>
        runTransactionWithResult(transactionMeta, ({ setResult, fail }) => {
            const { store } = transactionMeta;
            let getRequest;
            try {
                getRequest = store.get(updatedEntity.id);
            } catch (error) {
                fail(error);
                return;
            }

            getRequest.onsuccess = () => {
                const existingEntity = getRequest.result;
                if (!existingEntity) {
                    fail(new Error('Entity not found'));
                    return;
                }
                let updateRequest;
                try {
                    const mergedEntity = { ...existingEntity, ...updatedEntity };
                    updateRequest = store.put(mergedEntity);
                } catch (error) {
                    fail(error);
                    return;
                }

                updateRequest.onsuccess = () => {
                    setResult(updateRequest.result);
                };

                /* istanbul ignore next */
                updateRequest.onerror = (event) => {
                    fail(event.target.error);
                };
            };

            /* istanbul ignore next */
            getRequest.onerror = (event) => {
                fail(event.target.error);
            };
        })
    );
}

export function deleteEntity(id, entityType) {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    const storeName = getStoreForEntityType(entityType);
    return getTransaction(storeName, 'readwrite').then((transactionMeta) =>
        runTransactionWithoutResult(transactionMeta, ({ setResult, fail }) => {
            const { store } = transactionMeta;
            let request;
            try {
                request = store.delete(id);
            } catch (error) {
                fail(error);
                return;
            }
            request.onsuccess = () => {
                setResult();
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                logIndexedDbIssue('Delete entity failed:', event.target.error);
                fail(event.target.error);
            };
        })
    );
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
    if (!hasIndexedDB()) {
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
    if (!hasIndexedDB()) {
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
        logIndexedDbIssue('Error saving item:', error);
        return Promise.reject(error);
    }
};

// Get all items
export const getItems = async () => {
    if (!hasIndexedDB()) {
        return [];
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('items', 'readonly');
        const store = tx.objectStore('items');
        const request = store.getAll();
        return runTransactionWithResult({ transaction: tx, db }, ({ setResult, fail }) => {
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                fail(event.target.error);
            };
        });
    } catch (error) {
        logIndexedDbIssue('Error getting items:', error);
        return Promise.reject(error);
    }
};

// Get an item by id
export const getItem = async (id) => {
    if (!hasIndexedDB()) {
        return null;
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('items', 'readonly');
        const store = tx.objectStore('items');
        const request = store.get(id);
        return runTransactionWithResult({ transaction: tx, db }, ({ setResult, fail }) => {
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                fail(event.target.error);
            };
        });
    } catch (error) {
        logIndexedDbIssue('Error getting item:', error);
        return Promise.reject(error);
    }
};

// Delete an item by id
export const deleteItem = async (id) => {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('items', 'readwrite');
        const store = tx.objectStore('items');
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
        logIndexedDbIssue('Error deleting item:', error);
        return Promise.reject(error);
    }
};

// DB Transaction
export const saveProcess = async (process) => {
    if (!hasIndexedDB()) {
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
        logIndexedDbIssue('Error saving process:', error);
        return Promise.reject(error);
    }
};

// Get all processes
export const getProcesses = async () => {
    if (!hasIndexedDB()) {
        return [];
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('processes', 'readonly');
        const store = tx.objectStore('processes');
        const request = store.getAll();
        return runTransactionWithResult({ transaction: tx, db }, ({ setResult, fail }) => {
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                fail(event.target.error);
            };
        });
    } catch (error) {
        logIndexedDbIssue('Error getting processes:', error);
        return Promise.reject(error);
    }
};

// Get a process by id
export const getProcess = async (id) => {
    if (!hasIndexedDB()) {
        return null;
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('processes', 'readonly');
        const store = tx.objectStore('processes');
        const request = store.get(id);
        return runTransactionWithResult({ transaction: tx, db }, ({ setResult, fail }) => {
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                fail(event.target.error);
            };
        });
    } catch (error) {
        logIndexedDbIssue('Error getting process:', error);
        return Promise.reject(error);
    }
};

// Delete processes by id
export const deleteProcess = async (id) => {
    if (!hasIndexedDB()) {
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
        logIndexedDbIssue('Error deleting process:', error);
        return Promise.reject(error);
    }
};

// DB Transaction
export const saveQuest = async (quest) => {
    if (!hasIndexedDB()) {
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
        logIndexedDbIssue('Error saving quest:', error);
        return Promise.reject(error);
    }
};

// Get all quests
export const getQuests = async () => {
    if (!hasIndexedDB()) {
        return [];
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('quests', 'readonly');
        const store = tx.objectStore('quests');
        const request = store.getAll();
        return runTransactionWithResult({ transaction: tx, db }, ({ setResult, fail }) => {
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                fail(event.target.error);
            };
        });
    } catch (error) {
        logIndexedDbIssue('Error getting quests:', error);
        return Promise.reject(error);
    }
};

// Get a quest by id
export const getQuest = async (id) => {
    if (!hasIndexedDB()) {
        return null;
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('quests', 'readonly');
        const store = tx.objectStore('quests');
        const request = store.get(id);
        return runTransactionWithResult({ transaction: tx, db }, ({ setResult, fail }) => {
            request.onsuccess = () => {
                setResult(request.result);
            };
            /* istanbul ignore next */
            request.onerror = (event) => {
                fail(event.target.error);
            };
        });
    } catch (error) {
        logIndexedDbIssue('Error getting quest:', error);
        return Promise.reject(error);
    }
};

// Delete a quest by id
export const deleteQuest = async (id) => {
    if (!hasIndexedDB()) {
        return Promise.reject(new Error('IndexedDB is not supported'));
    }
    try {
        const db = await openCustomContentDB();
        const tx = db.transaction('quests', 'readwrite');
        const store = tx.objectStore('quests');
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
        logIndexedDbIssue('Error deleting quest:', error);
        return Promise.reject(error);
    }
};
