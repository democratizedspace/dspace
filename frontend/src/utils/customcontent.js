// frontend/src/utils/customcontent.js

import {
    addEntity,
    getEntity,
    updateEntity,
    deleteEntity,
    getItems,
    getProcesses,
    getQuests,
    getStoreForEntityType,
} from './indexeddb.js';

const fallbackStores = new Map();
const fallbackCounters = new Map();

const ENTITY_KEYS = ['quest', 'item', 'process'];

ENTITY_KEYS.forEach((type) => {
    fallbackStores.set(type, new Map());
    fallbackCounters.set(type, 1);
});

const PERSISTENCE_ERROR_MESSAGES = ['IndexedDB is not supported'];

function isPersistenceUnavailable(error) {
    if (!error) {
        return false;
    }

    const message = error.message || String(error);
    return PERSISTENCE_ERROR_MESSAGES.some((text) => message.includes(text));
}

function getFallbackStore(entityType) {
    const store = fallbackStores.get(entityType);
    if (!store) {
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    return store;
}

function normalizeId(id) {
    if (typeof id === 'number') {
        return id;
    }
    if (typeof id === 'string') {
        const parsed = Number(id);
        return Number.isNaN(parsed) ? id : parsed;
    }
    return id;
}

function generateQuestId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `quest-${timestamp}-${random}`;
}

function allocateFallbackId(entityType, providedId) {
    const counter = fallbackCounters.get(entityType) ?? 1;

    if (providedId != null) {
        const normalized = normalizeId(providedId);
        if (typeof normalized === 'number') {
            fallbackCounters.set(entityType, Math.max(counter, normalized + 1));
        }
        return normalized;
    }

    fallbackCounters.set(entityType, counter + 1);
    return counter;
}

function addFallbackEntity(entityType, entity) {
    const store = getFallbackStore(entityType);
    const id = allocateFallbackId(entityType, entity.id);
    const storedEntity = {
        ...entity,
        id,
        createdAt: entity.createdAt ?? new Date().toISOString(),
    };
    store.set(id, storedEntity);
    return storedEntity;
}

function getFallbackEntity(entityType, id) {
    const store = getFallbackStore(entityType);
    const key = normalizeId(id);
    return store.get(key) ?? null;
}

function updateFallbackEntity(entityType, id, updates) {
    const store = getFallbackStore(entityType);
    const key = normalizeId(id);
    const existing = store.get(key);

    if (!existing) {
        throw new Error(`${entityType} not found with id: ${id}`);
    }

    const updatedEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    store.set(key, updatedEntity);
    return updatedEntity;
}

function deleteFallbackEntity(entityType, id) {
    const store = getFallbackStore(entityType);
    const key = normalizeId(id);

    if (!store.has(key)) {
        throw new Error(`${entityType} not found with id: ${id}`);
    }

    store.delete(key);
}

function listFallbackEntities(entityType) {
    const store = getFallbackStore(entityType);
    return Array.from(store.values());
}

/**
 * Entity types supported by the system
 */
export const ENTITY_TYPES = {
    QUEST: 'quest',
    ITEM: 'item',
    PROCESS: 'process',
};

/**
 * Database API wrapper
 * Provides a consistent interface for all entity types
 */
