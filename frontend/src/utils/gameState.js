import { writable } from 'svelte/store';
import processes from '../pages/processes/processes.json';
import { durationInSeconds } from '../utils.js';

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

export const finishQuest = (questId, rewardItems) => {
  gameState.quests[questId] = { finished: true };
  addItems(rewardItems);
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

const setItemsGranted = (questId, stepId, optionIndex) => {
  const key = `${questId}-${stepId}-${optionIndex}`;
  console.log(`granting items for key=${key}`);
  gameState.quests[questId] = { ...gameState.quests[questId], itemsClaimed: [...(gameState.quests[questId].itemsClaimed || []), key] };
  saveGameState(gameState);
};

export const getItemsGranted = (questId, stepId, optionIndex) => {
  try {
    const key = `${questId}-${stepId}-${optionIndex}`;
    console.log(`key=${key}`);
    const itemsClaimed = gameState.quests[questId].itemsClaimed;
    console.log(`itemsClaimed=${itemsClaimed}`);
    return itemsClaimed.includes(key);
  } catch (e) {
    console.log("error getting items granted: ", e);
    return false;
  }
};

export const grantItems = (questId, stepId, optionIndex, itemList) => {
  if (getItemsGranted(questId, stepId, optionIndex)) {
    return;
  }
  addItems(itemList);
  setItemsGranted(questId, stepId, optionIndex);
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
};

export const getItemCount = (itemId) => {
  return getItemCounts([{ id: itemId }])[itemId];
};

export const getCurrentdUSD = () => {
  return getItemCount("24");
};

export const buyItems = (items) => {
  items.forEach(item => {
    const { price, quantity } = item;
    console.log("price: ", price);
    console.log("quantity: ", quantity);
    const currencyId = "24"; // Assuming the currency ID is always "24"

    const totalPrice = parseFloat(price) * parseFloat(quantity); // Convert price and quantity to numbers

    console.log("totalPrice: ", totalPrice);

    if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= totalPrice) {
      gameState.inventory[currencyId] -= totalPrice;
      gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + parseFloat(quantity);
    } else {
      console.log("Not enough currency to buy the item.");
    }
  });

  saveGameState(gameState);
};

export const sellItems = (items) => {
  items.forEach(item => {
    const { price, quantity } = item; // get the quantity from the item
    const currencyId = "24"; // Assuming the currency ID is always "24"

    if (gameState.inventory[item.id] && gameState.inventory[item.id] >= quantity) {
      gameState.inventory[item.id] -= quantity;
      gameState.inventory[currencyId] = (gameState.inventory[currencyId] || 0) + price * quantity;
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

export const hasRequiredAndConsumedItems = (processId) => {
  const process = processes.find((p) => p.id === processId);
  if (!process) {
    return false;
  }
  return hasItems(process.requireItems) && hasItems(process.consumeItems);
};

export const startProcess = (processId) => {
  const process = processes.find((p) => p.id === processId);

  if (!hasRequiredAndConsumedItems(processId)) {
    console.log("Not enough items to start the process.");
    return;
  }

  gameState.processes[processId] = {
    startedAt: Date.now(),
    duration: durationInSeconds(process.duration) * 1000,
  };
  burnItems(process.consumeItems);
  saveGameState(gameState);
};

export const ProcessStates = {
  NOT_STARTED: "not started",
  IN_PROGRESS: "in progress",
  FINISHED: "finished",
};

export const getProcessState = (processId) => {
  const process = gameState.processes[processId];
  if (!process || !process.startedAt) {
    return { state: ProcessStates.NOT_STARTED, progress: 0 };
  }

  const elapsed = Date.now() - process.startedAt;
  let progress = Math.min(1, elapsed / process.duration);
  
  progress = progress < 0.001 ? 0 : progress;

  if (process.startedAt + process.duration <= Date.now()) {
    return { state: ProcessStates.FINISHED, progress: progress * 100 };
  }

  return { state: ProcessStates.IN_PROGRESS, progress: progress * 100 };
};

export const getProcessStartedAt = (processId) => {
  const process = gameState.processes[processId];
  if (process && process.startedAt) {
    return process.startedAt;
  }
  return undefined;
};

export const getProcessProgress = (processId) => {
  const process = gameState.processes[processId];
  if (!process || !process.startedAt) return 0;
  const elapsed = Date.now() - process.startedAt;
  const progress = Math.min(1, elapsed / process.duration);
  return progress * 100;
};

export const finishProcess = (processId) => {
  if (getProcessState(processId).state === ProcessStates.FINISHED) {
    console.log("finishing process");
    const process = processes.find((p) => p.id === processId);
    const createItems = process.createItems;

    gameState.processes[processId] = undefined;
    addItems(createItems);
    saveGameState(gameState);
    console.log("Process finished.");
  }
};


export const cancelProcess = (processId) => {
  const process = processes.find((p) => p.id === processId);

  if (!process) {
    return;
  }

  try {
    const consumeItems = process.consumeItems;
    // Return the consumed items to the player's inventory
    addItems(consumeItems);
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
    console.log("Process cancelled.");
  } catch (e) {
    console.log("Error cancelling process: ", e);

  }
};

export const ProcessItemTypes = {
  REQUIRE_ITEM: "requireItem",
  CONSUME_ITEM: "consumeItem",
  CREATE_ITEM: "createItem",
};

export const getProcessesForItem = (itemId) => {
  const processMap = {};

  processes.forEach((process) => {
    if (process.requireItems) {
      process.requireItems.forEach((item) => {
        if (item.id === itemId) {
          processMap[ProcessItemTypes.REQUIRE_ITEM] =
            processMap[ProcessItemTypes.REQUIRE_ITEM] || [];
          processMap[ProcessItemTypes.REQUIRE_ITEM].push(process.id);
        }
      });
    }

    if (process.consumeItems) {
      process.consumeItems.forEach((item) => {
        if (item.id === itemId) {
          processMap[ProcessItemTypes.CONSUME_ITEM] =
            processMap[ProcessItemTypes.CONSUME_ITEM] || [];
          processMap[ProcessItemTypes.CONSUME_ITEM].push(process.id);
        }
      });
    }

    if (process.createItems) {
      process.createItems.forEach((item) => {
        if (item.id === itemId) {
          processMap[ProcessItemTypes.CREATE_ITEM] =
            processMap[ProcessItemTypes.CREATE_ITEM] || [];
          processMap[ProcessItemTypes.CREATE_ITEM].push(process.id);
        }
      });
    }
  });

  return processMap;
};


// ---------------------
// IMPORTER
// ---------------------

export const VERSIONS = {
  V1: "1",
  V2: "2",
}

export const setVersionNumber = (versionNumber) => {
  gameState.versionNumberString = versionNumber;
  saveGameState(gameState);
}

export const getVersionNumber = () => {
  return gameState.versionNumberString;
}

// v1 -> v2
export const importV1V2 = (itemList) => {
  const award = {
    "id": "85",
    "count": 1
  }

  addItems([
    award,
    ...itemList
  ]);
  setVersionNumber(VERSIONS.V2);
  saveGameState(gameState);
}