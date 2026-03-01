const normalizeContainerRequirement = (requirement = {}) => ({
    containerItemId: requirement.containerItemId,
    itemId: requirement.itemId ?? requirement.id,
    count: Number(requirement.count ?? 0),
});

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

export function areContainedItemRequirementsMet(requirements = [], itemContainerCounts = {}) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    return requirements.every((rawRequirement) => {
        const requirement = normalizeContainerRequirement(rawRequirement);
        if (!requirement.containerItemId || !requirement.itemId || requirement.count <= 0) {
            return false;
        }

        const containerInventory = itemContainerCounts?.[requirement.containerItemId] ?? {};
        const available = Number(containerInventory[requirement.itemId] ?? 0);
        return available >= requirement.count;
    });
}

export function areOptionRequirementsMet(option = {}, state = {}) {
    const inventory = state?.inventory ?? {};
    const itemContainerCounts = state?.itemContainerCounts ?? {};

    return (
        areItemRequirementsMet(option.requiresItems, inventory) &&
        areContainedItemRequirementsMet(option.requiresContainedItems, itemContainerCounts)
    );
}
