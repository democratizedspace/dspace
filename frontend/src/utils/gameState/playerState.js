const DEFAULT_MAX_INVENTORY_ENTRIES = 30;

const normalizeInventoryEntries = (inventory) => {
    if (!inventory || typeof inventory !== 'object') {
        return [];
    }

    return Object.entries(inventory)
        .map(([id, count]) => ({
            id,
            count: typeof count === 'number' ? count : Number(count),
        }))
        .filter((entry) => Number.isFinite(entry.count) && entry.count > 0);
};

const normalizeFinishedQuests = (quests) => {
    if (!quests || typeof quests !== 'object') {
        return [];
    }

    return Object.entries(quests)
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => questId)
        .sort((a, b) => a.localeCompare(b));
};

export const buildPlayerStatePrompt = (gameState, options = {}) => {
    if (!gameState || typeof gameState !== 'object') {
        return {
            message: null,
            meta: {
                included: false,
                questsFinishedCount: 0,
                inventoryEntriesCount: 0,
                inventoryTotalItems: 0,
                inventoryTruncated: false,
            },
        };
    }

    const maxInventoryEntries = Number.isFinite(options.maxInventoryEntries)
        ? Math.max(0, options.maxInventoryEntries)
        : DEFAULT_MAX_INVENTORY_ENTRIES;
    const questsFinished = normalizeFinishedQuests(gameState.quests);
    const inventoryEntries = normalizeInventoryEntries(gameState.inventory);
    const inventoryTotalItems = inventoryEntries.length;
    const sortedInventory = inventoryEntries.sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;
        }
        return a.id.localeCompare(b.id);
    });
    const inventoryTruncated = sortedInventory.length > maxInventoryEntries;
    const inventory = inventoryTruncated
        ? sortedInventory.slice(0, maxInventoryEntries)
        : sortedInventory;

    const versionNumberString =
        typeof gameState.versionNumberString === 'string' && gameState.versionNumberString.trim()
            ? gameState.versionNumberString.trim()
            : '3';
    const payload = {
        versionNumberString,
        questsFinished,
        inventory: inventory.map(({ id, count }) => ({ id, count })),
    };

    if (inventoryTruncated) {
        payload.inventoryMeta = {
            truncated: true,
            totalItems: inventoryTotalItems,
        };
    }

    return {
        message: {
            role: 'system',
            content:
                `PlayerState v${versionNumberString} (authoritative; do not infer beyond this):\n` +
                JSON.stringify(payload, null, 2),
        },
        meta: {
            included: true,
            questsFinishedCount: questsFinished.length,
            inventoryEntriesCount: inventory.length,
            inventoryTotalItems,
            inventoryTruncated,
        },
    };
};
