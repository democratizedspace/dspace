import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { listBuiltInQuestIds } from './builtInQuests.js';
import { getOfficialQuestStats } from './gameState/questStats.js';

export const PLAYER_STATE_SUMMARY_LIMITS = Object.freeze({
    remainingQuests: 12,
    activeProcesses: 6,
    relevantInventory: 8,
    inventorySample: 8,
});

const NOTABLE_RESOURCE_IDS = [
    'dUSD',
    'dBI',
    'dWatt',
    'dSolar',
    'dPrint',
    'dLaunch',
    'dWind',
    'dHydro',
    'dRocket',
];

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
const tokensFor = (value) =>
    normalizeText(value)
        .split(/\s+/)
        .filter((token) => token.length >= 2);

function getQuestData() {
    if (typeof import.meta === 'undefined' || typeof import.meta.glob !== 'function') return [];
    const modules = import.meta.glob('../pages/quests/json/**/*.json', { eager: true });
    return Object.values(modules)
        .map((mod) => (mod?.default ? mod.default : mod))
        .filter((quest) => quest && typeof quest.id === 'string')
        .map((quest) => ({ id: quest.id, title: quest.title || quest.id }));
}

const questTitleById = new Map(getQuestData().map((quest) => [quest.id, quest.title]));
const itemById = new Map(items.map((item) => [item.id, item]));
const processById = new Map(processes.map((process) => [process.id, process]));

const getInventoryEntries = (inventory = {}) =>
    Object.entries(inventory || {})
        .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
        .map(([id, count]) => ({ id, count, name: itemById.get(id)?.name || id }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const matchesQuery = (entry, queryTokens, queryText) => {
    if (!queryText || queryTokens.length === 0) return false;
    const haystack = normalizeText(`${entry.id} ${entry.name}`);
    if (haystack && queryText.includes(haystack)) return true;
    const entryTokens = tokensFor(`${entry.id} ${entry.name}`);
    return entryTokens.some((token) => queryTokens.includes(token));
};

const isInventoryBroadQuery = (queryText) =>
    /\binventory\b|\bitems?\b|\bwhat do i have\b/i.test(queryText);

const getActiveProcessEntries = (
    gameState = {},
    cap = PLAYER_STATE_SUMMARY_LIMITS.activeProcesses
) =>
    Object.entries(gameState.processes || {})
        .filter(([, state]) => state && (state.startedAt || state.pausedAt || state.duration))
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, cap)
        .map(([id, state]) => {
            const process = processById.get(id);
            const title = process?.title || id;
            const status = state.pausedAt ? 'paused' : 'running';
            return `${title} [${id}] ${status}`;
        });

const buildRawPlayerState = (gameState, options = {}) => {
    const inventoryEntries = getInventoryEntries(gameState.inventory);
    const maxInventoryEntries = options.maxInventoryEntries || 50;
    const includedInventory = inventoryEntries.slice(0, maxInventoryEntries);
    const questsFinished = Object.entries(gameState.quests || {})
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => questId)
        .sort((a, b) => a.localeCompare(b));
    const questStats = getOfficialQuestStats(gameState);
    const versionNumberString = normalizeVersionNumberString(gameState.versionNumberString);
    const snapshot = {
        versionNumberString,
        questsFinished,
        inventory: includedInventory.map(({ id, count }) => ({ id, count })),
    };
    const block = `PlayerStateStats: completedOfficialQuests=${questStats.completedQuestCount}, totalOfficialQuests=${questStats.totalOfficialQuestCount}, remainingOfficialQuests=${questStats.remainingOfficialQuestCount}\nPlayerState v${versionNumberString} (raw debug mode):\n${JSON.stringify(snapshot, null, 2)}`;
    return {
        block,
        meta: {
            included: true,
            mode: 'raw',
            playerStatePromptMode: 'raw',
            completedQuestCount: questStats.completedQuestCount,
            totalOfficialQuestCount: questStats.totalOfficialQuestCount,
            remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
            remainingQuestIncludedCount: 0,
            inventoryTotalCount: inventoryEntries.length,
            inventoryIncludedCount: includedInventory.length,
            inventoryTruncated: inventoryEntries.length > includedInventory.length,
            activeProcessIncludedCount: 0,
            compactStateBlockChars: block.length,
        },
        slices: { inventoryEntries: includedInventory },
    };
};

