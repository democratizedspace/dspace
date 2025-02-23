// frontend/src/utils/customcontent.js

import { addEntity, getEntity, updateEntity, deleteEntity } from './indexeddb.js';

const ENTITY_TYPE = 'quest';

function createQuest(title, description) {
    const quest = {
        type: ENTITY_TYPE,
        title,
        description,
        createdAt: new Date().toISOString(),
    };
    return addEntity(quest);
}

function getQuest(id) {
    return getEntity(id).then((quest) => {
        if (quest && quest.type === ENTITY_TYPE) {
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

export { createQuest, getQuest, updateQuest, deleteQuest };
