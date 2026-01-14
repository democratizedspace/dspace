import { loadGameState, saveGameState } from './common.js';
import { hasItems, burnItems, addItems } from './inventory.js';
import { durationInSeconds } from '../../utils.js';

// Using import assertions for JSON imports
import processes from '../../generated/processes.json' assert { type: 'json' };

const resolveProcessDefinition = (processId, processDefinition) =>
    processDefinition ?? processes.find((p) => p.id === processId);

export const hasRequiredAndConsumedItems = (processId, processDefinition) => {
    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return false;
    }
    return hasItems(process.requireItems || []) && hasItems(process.consumeItems || []);
};

export const startProcess = (processId, processDefinition) => {
    const gameState = loadGameState();

    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return;
    }

    if (!hasRequiredAndConsumedItems(processId, process)) {
        console.log('Missing required items or consumed items');
        return;
    }

    gameState.processes[processId] = {
        startedAt: Date.now(),
        duration: durationInSeconds(process.duration) * 1000,
        pausedAt: null,
        elapsedBeforePause: 0,
    };
    saveGameState(gameState);
    if (process.consumeItems) {
        burnItems(process.consumeItems);
    }
};

export const ProcessStates = {
    NOT_STARTED: 'not started',
    IN_PROGRESS: 'in progress',
    FINISHED: 'finished',
    PAUSED: 'paused',
};

export const getProcessState = (processId) => {
    const gameState = loadGameState();

    const process = gameState.processes[processId];
    if (!process || !process.startedAt) {
        return { state: ProcessStates.NOT_STARTED, progress: 0 };
    }

    let elapsed = process.elapsedBeforePause || 0;
    if (process.pausedAt) {
        elapsed += process.pausedAt - process.startedAt;
    } else {
        elapsed += Date.now() - process.startedAt;
    }

    let progress = Math.min(1, elapsed / process.duration);
    progress = progress < 0.001 ? 0 : progress;

    if (progress >= 1) {
        return { state: ProcessStates.FINISHED, progress: 100 };
    }

    if (process.pausedAt) {
        return { state: ProcessStates.PAUSED, progress: progress * 100 };
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

export const finishProcess = (processId, processDefinition) => {
    if (getProcessState(processId).state !== ProcessStates.FINISHED) {
        return;
    }

    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return;
    }
    const createItems = process.createItems;

    if (createItems) {
        addItems(createItems);
    }

    const gameState = loadGameState();
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
};

export const cancelProcess = (processId, processDefinition) => {
    const gameState = loadGameState();
    const process = resolveProcessDefinition(processId, processDefinition);

    if (!process) {
        return;
    }

    const processState = getProcessState(processId);
    if (
        processState.state === ProcessStates.FINISHED ||
        processState.state === ProcessStates.NOT_STARTED
    ) {
        return;
    }

    const consumeItems = process.consumeItems;
    // Return the consumed items to the player's inventory
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
    if (consumeItems) {
        addItems(consumeItems);
    }
};

export const pauseProcess = (processId) => {
    const stateInfo = getProcessState(processId);
    if (stateInfo.state !== ProcessStates.IN_PROGRESS) {
        return;
    }

    const gameState = loadGameState();
    const process = gameState.processes[processId];
    const now = Date.now();
    process.elapsedBeforePause = (process.elapsedBeforePause || 0) + (now - process.startedAt);
    process.pausedAt = now;
    saveGameState(gameState);
};

export const resumeProcess = (processId) => {
    const gameState = loadGameState();
    const process = gameState.processes[processId];
    if (!process || process.pausedAt === null) {
        return;
    }
    process.startedAt = Date.now();
    process.pausedAt = null;
    saveGameState(gameState);
};

export const finishProcessNow = (processId, processDefinition) => {
    const state = getProcessState(processId).state;
    if (state === ProcessStates.NOT_STARTED) {
        return;
    }

    if (state === ProcessStates.FINISHED) {
        finishProcess(processId, processDefinition);
        return;
    }

    const gameState = loadGameState();
    const process = gameState.processes[processId];
    const definition = resolveProcessDefinition(processId, processDefinition);

    if (!process || !definition) {
        return;
    }

    const durationMs =
        typeof process.duration === 'number'
            ? process.duration
            : durationInSeconds(definition.duration) * 1000;

    gameState.processes[processId] = {
        ...process,
        startedAt: Date.now() - durationMs,
        duration: durationMs,
        pausedAt: null,
        elapsedBeforePause: durationMs,
    };

    saveGameState(gameState);
    finishProcess(processId, definition);
};

export const ProcessItemTypes = {
    REQUIRE_ITEM: 'requireItem',
    CONSUME_ITEM: 'consumeItem',
    CREATE_ITEM: 'createItem',
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

export const skipProcess = (processId, processDefinition) => {
    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return;
    }

    const processState = getProcessState(processId);

    // If the process is not started, burn the required items. Otherwise, they
    // have already been burned.
    if (processState.state === ProcessStates.NOT_STARTED && process.consumeItems) {
        burnItems(process.consumeItems);
    }

    if (process.createItems) {
        addItems(process.createItems);
    }

    const gameState = loadGameState();
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
};
