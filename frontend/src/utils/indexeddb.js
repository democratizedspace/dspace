import { log } from './devLog.js';

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
                db.createObjectStore(STORE_NAME, {
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

export const openCustomContentDB = () => {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('CustomContent', 1);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

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
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

// DB Transaction
export const saveItem = async (item) => {
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
            tx.onerror = () => {
                reject(tx.error);
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
            request.onerror = () => {
                reject(request.error);
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
            request.onerror = () => {
                reject(request.error);
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
            tx.onerror = () => {
                reject(tx.error);
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
            request.onerror = () => {
                reject(request.error);
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
            request.onerror = () => {
                reject(request.error);
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
            tx.onerror = () => {
                reject(tx.error);
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
            tx.onerror = () => {
                reject(tx.error);
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
            request.onerror = () => {
                reject(request.error);
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
            request.onerror = () => {
                reject(request.error);
                db.close();
            };
        });
    } catch (error) {
        console.error('Error getting quest:', error);
        return Promise.reject(error);
    }
};
