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
  saveItem,
  saveProcess,
  saveQuest
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
    const store = getStoreForEntityType(entityType);
    const preparedEntity = {
      ...entity,
      type: entityType,
      createdAt: new Date().toISOString()
    };
    return addEntity(preparedEntity);
  },
  
  get: (entityType, id) => {
    return getEntity(id).then(entity => {
      if (entity && entity.type === entityType) {
        return entity;
      }
      throw new Error(`${entityType} not found with id: ${id}`);
    });
  },
  
  update: (entityType, id, updates) => {
    return getEntity(id).then(entity => {
      if (!entity || entity.type !== entityType) {
        throw new Error(`${entityType} not found with id: ${id}`);
      }
      
      const updatedEntity = {
        ...entity,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return updateEntity(updatedEntity);
    });
  },
  
  delete: (entityType, id) => {
    return getEntity(id).then(entity => {
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
  
  // Specialized entity operations
  quests: {
    add: (quest) => {
      const { title, description, image = '/assets/quests/howtodoquests.jpg', ...rest } = quest;
      return db.add(ENTITY_TYPES.QUEST, { 
        title, 
        description, 
        image, 
        custom: true,
        ...rest
      });
    },
    get: (id) => db.get(ENTITY_TYPES.QUEST, id),
    update: (id, updates) => db.update(ENTITY_TYPES.QUEST, id, updates),
    delete: (id) => db.delete(ENTITY_TYPES.QUEST, id),
    list: () => db.list(ENTITY_TYPES.QUEST),
    query: (filterFn) => db.query(ENTITY_TYPES.QUEST, filterFn)
  },
  
  items: {
    add: (item) => {
      const { name, description, image = null, price = null, unit = null, itemType = null, ...rest } = item;
      return db.add(ENTITY_TYPES.ITEM, { 
        name, 
        description, 
        image, 
        price, 
        unit, 
        itemType,
        ...rest
      });
    },
    get: (id) => db.get(ENTITY_TYPES.ITEM, id),
    update: (id, updates) => db.update(ENTITY_TYPES.ITEM, id, updates),
    delete: (id) => db.delete(ENTITY_TYPES.ITEM, id),
    list: () => db.list(ENTITY_TYPES.ITEM),
    query: (filterFn) => db.query(ENTITY_TYPES.ITEM, filterFn)
  },
  
  processes: {
    add: (process) => {
      const { 
        title, 
        duration, 
        requireItems = [], 
        consumeItems = [], 
        createItems = [],
        ...rest
      } = process;
      
      return db.add(ENTITY_TYPES.PROCESS, { 
        title, 
        duration, 
        requireItems, 
        consumeItems, 
        createItems,
        ...rest
      });
    },
    get: (id) => db.get(ENTITY_TYPES.PROCESS, id),
    update: (id, updates) => db.update(ENTITY_TYPES.PROCESS, id, updates),
    delete: (id) => db.delete(ENTITY_TYPES.PROCESS, id),
    list: () => db.list(ENTITY_TYPES.PROCESS),
    query: (filterFn) => db.query(ENTITY_TYPES.PROCESS, filterFn)
  }
};

// Legacy API for backward compatibility
// Keep these exports to avoid breaking existing code
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

export function createItem(name, description, image = null, price = null, unit = null, type = null) {
  return db.items.add({ name, description, image, price, unit, itemType: type });
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

export function createProcess(title, duration, requireItems = [], consumeItems = [], createItems = []) {
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
