import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { getBuiltInQuest, listBuiltInQuestIds } from './builtInQuests.js';
import { getOfficialQuestStats } from './gameState/questStats.js';

export const PLAYER_STATE_SUMMARY_LIMITS = Object.freeze({
    remainingQuestCap: 12,
    activeProcessCap: 6,
    relevantInventoryCap: 8,
    inventorySampleCap: 8,
});

const NOTABLE_RESOURCE_IDS = new Set([
    'dusd',
    'dbi',
    'dwatt',
    'dsolar',
    'dprint',
    'dlaunch',
    'dwind',
]);

const itemById = new Map(items.map((item) => [item.id, item]));
const knownItemNames = new Map([['d3590107-25ff-4de5-af3a-46e2497bfc52', 'green PLA filament']]);
const processById = new Map(processes.map((process) => [process.id, process]));

const normalizeVersionNumberString = (value) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '3';
};

const formatCount = (count) => (Number.isInteger(count) ? String(count) : count.toFixed(2));
const normalizeText = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
const compactText = (value) => normalizeText(value).replace(/\s+/g, '');

const getInventoryEntries = (gameState = {}) =>
    Object.entries(gameState.inventory || {})
        .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
        .map(([id, count]) => {
            const item = itemById.get(id);
            return { id, count, name: item?.name || knownItemNames.get(id) || id };
        })
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const isNotableResource = (entry) => {
    const id = compactText(entry.id);
    const name = compactText(entry.name);
    return [...NOTABLE_RESOURCE_IDS].some((resource) => id === resource || name === resource);
};

const queryMatchesEntry = (query, entry) => {
    if (!query) return false;
    const normalizedQuery = normalizeText(query);
    const compactQuery = compactText(query);
    if (/green\s+pla/i.test(query) && /green\s+pla/i.test(entry.name || '')) return true;
    const candidates = [entry.id, entry.name]
        .map((value) => [normalizeText(value), compactText(value)])
        .flat()
        .filter(Boolean);
    return candidates.some((candidate) => {
        if (candidate.length < 3) return false;
        if (normalizedQuery.includes(candidate) || compactQuery.includes(candidate)) return true;
        const queryTokens = normalizedQuery
            .split(/\s+/)
            .filter(
                (token) =>
                    token.length >= 3 &&
                    !['have', 'enough', 'what', 'with', 'owned'].includes(token)
            );
        return (
            queryTokens.length > 0 &&
            queryTokens.filter((token) => candidate.includes(token)).length >=
                Math.min(2, queryTokens.length)
        );
    });
};

const isInventoryQuery = (query) => /\b(inventory|all items|owned items)\b/i.test(query || '');

const formatInventoryEntry = (entry) => `${entry.name} [${entry.id}]: ${formatCount(entry.count)}`;

const getRemainingOfficialQuests = (gameState, cap) =>
    listBuiltInQuestIds()
        .filter((questId) => !gameState?.quests?.[questId]?.finished)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, cap)
        .map((questId) => {
            const quest = getBuiltInQuest(questId);
            return { id: questId, title: quest?.title || questId };
        });

const getActiveProcesses = (gameState, cap) =>
    Object.entries(gameState?.processes || {})
        .filter(
            ([, state]) => state && typeof state === 'object' && state.startedAt && !state.finished
        )
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, cap)
        .map(([id, state]) => ({
            id,
            title: processById.get(id)?.title || id,
            paused: Boolean(state.pausedAt),
        }));

export function buildRawPlayerStatePromptSummary(gameState, options = {}) {
    const maxInventoryEntries = options.maxInventoryEntries || 50;
    const questStats = getOfficialQuestStats(gameState || null);
    if (!gameState || typeof gameState !== 'object') {
        return {
            block: null,
            meta: {
                included: false,
                playerStatePromptMode: 'none',
                completedQuestCount: questStats.completedQuestCount,
                totalOfficialQuestCount: questStats.totalOfficialQuestCount,
                remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
                remainingQuestIncludedCount: 0,
                inventoryIncludedCount: 0,
                inventoryTotalCount: 0,
                inventoryTruncated: false,
                activeProcessIncludedCount: 0,
                compactStateBlockChars: 0,
            },
        };
    }
    const questsFinished = Object.entries(gameState.quests || {})
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => questId)
        .sort((a, b) => a.localeCompare(b));
    const inventory = getInventoryEntries(gameState).sort((a, b) => b.count - a.count);
    const includedInventory = inventory
        .slice(0, maxInventoryEntries)
        .map(({ id, count }) => ({ id, count }));
    const versionNumberString = normalizeVersionNumberString(gameState.versionNumberString);
    const block = `PlayerStateStats: completedOfficialQuests=${questStats.completedQuestCount}, totalOfficialQuests=${questStats.totalOfficialQuestCount}, remainingOfficialQuests=${questStats.remainingOfficialQuestCount}\nPlayerState v${versionNumberString} (authoritative; do not infer beyond this):\n${JSON.stringify({ versionNumberString, questsFinished, inventory: includedInventory }, null, 2)}`;
    return {
        block,
        meta: {
            included: true,
            playerStatePromptMode: 'raw',
            questsFinishedCount: questsFinished.length,
            completedQuestCount: questStats.completedQuestCount,
            totalOfficialQuestCount: questStats.totalOfficialQuestCount,
            remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
            remainingQuestIncludedCount: 0,
            inventoryIncludedCount: includedInventory.length,
            inventoryTotalCount: inventory.length,
            inventoryTruncated: inventory.length > includedInventory.length,
            activeProcessIncludedCount: 0,
            compactStateBlockChars: block.length,
        },
    };
}

