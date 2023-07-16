import { loadGameState, saveGameState,  } from "./gameState/common.js";
import { burnItems, addItems, getItemCounts, getItemCount, getCurrentdUSD, buyItems } from "./gameState/inventory.js";

import processes from "../pages/processes/processes.json";

// ---------------------
// QUESTS
// ---------------------

export const finishQuest = (questId, rewardItems) => {
  const gameState = loadGameState();

  gameState.quests[questId] = { finished: true };
  addItems(rewardItems);
  saveGameState(gameState);
};

export const questFinished = (questId) => {
  const gameState = loadGameState();

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
  const gameState = loadGameState();

  gameState.quests[questId] = { stepId };
  saveGameState(gameState);
};

export const getCurrentDialogueStep = (questId) => {
  const gameState = loadGameState();

  return gameState.quests[questId] ? gameState.quests[questId].stepId : 0;
};

const setItemsGranted = (questId, stepId, optionIndex) => {
  const gameState = loadGameState();

  const key = `${questId}-${stepId}-${optionIndex}`;
  gameState.quests[questId] = { ...gameState.quests[questId], itemsClaimed: [...(gameState.quests[questId].itemsClaimed || []), key] };
  saveGameState(gameState);
};

export const getItemsGranted = (questId, stepId, optionIndex) => {
  const gameState = loadGameState();

  try {
    const key = `${questId}-${stepId}-${optionIndex}`;
    const itemsClaimed = gameState.quests[questId].itemsClaimed;
    return itemsClaimed.includes(key);
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const grantItems = (questId, stepId, optionIndex, itemList) => {
  if (getItemsGranted(questId, stepId, optionIndex)) {
    return;
  }
  addItems(itemList);
  setItemsGranted(questId, stepId, optionIndex);
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
  const gameState = loadGameState();

  const process = processes.find((p) => p.id === processId);

  if (!hasRequiredAndConsumedItems(processId)) {
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
  const gameState = loadGameState();

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
  const gameState = loadGameState();

  const process = gameState.processes[processId];
  if (process && process.startedAt) {
    return process.startedAt;
  }
  return undefined;
};

export const getProcessProgress = (processId) => {
  const gameState = loadGameState();

  const process = gameState.processes[processId];
  if (!process || !process.startedAt) return 0;
  const elapsed = Date.now() - process.startedAt;
  const progress = Math.min(1, elapsed / process.duration);
  return progress * 100;
};

export const finishProcess = (processId) => {
  const gameState = loadGameState();

  if (getProcessState(processId).state === ProcessStates.FINISHED) {
    const process = processes.find((p) => p.id === processId);
    const createItems = process.createItems;

    gameState.processes[processId] = undefined;
    addItems(createItems);
    saveGameState(gameState);
  }
};


export const cancelProcess = (processId) => {
  const gameState = loadGameState();
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
  } catch (e) {
    console.error(e);
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

export const skipProcess = (processId) => {
  const gameState = loadGameState();

  const process = processes.find((p) => p.id === processId);
  if (!process) {
    return;
  }

  cancelProcess(processId);
  burnItems(process.consumeItems);
  addItems(process.createItems);
  saveGameState(gameState);
};


// ---------------------
// IMPORTER
// ---------------------

export const VERSIONS = {
  V1: "1",
  V2: "2",
}

export const setVersionNumber = (versionNumber) => {
  const gameState = loadGameState();

  gameState.versionNumberString = versionNumber;
  saveGameState(gameState);
}

export const getVersionNumber = () => {
  const gameState = loadGameState();

  return gameState.versionNumberString;
}

// v1 -> v2
export const importV1V2 = (itemList) => {
  const gameState = loadGameState();

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