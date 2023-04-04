import processes from '../pages/processes/processes.json';
import { durationInSeconds } from '../utils.js';

// INTERNAL: GAMESTATE
const gameStateKey = 'gameState';

const saveGameState = (gameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState));
};

const loadGameState = () => {
  const storedGameState = localStorage.getItem(gameStateKey);
  if (storedGameState) {
    return JSON.parse(storedGameState);
  }
  return initializeGameState();
};

const initializeGameState = () => {
  return {
    quests: {},
    inventory: {},
    processes: {},
  };
};

let gameState = loadGameState();

// QUESTS

export const finishQuest = (questId) => {
  gameState.quests[questId] = { finished: true };
  saveGameState(gameState);
};

export const questFinished = (questId) => {
  console.log(`is ${questId} finished?}`);
  const finished = gameState.quests[questId] ? gameState.quests[questId].finished : false;
  console.log("finished? ", finished);
  return finished;
};

export const canStartQuest = (quest) => {
  console.log("can start quest? ", quest.id);

  if (questFinished(quest.id)) {
    return false;
  }

  const requiresQuests = quest.default.requiresQuests;

  if (requiresQuests) {
    for (let i = 0; i < requiresQuests.length; i++) {
      if (!questFinished(requiresQuests[i])) {
        return false;
      }
    }
  }

  return true;
};

export const setCurrentDialogueStep = (questId, stepId) => {
  gameState.quests[questId] = { stepId };
  saveGameState(gameState);
};

export const getCurrentDialogueStep = (questId) => {
  return gameState.quests[questId] ? gameState.quests[questId].stepId : 0;
};

const setItemsGranted = ( questId, stepId ) => {
  const key = `${questId}-${stepId}`;
  gameState.quests[questId] = { ...gameState.quests[questId], itemsClaimed: [...(gameState.quests[questId].itemsClaimed || []), key] };
  saveGameState(gameState);
};

export const getItemsGranted = ( questId, stepId ) => {
  try {
  const key = `${questId}-${stepId}`;
  return gameState.quests[questId].itemsClaimed.includes(key);
  } catch (e) {
    console.log("error getting items granted: ", e);
    return false;
  }
};

export const grantItems = (questId, stepId, grantsItems) => {
  if (getItemsGranted(questId, stepId)) {
    return;
  }
  addItems(grantsItems);
  setItemsGranted(questId, stepId);
}

// INVENTORY
export const addItems = (items) => {
  console.log("adding items: ", JSON.stringify(items));
  items.forEach(({ id, count }) => {
    gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
  });
  saveGameState(gameState);
};

export const burnItems = (items) => {
  items.forEach(({ id, count }) => {
    if (gameState.inventory[id]) {
      gameState.inventory[id] -= count;
      if (gameState.inventory[id] < 0) {
        gameState.inventory[id] = 0;
      }
    }
  });
  saveGameState(gameState);
};

export const getItemCounts = (itemList) => {
  const counts = {};
  itemList.forEach((item) => {
    counts[item.id] = gameState.inventory[item.id] || 0;
  });
  return counts;
}

// PROCESSES
export const startProcess = (processId) => {
  console.log("starting process: ", processId);
  const process = processes.find((p) => p.id === processId);

  gameState.processes[processId] = {
    startedAt: Date.now(),
  };
  burnItems(process.consumeItems);
  saveGameState(gameState);
};

export const getRemainingProcessTime = (processId) => {
  const process = gameState.processes[processId];
  if (!process) return 0;
  return Math.max(0, process.startedAt + duration - Date.now());
};

export const processFinished = (processId) => {
  const process = gameState.processes[processId];
  if (!process) return false;
  return process.startedAt + durationInSeconds(process.duration) * 1000 < Date.now();
};

export const finishProcess = (processId) => {
  if (!processFinished(processId)) {
    return;
  }

  const process = processes.find((p) => p.id === processId);
  const createItems = process.createItems;
  
  gameState.processes[processId] = undefined;
  addItems(createItems);
  saveGameState(gameState);
};

export const cancelProcess = (processId, consumeItems) => {
  gameState.processes[processId] = undefined;
  addItems(consumeItems);
  saveGameState(gameState);
};
