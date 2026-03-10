export function getQuestSimulationSummary(quest) {
    const nodes = new Map();
    (quest.dialogue || []).forEach((node) => nodes.set(node.id, node));
    const startId = quest.start || 'start';
    const missingStart = !nodes.has(startId);

    if (missingStart) {
        return {
            hasFinishPath: false,
            missingStart: true,
            unreachableNodes: Array.from(nodes.keys()),
        };
    }

    const queue = [startId];
    const visited = new Set();
    let hasFinishPath = false;

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        const node = nodes.get(nodeId);
        if (!node) continue;
        const options = node.options || [];
        for (const opt of options) {
            if (opt.type === 'finish') {
                hasFinishPath = true;
            }
            if (opt.goto) {
                queue.push(opt.goto);
            }
        }
    }

    const allNodeIds = Array.from(nodes.keys());
    const unreachableNodes = allNodeIds.filter((id) => !visited.has(id));

    return {
        hasFinishPath,
        missingStart,
        unreachableNodes,
    };
}

export function questHasFinishPath(quest) {
    return getQuestSimulationSummary(quest).hasFinishPath;
}

export function getQuestProcessPathSummary(quest) {
    const nodes = new Map();
    (quest.dialogue || []).forEach((node) => nodes.set(node.id, node));
    const startId = quest.start || 'start';

    if (!nodes.has(startId)) {
        return {
            hasFinishPath: false,
            hasProcessOnEveryFinishPath: false,
            hasAnyProcessPath: false,
        };
    }

    const queue = [{ nodeId: startId, usedProcess: false }];
    const visited = new Set();
    let hasFinishPath = false;
    let hasAnyProcessPath = false;
    let hasFinishWithoutProcess = false;

    while (queue.length > 0) {
        const { nodeId, usedProcess } = queue.shift();
        const stateKey = `${nodeId}|${usedProcess ? 'process' : 'none'}`;
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        const node = nodes.get(nodeId);
        if (!node) continue;

        const options = node.options || [];
        const nodeHasProcessOption = options.some((option) => option.type === 'process');

        for (const option of options) {
            const nextUsedProcess = usedProcess || option.type === 'process';
            const nextUsedProcessAfterSameNodeAction = usedProcess || nodeHasProcessOption;

            if (option.type === 'finish') {
                hasFinishPath = true;
                if (nextUsedProcessAfterSameNodeAction) {
                    hasAnyProcessPath = true;
                } else {
                    hasFinishWithoutProcess = true;
                }
            }

            if (option.goto) {
                const usedProcessForGoto =
                    !usedProcess && nodeHasProcessOption && option.type !== 'process'
                        ? true
                        : nextUsedProcess;
                queue.push({ nodeId: option.goto, usedProcess: usedProcessForGoto });
            }
        }
    }

    return {
        hasFinishPath,
        hasProcessOnEveryFinishPath: hasFinishPath && !hasFinishWithoutProcess,
        hasAnyProcessPath,
    };
}

export function questRequiresProcessOnAllFinishPaths(quest) {
    return getQuestProcessPathSummary(quest).hasProcessOnEveryFinishPath;
}