export const db = {
    // Generic CRUD operations
    add: (entityType, entity) => {
        getStoreForEntityType(entityType);
        const preparedEntity = {
            ...entity,
            type: entityType,
            createdAt: new Date().toISOString(),
        };
        return addEntity(preparedEntity).catch((error) => {
            if (isPersistenceUnavailable(error)) {
                const storedEntity = addFallbackEntity(entityType, preparedEntity);
                return storedEntity.id;
            }
            throw error;
        });
    },

    get: (entityType, id) => {
        return getEntity(id, entityType)
            .then((entity) => {
                if (entity && entity.type === entityType) {
                    return entity;
                }
                throw new Error(`${entityType} not found with id: ${id}`);
            })
            .catch((error) => {
                if (isPersistenceUnavailable(error)) {
                    const fallbackEntity = getFallbackEntity(entityType, id);
                    if (fallbackEntity) {
                        return fallbackEntity;
                    }
                    throw new Error(`${entityType} not found with id: ${id}`);
                }
                throw error;
            });
    },

    update: (entityType, id, updates) => {
        return getEntity(id, entityType)
            .then((entity) => {
                if (!entity || entity.type !== entityType) {
                    throw new Error(`${entityType} not found with id: ${id}`);
                }

                const updatedEntity = {
                    ...entity,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };

                return updateEntity(updatedEntity).catch((error) => {
                    if (isPersistenceUnavailable(error)) {
                        const fallbackEntity = updateFallbackEntity(entityType, id, updates);
                        return fallbackEntity.id;
                    }
                    throw error;
                });
            })
            .catch((error) => {
                if (isPersistenceUnavailable(error)) {
                    const fallbackEntity = updateFallbackEntity(entityType, id, updates);
                    return fallbackEntity.id;
                }
                throw error;
            });
    },

    delete: (entityType, id) => {
        return getEntity(id, entityType)
            .then((entity) => {
                if (!entity || entity.type !== entityType) {
                    throw new Error(`${entityType} not found with id: ${id}`);
                }
                return deleteEntity(id, entityType).catch((error) => {
                    if (isPersistenceUnavailable(error)) {
                        deleteFallbackEntity(entityType, id);
                        return;
                    }
                    throw error;
                });
            })
            .catch((error) => {
                if (isPersistenceUnavailable(error)) {
                    deleteFallbackEntity(entityType, id);
                    return;
                }
                throw error;
            });
    },

    // List operations
    list: async (entityType) => {
        const fallbackEntities = listFallbackEntities(entityType);

        try {
            switch (entityType) {
                case ENTITY_TYPES.QUEST: {
                    const quests = await getQuests();
                    return [...quests, ...fallbackEntities];
                }
                case ENTITY_TYPES.ITEM: {
                    const items = await getItems();
                    return [...items, ...fallbackEntities];
                }
                case ENTITY_TYPES.PROCESS: {
                    const processes = await getProcesses();
                    return [...processes, ...fallbackEntities];
                }
                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }
        } catch (error) {
            if (isPersistenceUnavailable(error)) {
                return fallbackEntities;
            }
            throw error;
        }
    },

    // Query operations
    query: async (entityType, filterFn) => {
        const items = await db.list(entityType);
        return items.filter(filterFn);
    },

    // Entity-specific operations
    quests: {
        add: (quest) => {
            // Ensure minimal quest structure
            const preparedQuest = {
                id: quest.id ?? generateQuestId(),
                title: quest.title || 'Untitled Quest',
                description: quest.description || '',
                image: quest.image || '/assets/quests/howtodoquests.jpg',
                custom: true,
                ...quest,
            };

            return db.add(ENTITY_TYPES.QUEST, preparedQuest);
        },

        get: (id) => db.get(ENTITY_TYPES.QUEST, id),

        update: (id, updates) => db.update(ENTITY_TYPES.QUEST, id, updates),

        delete: (id) => db.delete(ENTITY_TYPES.QUEST, id),
    },

    items: {
        add: (item) => {
            // Ensure minimal item structure
            const preparedItem = {
                name: item.name || 'Unnamed Item',
                description: item.description || '',
                image: item.image || null,
                price: item.price || null,
                unit: item.unit || null,
                type: item.type || null,
                custom: true,
                ...item,
            };

            return db.add(ENTITY_TYPES.ITEM, preparedItem);
        },

        get: (id) => db.get(ENTITY_TYPES.ITEM, id),

        update: (id, updates) => db.update(ENTITY_TYPES.ITEM, id, updates),

        delete: (id) => db.delete(ENTITY_TYPES.ITEM, id),
    },

    processes: {
        add: (process) => {
            // Ensure minimal process structure
            const preparedProcess = {
                title: process.title || 'Untitled Process',
                duration: process.duration || 60, // Default to 1 minute
                requireItems: process.requireItems || [],
                consumeItems: process.consumeItems || [],
                createItems: process.createItems || [],
                custom: true,
                ...process,
            };

            return db.add(ENTITY_TYPES.PROCESS, preparedProcess);
        },

        get: (id) => db.get(ENTITY_TYPES.PROCESS, id),

        update: (id, updates) => db.update(ENTITY_TYPES.PROCESS, id, updates),

        delete: (id) => db.delete(ENTITY_TYPES.PROCESS, id),
    },
};

// Convenience functions for common operations

export function createQuest(title, description, image = '/assets/quests/howtodoquests.jpg') {
    const id = generateQuestId();
    return db.quests.add({ id, title, description, image }).then(() => id);
}

export async function listCustomQuests() {
    try {
        const quests = await db.list(ENTITY_TYPES.QUEST);
        return quests.filter((quest) => quest.custom);
    } catch (error) {
        console.error('Error listing custom quests:', error);
        return [];
    }
}

export function getQuest(id) {
    return db.quests.get(id);
}

export function updateQuest(id, updates) {
    return db.quests.update(id, updates);
}

export function deleteQuest(id) {
    return db.quests.delete(id);
}

export function createItem(
    name,
    description,
    image = null,
    price = null,
    unit = null,
    type = null
) {
    const id = crypto.randomUUID();
    db.items.add({ id, name, description, image, price, unit, type });
    return id;
}

export function getItem(id) {
    return db.items.get(id);
}

export function updateItem(id, updates) {
    return db.items.update(id, updates);
}

export function deleteItem(id) {
    return db.items.delete(id);
}

export function createProcess(
    title,
    duration,
    requireItems = [],
    consumeItems = [],
    createItems = []
) {
    const id = crypto.randomUUID();
    return db.processes
        .add({ id, title, duration, requireItems, consumeItems, createItems })
        .then(() => id);
}

export function getProcess(id) {
    return db.processes.get(id);
}

export function updateProcess(id, updates) {
    return db.processes.update(id, updates);
}

export function deleteProcess(id) {
    return db.processes.delete(id);
}

/**
 * Export custom content as a Base64-encoded JSON string.
 * The schema {items, processes, quests} is public and must remain stable.
 */
export async function exportCustomContentString() {
    const [items, processes, quests] = await Promise.all([getItems(), getProcesses(), getQuests()]);
    return btoa(
        JSON.stringify({
            items,
            processes,
            quests,
        })
    );
}

/* istanbul ignore next */
export async function importCustomContentString(dataString) {
    let parsed;
    try {
        parsed = JSON.parse(atob(dataString));
    } catch (err) {
        throw new Error('Invalid backup data');
    }

    const { items = [], processes = [], quests = [] } = parsed;
    await Promise.all([
        ...items.map((i) => db.items.add(i)),
        ...processes.map((p) => db.processes.add(p)),
        ...quests.map((q) => db.quests.add(q)),
    ]);
}