export function buildPlayerStatePromptSummary(gameState, options = {}) {
    const mode =
        options.includeRawPlayerState || options.playerStatePromptMode === 'raw'
            ? 'raw'
            : 'compact';
    if (!gameState || typeof gameState !== 'object') {
        const questStats = getOfficialQuestStats(null);
        return {
            block: null,
            meta: {
                included: false,
                mode: 'none',
                playerStatePromptMode: 'none',
                completedQuestCount: questStats.completedQuestCount,
                totalOfficialQuestCount: questStats.totalOfficialQuestCount,
                remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
                remainingQuestIncludedCount: 0,
                inventoryTotalCount: 0,
                inventoryIncludedCount: 0,
                inventoryTruncated: false,
                activeProcessIncludedCount: 0,
                compactStateBlockChars: 0,
            },
            slices: {
                resourceBalances: [],
                relevantInventory: [],
                remainingQuests: [],
                activeProcesses: [],
            },
        };
    }
    if (mode === 'raw') return buildRawPlayerState(gameState, options);

    const limits = { ...PLAYER_STATE_SUMMARY_LIMITS, ...(options.limits || {}) };
    const latestUserMessage = options.latestUserMessage || options.query || '';
    const queryText = normalizeText(latestUserMessage);
    const queryTokens = tokensFor(latestUserMessage);
    const inventoryEntries = getInventoryEntries(gameState.inventory);
    const resourceBalances = inventoryEntries.filter(
        (entry) =>
            NOTABLE_RESOURCE_IDS.some((id) => id.toLowerCase() === entry.id.toLowerCase()) ||
            /^d[A-Z]/.test(entry.id)
    );
    const relevantInventory = inventoryEntries.filter((entry) =>
        matchesQuery(entry, queryTokens, queryText)
    );
    const inventorySample = isInventoryBroadQuery(latestUserMessage)
        ? inventoryEntries
              .filter((entry) => !resourceBalances.some((resource) => resource.id === entry.id))
              .slice(0, limits.inventorySample)
        : [];
    const includedInventory = [
        ...new Map(
            [...resourceBalances, ...relevantInventory, ...inventorySample].map((entry) => [
                entry.id,
                entry,
            ])
        ).values(),
    ].slice(0, limits.relevantInventory);

    const officialQuestIds = listBuiltInQuestIds().sort((a, b) => a.localeCompare(b));
    const finishedOfficial = new Set(
        Object.entries(gameState.quests || {})
            .filter(([, questState]) => questState?.finished)
            .map(([questId]) => questId)
    );
    const remainingQuests = officialQuestIds
        .filter((questId) => !finishedOfficial.has(questId))
        .map((id) => ({ id, title: questTitleById.get(id) || id }));
    const includedRemainingQuests = remainingQuests.slice(0, limits.remainingQuests);
    const questStats = getOfficialQuestStats(gameState);
    const activeProcesses = getActiveProcessEntries(gameState, limits.activeProcesses);
    const activeProcessTotalCount = Object.values(gameState.processes || {}).filter(
        (state) => state && (state.startedAt || state.pausedAt || state.duration)
    ).length;
    const versionNumberString = normalizeVersionNumberString(gameState.versionNumberString);
    const inventoryOmitted = inventoryEntries.length > includedInventory.length;
    const questOmitted = remainingQuests.length > includedRemainingQuests.length;

    const lines = [
        `PlayerState compact summary v${versionNumberString}:`,
        'This compact PlayerState summary is authoritative for the fields shown.',
        `Official quests: completed ${questStats.completedQuestCount}/${questStats.totalOfficialQuestCount}; remaining ${questStats.remainingOfficialQuestCount}.`,
        includedRemainingQuests.length
            ? `Remaining official quests shown (cap ${limits.remainingQuests}): ${includedRemainingQuests.map((quest) => `${quest.title} [${quest.id}]`).join('; ')}${questOmitted ? `; +${remainingQuests.length - includedRemainingQuests.length} more omitted` : ''}.`
            : 'Remaining official quests shown: none.',
        `Active/running processes: ${activeProcessTotalCount}${activeProcesses.length ? `; shown: ${activeProcesses.join('; ')}` : ''}.`,
        `Inventory: ${inventoryEntries.length} owned item/resource entr${inventoryEntries.length === 1 ? 'y' : 'ies'}.`,
    ];

    if (resourceBalances.length) {
        lines.push(
            `Notable balances: ${resourceBalances.map((entry) => `${entry.name} [${entry.id}]=${formatCount(entry.count)}`).join('; ')}.`
        );
    }
    if (includedInventory.length) {
        lines.push(
            `Inventory entries shown (query-relevant/resources, cap ${limits.relevantInventory}): ${includedInventory.map((entry) => `${entry.name} [${entry.id}]=${formatCount(entry.count)}`).join('; ')}.`
        );
    } else {
        lines.push(
            `Inventory entries shown: none selected for this query (cap ${limits.relevantInventory}).`
        );
    }
    if (inventoryOmitted || questOmitted) {
        lines.push(
            'Omitted inventory/quest details are not evidence that the player lacks them; they are omitted from this prompt. For exact missing details, ask a clarifying question or suggest checking the relevant DSPACE page.'
        );
    }

    const block = lines.join('\n');
    return {
        block,
        meta: {
            included: true,
            mode: 'compact',
            playerStatePromptMode: 'compact',
            completedQuestCount: questStats.completedQuestCount,
            totalOfficialQuestCount: questStats.totalOfficialQuestCount,
            remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
            remainingQuestIncludedCount: includedRemainingQuests.length,
            inventoryTotalCount: inventoryEntries.length,
            inventoryIncludedCount: includedInventory.length,
            inventoryTruncated: inventoryOmitted,
            activeProcessIncludedCount: activeProcesses.length,
            compactStateBlockChars: block.length,
        },
        slices: {
            resourceBalances,
            relevantInventory: includedInventory,
            remainingQuests: includedRemainingQuests,
            activeProcesses,
            inventoryTotalCount: inventoryEntries.length,
            inventoryTruncated: inventoryOmitted,
        },
    };
}
