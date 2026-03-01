const getAvailableCount = (requirement, gameState = {}) => {
    const inventory = gameState?.inventory ?? {};

    if (requirement?.containerItemId) {
        const containerCounts = gameState?.itemContainerCounts?.[requirement.containerItemId] ?? {};
        return containerCounts[requirement.id] ?? 0;
    }

    return inventory[requirement.id] ?? 0;
};

export function areItemRequirementsMet(requirements = [], gameState) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    return requirements.every((item) => {
        const available = getAvailableCount(item, gameState);
        return available >= item.count;
    });
}
