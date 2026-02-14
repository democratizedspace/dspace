export const getQuestTreesFromModulePaths = (modulePaths = []) => {
    const trees = modulePaths
        .map((modulePath) => {
            const normalizedPath = String(modulePath).replace(/\\/g, '/');
            const match = normalizedPath.match(/\/quests\/json\/([^/]+)\//);
            return match?.[1]?.toLowerCase() ?? '';
        })
        .filter(Boolean);

    return [...new Set(trees)].sort((left, right) => left.localeCompare(right));
};
