import { loadGameState, saveGameState } from './common.js';
import {
    hasItems,
    burnItems,
    addItems,
    moveInventoryItemToContainer,
    moveContainerItemToInventory,
    withdrawAllFromContainerToInventory,
    getContainerItemCount,
    isContainerItemAllowed,
} from './inventory.js';
import { durationInSeconds } from '../../utils.js';

// Using import assertions for JSON imports
import processes from '../../generated/processes.json' assert { type: 'json' };

const resolveProcessDefinition = (processId, processDefinition) =>
    processDefinition ?? processes.find((p) => p.id === processId);

const normalizeTransferCount = (value) => {
    if (value === 'all') {
        return 'all';
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getContainerTransfers = (process) =>
    Array.isArray(process?.containerItemTransfers) ? process.containerItemTransfers : [];

const hasContainerTransferRequirements = (process) => {
    const transfers = getContainerTransfers(process);

    for (const transfer of transfers) {
        const containerId = typeof transfer?.containerId === 'string' ? transfer.containerId : '';
        const itemId = typeof transfer?.itemId === 'string' ? transfer.itemId : '';
        const direction = transfer?.direction;
        const count = normalizeTransferCount(transfer?.count);

        if (!containerId || !itemId || !isContainerItemAllowed(containerId, itemId)) {
            return false;
        }

        if (direction === 'toContainer') {
            if (!hasItems([{ id: containerId, count: 1 }])) {
                return false;
            }
            if (typeof count !== 'number' || count <= 0 || !hasItems([{ id: itemId, count }])) {
                return false;
            }
            continue;
        }

        if (direction === 'toInventory') {
            const available = getContainerItemCount(containerId, itemId);
            const required = count === 'all' ? 0 : count;
            if (count !== 'all' && (typeof required !== 'number' || required <= 0)) {
                return false;
            }
            if (available < required) {
                return false;
            }
            continue;
        }

        return false;
    }

    return true;
};

const applyContainerTransfers = (process) => {
    const transfers = getContainerTransfers(process);

    for (const transfer of transfers) {
        const containerId = transfer?.containerId;
        const itemId = transfer?.itemId;
        const direction = transfer?.direction;
        const count = normalizeTransferCount(transfer?.count);

        if (direction === 'toContainer') {
            if (typeof count !== 'number' || count <= 0) {
                return false;
            }

            if (!moveInventoryItemToContainer(containerId, itemId, count)) {
                return false;
            }
            continue;
        }

        if (direction === 'toInventory') {
            if (count === 'all') {
                withdrawAllFromContainerToInventory(containerId, itemId);
                continue;
            }

            if (typeof count !== 'number' || count <= 0) {
                return false;
            }

            if (!moveContainerItemToInventory(containerId, itemId, count)) {
                return false;
            }
            continue;
        }

        return false;
    }

    return true;
};

export const hasRequiredAndConsumedItems = (processId, processDefinition) => {
    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return false;
    }
    return (
        hasItems(process.requireItems || []) &&
        hasItems(process.consumeItems || []) &&
        hasContainerTransferRequirements(process)
    );
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
        pauseModelVersion: 2,
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

export const finishProcess = (processId, processDefinition) => {
    if (getProcessState(processId).state !== ProcessStates.FINISHED) {
        return;
    }

    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return;
    }
    const createItems = process.createItems;

    if (!applyContainerTransfers(process)) {
        return;
    }

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
        startedAt: Date.now(),
        duration: durationMs,
        pausedAt: null,
        elapsedBeforePause: durationMs,
        pauseModelVersion: 2,
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

        if (Array.isArray(process.containerItemTransfers)) {
            process.containerItemTransfers.forEach((transfer) => {
                const touchesItem = transfer?.itemId === itemId || transfer?.containerId === itemId;
                if (!touchesItem) {
                    return;
                }

                if (transfer?.direction === 'toContainer') {
                    processMap[ProcessItemTypes.CONSUME_ITEM] =
                        processMap[ProcessItemTypes.CONSUME_ITEM] || [];
                    processMap[ProcessItemTypes.CONSUME_ITEM].push(process.id);
                    return;
                }

                if (transfer?.direction === 'toInventory') {
                    processMap[ProcessItemTypes.CREATE_ITEM] =
                        processMap[ProcessItemTypes.CREATE_ITEM] || [];
                    processMap[ProcessItemTypes.CREATE_ITEM].push(process.id);
                }
            });
        }
    });

    return processMap;
};

