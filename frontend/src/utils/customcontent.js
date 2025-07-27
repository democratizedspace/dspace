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
        return addEntity(preparedEntity);
    },

    get: (entityType, id) => {
        return getEntity(id).then((entity) => {
            if (entity && entity.type === entityType) {
                return entity;
            }
            throw new Error(`${entityType} not found with id: ${id}`);
        });
    },

    update: (entityType, id, updates) => {
        return getEntity(id).then((entity) => {
            if (!entity || entity.type !== entityType) {
                throw new Error(`${entityType} not found with id: ${id}`);
            }

            const updatedEntity = {
                ...entity,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            return updateEntity(updatedEntity);
        });
    },

    delete: (entityType, id) => {
        return getEntity(id).then((entity) => {
            if (!entity || entity.type !== entityType) {
                throw new Error(`${entityType} not found with id: ${id}`);
            }
            return deleteEntity(id);
        });
    },

    // List operations
    list: async (entityType) => {
        switch (entityType) {
            case ENTITY_TYPES.QUEST:
                return getQuests();
            case ENTITY_TYPES.ITEM:
                return getItems();
            case ENTITY_TYPES.PROCESS:
                return getProcesses();
            default:
                throw new Error(`Unknown entity type: ${entityType}`);
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
    return db.quests.add({ title, description, image });
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
    return db.items.add({ name, description, image, price, unit, type });
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
    return db.processes.add({ title, duration, requireItems, consumeItems, createItems });
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
