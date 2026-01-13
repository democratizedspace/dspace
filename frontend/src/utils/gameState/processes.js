import { loadGameState, saveGameState } from './common.js';
import { hasItems, burnItems, addItems } from './inventory.js';
import { durationInSeconds } from '../../utils.js';

// Using import assertions for JSON imports
import processes from '../../generated/processes.json' assert { type: 'json' };

const PAUSE_MODEL_VERSION = 2;

const coercePositiveMs = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return 0;
    }
    return Math.max(0, Math.round(number));
};

const isLegacyPaused = (process) => process?.pausedAt != null && !process?.pauseModelVersion;

const getSegmentElapsedMs = (process, now) => {
    if (!process?.startedAt) {
        return 0;
    }
    const segmentElapsed =
        process.pausedAt != null ? process.pausedAt - process.startedAt : now - process.startedAt;
    return Math.max(0, coercePositiveMs(segmentElapsed));
};

const getElapsedMs = (process, now = Date.now()) => {
    if (!process?.startedAt) {
        return 0;
    }

    const elapsedBeforePause = coercePositiveMs(process.elapsedBeforePause);
    if (isLegacyPaused(process)) {
        return elapsedBeforePause;
    }

    return elapsedBeforePause + getSegmentElapsedMs(process, now);
};

const getEffectiveStartMs = (process) => {
    if (!process?.startedAt) {
        return undefined;
    }

    const elapsedBeforePause = coercePositiveMs(process.elapsedBeforePause);
    if (isLegacyPaused(process)) {
        const segmentElapsed = getSegmentElapsedMs(process, process.pausedAt);
        const priorElapsed = Math.max(0, elapsedBeforePause - segmentElapsed);
        return process.startedAt - priorElapsed;
    }

    return process.startedAt - elapsedBeforePause;
};

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

    if (!process || !hasRequiredAndConsumedItems(processId)) {
        console.log('Missing required items or consumed items');
        return;
    }

    gameState.processes[processId] = {
        startedAt: Date.now(),
        duration: coercePositiveMs(durationInSeconds(process.duration) * 1000),
        pausedAt: null,
        elapsedBeforePause: 0,
        pauseModelVersion: PAUSE_MODEL_VERSION,
    };
    saveGameState(gameState);
    burnItems(process.consumeItems);
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

    const elapsed = getElapsedMs(process);
    const durationMs = coercePositiveMs(process.duration);
    let progress = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;
    progress = progress < 0.001 ? 0 : progress;

    if (progress >= 1) {
        return { state: ProcessStates.FINISHED, progress: 100 };
    }

    if (process.pausedAt != null) {
        return { state: ProcessStates.PAUSED, progress: progress * 100 };
    }

    return { state: ProcessStates.IN_PROGRESS, progress: progress * 100 };
};

export const getProcessStartedAt = (processId) => {
    const gameState = loadGameState();

    const process = gameState.processes[processId];
    if (process && process.startedAt) {
        return getEffectiveStartMs(process);
    }
    return undefined;
};

export const getProcessProgress = (processId) => {
    const gameState = loadGameState();

    const process = gameState.processes[processId];
    if (!process || !process.startedAt) return 0;
    const elapsed = getElapsedMs(process);
    const durationMs = coercePositiveMs(process.duration);
    const progress = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;
    return progress * 100;
};

export const finishProcess = (processId) => {
    if (getProcessState(processId).state !== ProcessStates.FINISHED) {
        return;
    }

    const process = processes.find((p) => p.id === processId);
    if (!process) {
        return;
    }
    const createItems = process.createItems;

    addItems(createItems);

    const gameState = loadGameState();
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
};

export const cancelProcess = (processId) => {
    const gameState = loadGameState();
    const process = processes.find((p) => p.id === processId);

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
    addItems(consumeItems);
};

export const pauseProcess = (processId) => {
    const stateInfo = getProcessState(processId);
    if (stateInfo.state !== ProcessStates.IN_PROGRESS) {
        return;
    }

    const gameState = loadGameState();
    const process = gameState.processes[processId];
    if (!process) {
        return;
    }
    const now = Date.now();
    process.pausedAt = now;
    process.pauseModelVersion = PAUSE_MODEL_VERSION;
    saveGameState(gameState);
};

export const resumeProcess = (processId) => {
    const gameState = loadGameState();
    const process = gameState.processes[processId];
    if (!process || process.pausedAt == null) {
        return;
    }
    const legacyPaused = isLegacyPaused(process);
    const now = Date.now();
    const elapsedBeforePause = coercePositiveMs(process.elapsedBeforePause);
    const segmentElapsed = getSegmentElapsedMs(process, process.pausedAt);
    process.elapsedBeforePause = legacyPaused
        ? elapsedBeforePause
        : elapsedBeforePause + segmentElapsed;
    process.startedAt = now;
    process.pausedAt = null;
    process.pauseModelVersion = PAUSE_MODEL_VERSION;
    saveGameState(gameState);
};

export const finishProcessNow = (processId) => {
    const state = getProcessState(processId).state;
    if (state === ProcessStates.NOT_STARTED) {
        return;
    }

    if (state === ProcessStates.FINISHED) {
        finishProcess(processId);
        return;
    }

    const gameState = loadGameState();
    const process = gameState.processes[processId];
    const definition = processes.find((p) => p.id === processId);

    if (!process || !definition) {
        return;
    }

    const durationMs =
        typeof process.duration === 'number'
            ? coercePositiveMs(process.duration)
            : coercePositiveMs(durationInSeconds(definition.duration) * 1000);

    gameState.processes[processId] = {
        ...process,
        startedAt: Date.now(),
        duration: durationMs,
        pausedAt: null,
        elapsedBeforePause: durationMs,
        pauseModelVersion: PAUSE_MODEL_VERSION,
    };

    saveGameState(gameState);
    finishProcess(processId);
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

export const skipProcess = (processId) => {
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

    addItems(process.createItems);

    const gameState = loadGameState();
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
};
