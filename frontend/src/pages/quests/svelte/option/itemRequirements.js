function getContainedItemCount(requirement, fullState = {}) {
    const containerId = requirement?.containerItemId;
    const itemId = requirement?.id;

    if (!containerId || !itemId) {
        return null;
    }

    const itemContainerCounts = fullState.itemContainerCounts ?? {};
    const containerContents = itemContainerCounts[containerId] ?? {};
    return containerContents[itemId] ?? 0;
}

export function areItemRequirementsMet(requirements = [], inventory, fullState = {}) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    const normalizedInventory = inventory ?? {};

    return requirements.every((item) => {
        const containedCount = getContainedItemCount(item, fullState);
        const available = containedCount ?? normalizedInventory[item.id] ?? 0;
        return available >= item.count;
    });
}
