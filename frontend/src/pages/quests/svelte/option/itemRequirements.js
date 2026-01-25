export function areItemRequirementsMet(requirements = [], inventory = {}) {
    if (!Array.isArray(requirements) || requirements.length === 0) {
        return true;
    }

    if (!inventory) {
        return false;
    }

    return requirements.every((item) => {
        const available = inventory[item.id] ?? 0;
        return available >= item.count;
    });
}
