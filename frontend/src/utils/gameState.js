import { writable } from 'svelte/store';
import processes from '../pages/processes/processes.json';
import { durationInSeconds, getPriceStringComponents } from '../utils.js';

// ---------------------
// INTERNAL: GAME STATE
// ---------------------

const gameStateKey = 'gameState';

const initializeGameState = () => {
  return {
    quests: {},
    inventory: {},
    processes: {},
  };
};

export const loadGameState = () => {
  const storedGameState = localStorage.getItem(gameStateKey);
  if (storedGameState) {
    return JSON.parse(storedGameState);
  }
  return initializeGameState();
};

export const saveGameState = (gameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  state.set(gameState); // Update the state store directly
};

let gameState = loadGameState();

// Create the state store and set the initial value
export const state = writable(gameState);

// ---------------------
// QUESTS
// ---------------------

export const finishQuest = (questId) => {
  gameState.quests[questId] = { finished: true };
  saveGameState(gameState);
};

export const questFinished = (questId) => {
  const finished = gameState.quests[questId] ? gameState.quests[questId].finished : false;
  return finished;
};

export const canStartQuest = (quest) => {
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

const setItemsGranted = (questId, stepId) => {
  const key = `${questId}-${stepId}`;
  gameState.quests[questId] = { ...gameState.quests[questId], itemsClaimed: [...(gameState.quests[questId].itemsClaimed || []), key] };
  saveGameState(gameState);
};

export const getItemsGranted = (questId, stepId) => {
  console.log(`getItemsGranted: questId=${questId}, stepId=${stepId}`);
  try {
    const key = `${questId}-${stepId}`;
    console.log(`key=${key}`);
    const itemsClaimed = gameState.quests[questId].itemsClaimed;
    console.log(`itemsClaimed=${itemsClaimed}`);
    return itemsClaimed.includes(key);
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

// ---------------------
// INVENTORY
// ---------------------

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

export const getItemCounts = (itemList) => {
  const counts = {};
  itemList.forEach((item) => {
    counts[item.id] = gameState.inventory[item.id] || 0;
  });
  return counts;
}


export const buyItems = (items) => {
  console.log("buyItems: ", items);
  items.forEach(item => {
    const { price, symbol } = getPriceStringComponents(item.price);
    const currencyId = symbol.toLowerCase(); // Assuming the symbol matches the id of the currency in the inventory

    if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= price) {
      // Deduct the price from the player's currency
      gameState.inventory[currencyId] -= price;

      // Add the purchased item to the player's inventory
      gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + 1;
    } else {
      console.log("Not enough currency to buy the item.");
    }
  });

  saveGameState(gameState);
};

export const sellItems = (items) => {
  items.forEach(item => {
    const { price, symbol } = getPriceStringComponents(item.price);
    const currencyId = symbol.toLowerCase(); // Assuming the symbol matches the id of the currency in the inventory

    if (gameState.inventory[item.id] && gameState.inventory[item.id] > 0) {
      // Remove the sold item from the player's inventory
      gameState.inventory[item.id] -= 1;

      // Add the price to the player's currency
      gameState.inventory[currencyId] = (gameState.inventory[currencyId] || 0) + price;
    } else {
      console.log("No items available to sell.");
    }
  });

  saveGameState(gameState);
};

export const hasItems = (itemList) => {
  for (let i = 0; i < itemList.length; i++) {
    const { id, count } = itemList[i];
    if (!gameState.inventory[id] || gameState.inventory[id] < count) {
      return false;
    }
  }
  return true;
};


// ---------------------
// PROCESSES
// ---------------------

export const startProcess = (processId) => {
  const process = processes.find((p) => p.id === processId);

  if (!hasItems(process.consumeItems)) {
    console.log("Not enough items to start the process.");
    return;
  }

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
