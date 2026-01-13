import { loadGameState, saveGameState } from './common.js';
import { hasItems, burnItems, addItems } from './inventory.js';
import { durationInSeconds } from '../../utils.js';

// Using import assertions for JSON imports
import processes from '../../generated/processes.json' assert { type: 'json' };

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
        console.log('Missing required items or consumed items');
        return;
    }

    gameState.processes[processId] = {
        startedAt: Date.now(),
        duration: durationInSeconds(process.duration) * 1000,
        pausedAt: null,
        elapsedBeforePause: 0,
        pauseModelVersion: 2,
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

const computeProcessTiming = (process, now = Date.now()) => {
    if (
        !process ||
        !Number.isFinite(process.startedAt) ||
        !Number.isFinite(process.duration) ||
        process.duration <= 0
    ) {
        return {
            elapsedMs: 0,
            progressRatio: 0,
            isPaused: false,
            effectiveStartMs: undefined,
        };
    }

    const elapsedBeforePause = Number(process.elapsedBeforePause ?? 0);
    const isPaused = process.pausedAt !== null && process.pausedAt !== undefined;
    const hasLegacyPauseModel = !process.pauseModelVersion;
    let segmentElapsed = 0;

    if (isPaused) {
        if (!hasLegacyPauseModel) {
            segmentElapsed = Math.max(0, process.pausedAt - process.startedAt);
        }
    } else {
        segmentElapsed = Math.max(0, now - process.startedAt);
    }

    const elapsedMs = elapsedBeforePause + segmentElapsed;
    const durationMs = Math.max(0, Number(process.duration));
    const progressRatio = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 0;
    const referenceTime = isPaused ? process.pausedAt : now;
    const effectiveStartMs =
        typeof referenceTime === 'number' ? referenceTime - elapsedMs : process.startedAt;

    return {
        elapsedMs,
        progressRatio,
        isPaused,
        effectiveStartMs,
    };
};

export const getProcessState = (processId) => {
    const gameState = loadGameState();

    const process = gameState.processes[processId];
    if (
        !process ||
        !Number.isFinite(process.startedAt) ||
        !Number.isFinite(process.duration) ||
        process.duration <= 0
    ) {
        return { state: ProcessStates.NOT_STARTED, progress: 0 };
    }

    const { progressRatio, isPaused } = computeProcessTiming(process);
    let progress = progressRatio;
    progress = progress < 0.001 ? 0 : progress;

    if (progress >= 1) {
        return { state: ProcessStates.FINISHED, progress: 100 };
    }

    if (isPaused) {
        return { state: ProcessStates.PAUSED, progress: progress * 100 };
    }

    return { state: ProcessStates.IN_PROGRESS, progress: progress * 100 };
};

export const getProcessStartedAt = (processId) => {
    const gameState = loadGameState();

    const process = gameState.processes[processId];
    if (
        process &&
        Number.isFinite(process.startedAt) &&
        Number.isFinite(process.duration) &&
        process.duration > 0
    ) {
        return computeProcessTiming(process).effectiveStartMs;
    }
    return undefined;
};

export const getProcessProgress = (processId) => {
    const gameState = loadGameState();

    const process = gameState.processes[processId];
    if (
        !process ||
        !Number.isFinite(process.startedAt) ||
        !Number.isFinite(process.duration) ||
        process.duration <= 0
    ) {
        return 0;
    }
    const { progressRatio } = computeProcessTiming(process);
    return progressRatio * 100;
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
    const now = Date.now();
    process.pausedAt = now;
    process.pauseModelVersion = 2;
    saveGameState(gameState);
};

export const resumeProcess = (processId) => {
    const gameState = loadGameState();
    const process = gameState.processes[processId];
    if (!process || process.pausedAt === null) {
        return;
    }
    const isLegacyPauseModel = !process.pauseModelVersion;
    const pausedSegment = Math.max(0, process.pausedAt - process.startedAt);
    if (!isLegacyPauseModel) {
        process.elapsedBeforePause = (process.elapsedBeforePause || 0) + pausedSegment;
    }
    process.startedAt = Date.now();
    process.pausedAt = null;
    process.pauseModelVersion = 2;
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
            ? process.duration
            : durationInSeconds(definition.duration) * 1000;

    gameState.processes[processId] = {
        ...process,
        startedAt: Date.now(),
        duration: durationMs,
        pausedAt: null,
        elapsedBeforePause: durationMs,
        pauseModelVersion: 2,
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
