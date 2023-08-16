import { loadGameState, saveGameState } from "./common.js";
import { hasItems, burnItems, addItems } from "./inventory.js";
import { durationInSeconds } from "../../utils.js";

import processes from "../../pages/processes/processes.json";

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
      console.log("Missing required items or consumed items");
      return;
    }
  
    gameState.processes[processId] = {
      startedAt: Date.now(),
      duration: durationInSeconds(process.duration) * 1000,
    };
    saveGameState(gameState);
    burnItems(process.consumeItems);
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
    if (getProcessState(processId).state === ProcessStates.FINISHED) {
      const process = processes.find((p) => p.id === processId);
      const createItems = process.createItems;
  
      addItems(createItems);
  
      const gameState = loadGameState();
      gameState.processes[processId] = undefined;
      saveGameState(gameState);
    }
  };
  
  
  export const cancelProcess = (processId) => {
    const gameState = loadGameState();
    const process = processes.find((p) => p.id === processId);
  
    if (!process) {
      return;
    }

    const processState = getProcessState(processId);
    if (processState.state === ProcessStates.FINISHED || processState.state === ProcessStates.NOT_STARTED) {
      return;
    }

    const consumeItems = process.consumeItems;
    // Return the consumed items to the player's inventory
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
    addItems(consumeItems);
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

    const processState = getProcessState(processId);

    // If the process is not started, burn the required items. Otherwise, they
    // have already been burned.
    if (processState.state === ProcessStates.NOT_STARTED) {
      burnItems(process.consumeItems);
    }

    gameState.processes[processId] = undefined;
    addItems(process.createItems);
    saveGameState(gameState);
  };