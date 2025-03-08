// frontend/src/utils/customcontent.js

import { addEntity, getEntity, updateEntity, deleteEntity } from './indexeddb.js';

const ENTITY_TYPES = {
    QUEST: 'quest',
    ITEM: 'item',
    PROCESS: 'process'
};

// Quest functions
function createQuest(title, description) {
    const quest = {
        type: ENTITY_TYPES.QUEST,
        title,
        description,
        createdAt: new Date().toISOString(),
    };
    return addEntity(quest);
}

function getQuest(id) {
    return getEntity(id).then((quest) => {
        if (quest && quest.type === ENTITY_TYPES.QUEST) {
            return quest;
        } else {
            throw new Error('Quest not found');
        }
    });
}

function updateQuest(id, updates) {
    return getQuest(id).then((quest) => {
        const updatedQuest = { ...quest, ...updates, updatedAt: new Date().toISOString() };
        return updateEntity(updatedQuest);
    });
}

function deleteQuest(id) {
    return deleteEntity(id);
}

// Item functions
function createItem(name, description, image = null, price = null, unit = null, type = null) {
    const item = {
        type: ENTITY_TYPES.ITEM,
        name,
        description,
        image,
        price,
        unit,
        itemType: type,
        createdAt: new Date().toISOString(),
    };
    return addEntity(item);
}

function getItem(id) {
    return getEntity(id).then((item) => {
        if (item && item.type === ENTITY_TYPES.ITEM) {
            return item;
        } else {
            throw new Error('Item not found');
        }
    });
}

function updateItem(id, updates) {
    return getItem(id).then((item) => {
        const updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
        return updateEntity(updatedItem);
    });
}

function deleteItem(id) {
    return deleteEntity(id);
}

// Process functions
function createProcess(title, duration, requireItems = [], consumeItems = [], createItems = []) {
    const process = {
        type: ENTITY_TYPES.PROCESS,
        title,
        duration,
        requireItems,
        consumeItems,
        createItems,
        createdAt: new Date().toISOString(),
    };
    return addEntity(process);
}

function getProcess(id) {
    return getEntity(id).then((process) => {
        if (process && process.type === ENTITY_TYPES.PROCESS) {
            return process;
        } else {
            throw new Error('Process not found');
        }
    });
}

function updateProcess(id, updates) {
    return getProcess(id).then((process) => {
        const updatedProcess = { ...process, ...updates, updatedAt: new Date().toISOString() };
        return updateEntity(updatedProcess);
    });
}

function deleteProcess(id) {
    return deleteEntity(id);
}

export {
    createQuest,
    getQuest,
    updateQuest,
    deleteQuest,
    createItem,
    getItem,
    updateItem,
    deleteItem,
    createProcess,
    getProcess,
    updateProcess,
    deleteProcess,
    ENTITY_TYPES
};
