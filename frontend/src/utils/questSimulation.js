const FINISH_SENTINEL = 'finish';

const getOptionType = (option = {}) => String(option.type || '').trim();

const isFinishOption = (option = {}) => {
    const optionType = getOptionType(option);
    if (optionType === 'finish') {
        return true;
    }

    const gotoTarget = String(option.goto || '').trim();
    return gotoTarget === FINISH_SENTINEL;
};

const toId = (value) => String(value || '').trim();

const sortIds = (ids) => [...new Set(ids)].sort((a, b) => a.localeCompare(b));

export function runQuestSimulation(dialogueNodes = [], startId = '') {
    const nodes = Array.isArray(dialogueNodes) ? dialogueNodes : [];
    const nodeMap = new Map(nodes.map((node) => [toId(node.id), node]));
    const start = toId(startId);

    const issues = [];

    if (!start || !nodeMap.has(start)) {
        issues.push({
            type: 'missing_start',
            message: 'Start node is missing or does not exist in the dialogue tree.',
        });
        return {
            status: 'fail',
            issues,
            reachableNodes: [],
            unreachableNodes: sortIds(nodeMap.keys()),
            deadEnds: [],
            finishNodes: [],
        };
    }

    const adjacency = new Map();
    const reverse = new Map();
    const finishNodes = new Set();

    nodes.forEach((node) => {
        const nodeId = toId(node.id);
        if (!nodeId) {
            return;
        }

        const options = Array.isArray(node.options) ? node.options : [];
        if (options.some((option) => isFinishOption(option))) {
            finishNodes.add(nodeId);
        }

        const gotoTargets = options
            .filter((option) => getOptionType(option) === 'goto')
            .map((option) => toId(option.goto))
            .filter(Boolean)
            .filter((target) => nodeMap.has(target));

        adjacency.set(nodeId, gotoTargets);

        gotoTargets.forEach((target) => {
            if (!reverse.has(target)) {
                reverse.set(target, []);
            }
            reverse.get(target).push(nodeId);
        });
    });

    if (finishNodes.size === 0) {
        issues.push({
            type: 'missing_finish',
            message: 'No finish options were found in the dialogue nodes.',
        });
    }

    const reachableNodes = new Set();
    const stack = [start];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current || reachableNodes.has(current)) {
            continue;
        }
        reachableNodes.add(current);
        const neighbors = adjacency.get(current) || [];
        neighbors.forEach((neighbor) => {
            if (!reachableNodes.has(neighbor)) {
                stack.push(neighbor);
            }
        });
    }

    const canReachFinish = new Set(finishNodes);
    const finishStack = [...finishNodes];

    while (finishStack.length > 0) {
        const current = finishStack.pop();
        const parents = reverse.get(current) || [];
        parents.forEach((parent) => {
            if (!canReachFinish.has(parent)) {
                canReachFinish.add(parent);
                finishStack.push(parent);
            }
        });
    }

    if (!canReachFinish.has(start)) {
        issues.push({
            type: 'no_reachable_finish',
            message: 'No finish option is reachable from the start node.',
        });
    }

    const deadEnds = sortIds(
        [...reachableNodes].filter((nodeId) => !canReachFinish.has(nodeId))
    );

    if (deadEnds.length > 0) {
        issues.push({
            type: 'dead_ends',
            message: 'Some reachable nodes cannot reach a finish option.',
            nodes: deadEnds,
        });
    }

    const unreachableNodes = sortIds(
        [...nodeMap.keys()].filter((nodeId) => nodeId && !reachableNodes.has(nodeId))
    );

    if (unreachableNodes.length > 0) {
        issues.push({
            type: 'unreachable_nodes',
            message: 'Some dialogue nodes cannot be reached from the start node.',
            nodes: unreachableNodes,
        });
    }

    return {
        status: issues.length === 0 ? 'pass' : 'fail',
        issues,
        reachableNodes: sortIds(reachableNodes),
        unreachableNodes,
        deadEnds,
        finishNodes: sortIds(finishNodes),
    };
}
