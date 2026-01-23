export function getQuestSimulationSummary(quest) {
    const nodes = new Map();
    (quest.dialogue || []).forEach((node) => nodes.set(node.id, node));
    const startId = quest.start || 'start';

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
        missingStart: !nodes.has(startId),
        unreachableNodes,
    };
}

export function questHasFinishPath(quest) {
    return getQuestSimulationSummary(quest).hasFinishPath;
}
