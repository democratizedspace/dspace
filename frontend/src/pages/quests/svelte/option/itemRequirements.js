export function areItemRequirementsMet(requirements = [], inventory = {}) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    const normalizedInventory = inventory ?? {};

    return requirements.every((item) => {
        const available = normalizedInventory[item.id] ?? 0;
        return available >= item.count;
    });
}
