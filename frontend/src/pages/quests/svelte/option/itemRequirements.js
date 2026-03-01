export function areItemRequirementsMet(requirements = [], inventory) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    const normalizedInventory = inventory ?? {};

    return requirements.every((item) => {
        const available = normalizedInventory[item.id] ?? 0;
        return available >= item.count;
    });
}

export function areContainedItemRequirementsMet(requirements = [], itemContainerCounts) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    const normalizedContainerCounts = itemContainerCounts ?? {};

    return requirements.every((requirement) => {
        const containerCounts = normalizedContainerCounts[requirement.containerId] ?? {};
        const available = containerCounts[requirement.id] ?? 0;
        return available >= requirement.count;
    });
}

export function areOptionRequirementsMet(option = {}, gameState = {}) {
    return (
        areItemRequirementsMet(option.requiresItems, gameState.inventory) &&
        areContainedItemRequirementsMet(
            option.requiresContainedItems,
            gameState.itemContainerCounts
        )
    );
}
