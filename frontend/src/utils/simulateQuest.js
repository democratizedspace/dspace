export function questHasFinishPath(quest) {
    return simulateQuest(quest).hasFinishPath;
}

export function simulateQuest(quest) {
    const nodes = new Map();
    const dialogue = Array.isArray(quest?.dialogue) ? quest.dialogue : [];
    const issues = [];
    const danglingGotoTargets = new Set();
    let hasFinishPath = false;

    dialogue.forEach((node) => nodes.set(node.id, node));
    const startId = quest?.start || 'start';

    if (dialogue.length === 0) {
        issues.push('Quest has no dialogue nodes.');
    }

    if (!nodes.has(startId)) {
        issues.push(`Start node "${startId}" does not exist.`);
    }

    const queue = nodes.has(startId) ? [startId] : [];
    const visited = new Set();

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
                if (nodes.has(opt.goto)) {
                    queue.push(opt.goto);
                } else {
                    danglingGotoTargets.add(opt.goto);
                }
            }
        }
    }

    if (!hasFinishPath) {
        issues.push('No finish option is reachable from the start node.');
    }

    if (danglingGotoTargets.size > 0) {
        issues.push(`Missing goto target(s): ${Array.from(danglingGotoTargets).join(', ')}`);
    }

    const unreachableNodes = Array.from(nodes.keys()).filter((id) => !visited.has(id));
    if (unreachableNodes.length > 0) {
        issues.push(`Unreachable node(s): ${unreachableNodes.join(', ')}`);
    }

    return {
        hasFinishPath,
        startId,
        totalNodes: nodes.size,
        reachableNodes: visited.size,
        unreachableNodes,
        danglingGotoTargets: Array.from(danglingGotoTargets),
        issues,
    };
}
