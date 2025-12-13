export function findQuestDependencyIssues(quests) {
    const issues = [];
    const visited = new Set();
    const stack = new Set();

    function dfs(id) {
        if (stack.has(id)) {
            issues.push(`Circular dependency involving ${id}`);
            return;
        }
        if (visited.has(id)) return;
        visited.add(id);
        const quest = quests.get(id);
        if (!quest) {
            issues.push(`Missing quest ${id}`);
            return;
        }
        stack.add(id);
        const deps = quest.requiresQuests || [];
        for (const dep of deps) {
            if (!quests.has(dep)) {
                issues.push(`${id} depends on missing quest ${dep}`);
            }
            dfs(dep);
        }
        stack.delete(id);
    }

    for (const id of quests.keys()) {
        dfs(id);
    }
    return issues;
}
