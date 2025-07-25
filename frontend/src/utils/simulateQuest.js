export function questHasFinishPath(quest) {
    const nodes = new Map();
    (quest.dialogue || []).forEach((node) => nodes.set(node.id, node));
    const startId = quest.start || 'start';

    const queue = [startId];
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
                return true;
            }
            if (opt.goto) {
                queue.push(opt.goto);
            }
        }
    }
    return false;
}
