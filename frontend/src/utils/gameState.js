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
// import questData from '../../pages/quests/json';

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

// INVENTORY
export const addItems = (items) => {
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

// PROCESSES
export const startProcess = (processId, consumeItems) => {
  gameState.processes[processId] = {
    startedAt: Date.now(),
  };
  burnItems(consumeItems);
  saveGameState(gameState);
};

export const processFinished = (processId, duration) => {
  const process = gameState.processes[processId];
  if (!process) return false;
  return Date.now() >= process.startedAt + duration;
};

export const finishProcess = (processId, createItems) => {
  if (processFinished(processId)) {
    gameState.processes[processId] = undefined;
    addItems(createItems);
    saveGameState(gameState);
  }
};

export const cancelProcess = (processId, consumeItems) => {
  gameState.processes[processId] = undefined;
  addItems(consumeItems);
  saveGameState(gameState);
};