export function buildPlayerStatePromptSummary(gameState, options = {}) {
    if (options.playerStatePromptMode === 'raw' || options.includeRawPlayerState) {
        return buildRawPlayerStatePromptSummary(gameState, options);
    }
    const questStats = getOfficialQuestStats(gameState || null);
    if (!gameState || typeof gameState !== 'object') {
        return buildRawPlayerStatePromptSummary(null, options);
    }

    const limits = { ...PLAYER_STATE_SUMMARY_LIMITS, ...(options.limits || {}) };
    const query = options.latestUserMessage || options.query || '';
    const versionNumberString = normalizeVersionNumberString(gameState.versionNumberString);
    const inventoryEntries = getInventoryEntries(gameState);
    const notableResources = inventoryEntries.filter(isNotableResource);
    const relevantInventory = inventoryEntries
        .filter((entry) => queryMatchesEntry(query, entry) && !isNotableResource(entry))
        .slice(0, limits.relevantInventoryCap);
    const sampleInventory = isInventoryQuery(query)
        ? inventoryEntries
              .filter(
                  (entry) =>
                      !isNotableResource(entry) &&
                      !relevantInventory.some((included) => included.id === entry.id)
              )
              .slice(0, limits.inventorySampleCap)
        : [];
    const includedInventoryIds = new Set([
        ...notableResources.map((entry) => entry.id),
        ...relevantInventory.map((entry) => entry.id),
        ...sampleInventory.map((entry) => entry.id),
    ]);
    const remainingQuests = getRemainingOfficialQuests(gameState, limits.remainingQuestCap);
    const activeProcesses = getActiveProcesses(gameState, limits.activeProcessCap);
    const inventoryOmitted = inventoryEntries.length > includedInventoryIds.size;
    const remainingQuestOmitted = questStats.remainingOfficialQuestCount > remainingQuests.length;

    const lines = [
        `PlayerStateStats: completedOfficialQuests=${questStats.completedQuestCount}, totalOfficialQuests=${questStats.totalOfficialQuestCount}, remainingOfficialQuests=${questStats.remainingOfficialQuestCount}`,
        `PlayerState v${versionNumberString} compact`,
        'This compact PlayerState summary is authoritative for the fields shown.',
        `Official quests: completed ${questStats.completedQuestCount}/${questStats.totalOfficialQuestCount}; remaining ${questStats.remainingOfficialQuestCount}.`,
        `Remaining official quests shown (cap ${limits.remainingQuestCap}): ${
            remainingQuests.length
                ? remainingQuests.map((quest) => `${quest.id} — ${quest.title}`).join('; ')
                : 'none'
        }`,
        `Active/running processes: ${Object.keys(gameState.processes || {}).length}; shown (cap ${limits.activeProcessCap}): ${
            activeProcesses.length
                ? activeProcesses
                      .map(
                          (process) =>
                              `${process.title} [${process.id}]${process.paused ? ' paused' : ''}`
                      )
                      .join('; ')
                : 'none'
        }`,
        `Inventory: ${inventoryEntries.length} owned entries.`,
    ];

    if (notableResources.length > 0) {
        lines.push(`Notable balances: ${notableResources.map(formatInventoryEntry).join('; ')}`);
    }
    if (relevantInventory.length > 0) {
        lines.push(
            `Query-relevant owned inventory: ${relevantInventory.map(formatInventoryEntry).join('; ')}`
        );
    }
    if (sampleInventory.length > 0) {
        lines.push(
            `Bounded inventory sample (cap ${limits.inventorySampleCap}): ${sampleInventory.map(formatInventoryEntry).join('; ')}`
        );
    }
    if (inventoryOmitted || remainingQuestOmitted) {
        lines.push(
            'Omitted inventory/quest details are not evidence that the player lacks them; they are omitted from this prompt. For exact missing details, ask a clarifying question or suggest checking the relevant DSPACE page.'
        );
    }

    const block = lines.join('\n');
    return {
        block,
        meta: {
            included: true,
            playerStatePromptMode: 'compact',
            completedQuestCount: questStats.completedQuestCount,
            totalOfficialQuestCount: questStats.totalOfficialQuestCount,
            remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
            remainingQuestIncludedCount: remainingQuests.length,
            inventoryIncludedCount: includedInventoryIds.size,
            inventoryTotalCount: inventoryEntries.length,
            inventoryTruncated: inventoryOmitted,
            activeProcessIncludedCount: activeProcesses.length,
            compactStateBlockChars: block.length,
        },
        slices: {
            notableResources,
            relevantInventory,
            sampleInventory,
            remainingQuests,
            activeProcesses,
        },
    };
}
