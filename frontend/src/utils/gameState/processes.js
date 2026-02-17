import { loadGameState, saveGameState } from './common.js';
import { hasItems, burnItems, addItems } from './inventory.js';
import {
    addStoredItems,
    canStoreItemInContainer,
    getStoredItemCount,
    removeAllStoredItems,
    removeStoredItems,
} from './itemContainers.js';
import { durationInSeconds } from '../../utils.js';

// Using import assertions for JSON imports
import processes from '../../generated/processes.json' assert { type: 'json' };

const resolveProcessDefinition = (processId, processDefinition) =>
    processDefinition ?? processes.find((p) => p.id === processId);

const getItemCountOperations = (process, runtimeOptions = {}) => {
    const operations = Array.isArray(process?.itemCountOperations)
        ? [...process.itemCountOperations]
        : [];

    const depositRule = process?.containerDeposit;
    if (depositRule) {
        const normalizedAmount = Number(runtimeOptions.containerDepositAmount);
        const minimumAmount = Number(depositRule.min ?? 1);
        const safeMinimum = Number.isFinite(minimumAmount) ? Math.max(minimumAmount, 0) : 0;

        if (Number.isFinite(normalizedAmount) && normalizedAmount >= safeMinimum) {
            operations.push({
                operation: 'deposit',
                containerItemId: depositRule.containerItemId,
                itemId: depositRule.itemId,
                count: normalizedAmount,
            });
        }
    }

    if (process?.containerWithdrawAll) {
        operations.push({
            operation: 'withdraw-all',
            containerItemId: process.containerWithdrawAll.containerItemId,
            itemId: process.containerWithdrawAll.itemId,
        });
    }

    return operations;
};

const getRuntimeConsumeItems = (process, runtimeOptions = {}) => {
    const consumeItems = [...(process.consumeItems || [])];
    const depositRule = process.containerDeposit;

    if (!depositRule) {
        return consumeItems;
    }

    const normalizedAmount = Number(runtimeOptions.containerDepositAmount);
    const minimumAmount = Number(depositRule.min ?? 1);
    const safeMinimum = Number.isFinite(minimumAmount) ? Math.max(minimumAmount, 0) : 0;

    if (!Number.isFinite(normalizedAmount) || normalizedAmount < safeMinimum) {
        return consumeItems;
    }

    return consumeItems.map((item) => {
        if (item.id !== depositRule.itemId) {
            return item;
        }
        return {
            ...item,
            count: normalizedAmount,
        };
    });
};

export const hasRequiredAndConsumedItems = (processId, processDefinition, runtimeOptions = {}) => {
    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return false;
    }

    const runtimeConsumeItems = getRuntimeConsumeItems(process, runtimeOptions);
    return hasItems(process.requireItems || []) && hasItems(runtimeConsumeItems || []);
};

export const getItemCountOperationStartIssues = (
    processId,
    processDefinition,
    runtimeOptions = {}
) => {
    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return ['unknown process'];
    }

    const operations = getItemCountOperations(process, runtimeOptions);
    const issues = [];

    operations.forEach((operation) => {
        const containerItemId = operation?.containerItemId;
        const itemId = operation?.itemId;
        const count = Number(operation?.count);

        if (!canStoreItemInContainer(containerItemId, itemId)) {
            issues.push('container does not support this item');
            return;
        }

        if (operation.operation === 'deposit' || operation.operation === 'withdraw') {
            if (!Number.isFinite(count) || count <= 0) {
                issues.push(`${operation.operation} amount must be greater than 0`);
                return;
            }
        }

        if (operation.operation === 'withdraw') {
            const available = getStoredItemCount(containerItemId, itemId);
            if (available < count) {
                issues.push('not enough stored items to withdraw');
            }
        }
    });

    return issues;
};

export const startProcess = (processId, processDefinition, runtimeOptions = {}) => {
    const gameState = loadGameState();

    const process = resolveProcessDefinition(processId, processDefinition);
    if (!process) {
        return;
    }

    const runtimeConsumeItems = getRuntimeConsumeItems(process, runtimeOptions);

    if (!hasRequiredAndConsumedItems(processId, process, runtimeOptions)) {
        console.log('Missing required items or consumed items');
        return;
    }

    const operationIssues = getItemCountOperationStartIssues(processId, process, runtimeOptions);
    if (operationIssues.length > 0) {
        console.log('Cannot start process due to item container requirements');
        return;
    }

    const itemCountOperations = getItemCountOperations(process, runtimeOptions);

    gameState.processes[processId] = {
        startedAt: Date.now(),
        duration: durationInSeconds(process.duration) * 1000,
        pausedAt: null,
        elapsedBeforePause: 0,
        pauseModelVersion: 2,
        consumeItemsSnapshot: runtimeConsumeItems,
        itemCountOperations,
    };
    saveGameState(gameState);
    if (runtimeConsumeItems) {
        burnItems(runtimeConsumeItems);
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
    const gameState = loadGameState();
    const processState = gameState.processes[processId];

    const createItems = process.createItems;

    if (createItems) {
        addItems(createItems);
    }

    const itemCountOperations =
        processState?.itemCountOperations ??
        getItemCountOperations(process, { containerDepositAmount: 0 });

    itemCountOperations.forEach((operation) => {
        const amount = Number(operation?.count);

        if (operation.operation === 'deposit') {
            addStoredItems(operation.containerItemId, operation.itemId, amount);
            return;
        }

        if (operation.operation === 'withdraw') {
            const removed = removeStoredItems(operation.containerItemId, operation.itemId, amount);
            if (removed > 0) {
                addItems([{ id: operation.itemId, count: removed }]);
            }
            return;
        }

        if (operation.operation === 'withdraw-all') {
            const removed = removeAllStoredItems(operation.containerItemId, operation.itemId);
            if (removed > 0) {
                addItems([{ id: operation.itemId, count: removed }]);
            }
        }
    });

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

    const consumeItems =
        gameState.processes[processId]?.consumeItemsSnapshot ?? process.consumeItems;
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
    });

    return processMap;
};

const getMatchingProcessBuckets = (process, itemId) => {
    const matchesItem = (items) =>
        Array.isArray(items) && items.some((item) => item?.id === itemId);

    return {
        require: matchesItem(process?.requireItems),
        consume: matchesItem(process?.consumeItems),
        create: matchesItem(process?.createItems),
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

    if (process.createItems) {
        addItems(process.createItems);
    }

    const itemCountOperations = getItemCountOperations(process);
    itemCountOperations.forEach((operation) => {
        if (operation.operation === 'deposit') {
            addStoredItems(operation.containerItemId, operation.itemId, operation.count);
            return;
        }

        if (operation.operation === 'withdraw') {
            const removed = removeStoredItems(
                operation.containerItemId,
                operation.itemId,
                operation.count
            );
            if (removed > 0) {
                addItems([{ id: operation.itemId, count: removed }]);
            }
            return;
        }

        if (operation.operation === 'withdraw-all') {
            const removed = removeAllStoredItems(operation.containerItemId, operation.itemId);
            if (removed > 0) {
                addItems([{ id: operation.itemId, count: removed }]);
            }
        }
    });

    const gameState = loadGameState();
    gameState.processes[processId] = undefined;
    saveGameState(gameState);
};