const getMatchingProcessBuckets = (process, itemId) => {
    const matchesItem = (items) =>
        Array.isArray(items) && items.some((item) => item?.id === itemId);

    const matchesContainerTransfer = Array.isArray(process?.containerItemTransfers)
        ? process.containerItemTransfers.some(
              (transfer) => transfer?.itemId === itemId || transfer?.containerId === itemId
          )
        : false;

    const createsFromContainerTransfer = Array.isArray(process?.containerItemTransfers)
        ? process.containerItemTransfers.some(
              (transfer) =>
                  (transfer?.itemId === itemId || transfer?.containerId === itemId) &&
                  transfer?.direction === 'toInventory'
          )
        : false;

    const consumesFromContainerTransfer = Array.isArray(process?.containerItemTransfers)
        ? process.containerItemTransfers.some(
              (transfer) =>
                  (transfer?.itemId === itemId || transfer?.containerId === itemId) &&
                  transfer?.direction === 'toContainer'
          )
        : false;

    return {
        require: matchesItem(process?.requireItems),
        consume: matchesItem(process?.consumeItems) || consumesFromContainerTransfer,
        create: matchesItem(process?.createItems) || createsFromContainerTransfer,
        transfer: matchesContainerTransfer,
    };
};

const addProcessIdToBucket = (processMap, bucket, processId) => {
    if (!processId) {
        return;
    }

    if (!processMap[bucket]) {
        processMap[bucket] = new Set();
    }

    processMap[bucket].add(processId);
};

export const getProcessesForItemIncludingCustom = async (itemId) => {
    const builtInProcessMap = getProcessesForItem(itemId);
    const processBuckets = Object.values(ProcessItemTypes).reduce((acc, bucket) => {
        acc[bucket] = new Set(builtInProcessMap[bucket] ?? []);
        return acc;
    }, {});

    let db;
    let ENTITY_TYPES;

    try {
        ({ db, ENTITY_TYPES } = await import('../customcontent.js'));
    } catch (error) {
        return builtInProcessMap;
    }

    let customProcesses;
    try {
        customProcesses = await db.query(ENTITY_TYPES.PROCESS, (process) => {
            const matches = getMatchingProcessBuckets(process, itemId);
            return matches.require || matches.consume || matches.create;
        });
    } catch (error) {
        return builtInProcessMap;
    }

    customProcesses.forEach((process) => {
        const matches = getMatchingProcessBuckets(process, itemId);
        if (matches.require) {
            addProcessIdToBucket(processBuckets, ProcessItemTypes.REQUIRE_ITEM, process.id);
        }
        if (matches.consume) {
            addProcessIdToBucket(processBuckets, ProcessItemTypes.CONSUME_ITEM, process.id);
        }
        if (matches.create) {
            addProcessIdToBucket(processBuckets, ProcessItemTypes.CREATE_ITEM, process.id);
        }
    });

    const mergedMap = {};
    Object.values(ProcessItemTypes).forEach((bucket) => {
        const entries = Array.from(processBuckets[bucket] ?? []);
        if (entries.length > 0) {
            mergedMap[bucket] = entries;
        }
    });

    return mergedMap;
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

    if (!applyContainerTransfers(process)) {
        return;
    }

    if (process.createItems) {
        addItems(process.createItems);
    }

    const gameState = loadGameState();
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
};
