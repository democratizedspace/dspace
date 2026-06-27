import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { getOfficialQuestStats } from './gameState/questStats.js';
import { getBuiltInQuest, listBuiltInQuestIds } from './builtInQuests.js';

export const PLAYER_STATE_SUMMARY_LIMITS = Object.freeze({
    remainingQuestCap: 12,
    activeProcessCap: 6,
    relevantInventoryCap: 8,
    inventorySampleCap: 8,
});

const NOTABLE_RESOURCE_NAMES = [
    'dUSD',
    'dBI',
    'dWatt',
    'dSolar',
    'dPrint',
    'dLaunch',
    'dWind',
    'dCarbon',
    'dOffset',
];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const itemById = new Map(items.map((item) => [item.id, item]));
const processById = new Map(processes.map((process) => [process.id, process]));

const normalizeVersionNumberString = (value) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '3';
};

const formatCount = (count) => (Number.isInteger(count) ? String(count) : Number(count).toFixed(2));
const normalizeText = (text) =>
    String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
const hasInventoryIntent = (query) => {
    const text = query || '';
    if (
        /\bquests?\b|\bprocess(?:es)?\b/i.test(text) &&
        !/\binventory\b|\bitems?\b|\bowned\b|\bbalance\b|\bafford\b|\benough\b/i.test(text)
    ) {
        return false;
    }
    return /\binventory\b|\bitems?\b|\bowned\b|\bhave\b|\benough\b|\bbalance\b|\bafford\b/i.test(
        text
    );
};

const getInventoryEntries = (inventory = {}) =>
    Object.entries(inventory || {})
        .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
        .map(([id, count]) => {
            const item = itemById.get(id);
            return {
                id,
                count,
                name: item?.name || id,
                category: item?.category || '',
                isUuid: uuidPattern.test(id),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const queryMatchesEntry = (entry, queryText) => {
    const normalizedQuery = normalizeText(queryText);
    if (!normalizedQuery) return false;
    const haystacks = [entry.name, entry.id, entry.category].map(normalizeText).filter(Boolean);
    if (haystacks.some((haystack) => haystack && normalizedQuery.includes(haystack))) return true;
    const queryTokens = new Set(normalizedQuery.split(' ').filter((token) => token.length >= 2));
    return haystacks.some((haystack) => {
        const tokens = haystack.split(' ').filter((token) => token.length >= 2);
        return tokens.length > 0 && tokens.every((token) => queryTokens.has(token));
    });
};

const summarizeInventoryEntry = (entry) => `${entry.name} (x${formatCount(entry.count)})`;

const buildInventorySlices = (gameState, latestUserMessage, limits) => {
    const entries = getInventoryEntries(gameState?.inventory);
    const notableResources = entries.filter((entry) => NOTABLE_RESOURCE_NAMES.includes(entry.name));
    const queryRelevant = entries.filter((entry) => queryMatchesEntry(entry, latestUserMessage));
    const wantsInventory =
        Boolean(limits.includeInventorySample) || hasInventoryIntent(latestUserMessage);
    const sample = wantsInventory
        ? entries
              .filter(
                  (entry) => !notableResources.includes(entry) && !queryRelevant.includes(entry)
              )
              .slice(0, limits.inventorySampleCap)
        : [];
    const merged = [];
    for (const entry of [...notableResources, ...queryRelevant, ...sample]) {
        if (!merged.some((existing) => existing.id === entry.id)) merged.push(entry);
    }
    const included = merged.slice(0, limits.relevantInventoryCap);
    return {
        entries,
        notableResources,
        queryRelevant: queryRelevant.slice(0, limits.relevantInventoryCap),
        sample,
        included,
        omitted: entries.length > included.length,
    };
};

const getRemainingQuestEntries = (gameState, cap) => {
    const finished = new Set(
        Object.entries(gameState?.quests || {})
            .filter(([, questState]) => questState?.finished)
            .map(([questId]) => questId)
    );
    return listBuiltInQuestIds()
        .filter((questId) => !finished.has(questId))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, cap)
        .map((questId) => {
            const quest = getBuiltInQuest(questId);
            return { id: questId, title: quest?.title || questId };
        });
};

const getActiveProcesses = (gameState, cap) =>
    Object.entries(gameState?.processes || {})
        .filter(([, processState]) => processState?.startedAt && !processState?.completedAt)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, cap)
        .map(([processId, processState]) => ({
            id: processId,
            title: processById.get(processId)?.title || processId,
            status: processState?.pausedAt ? 'paused' : 'running',
        }));

export function buildRawPlayerStatePromptSummary(gameState, options = {}) {
    const maxInventoryEntries = Number.isInteger(options.maxInventoryEntries)
        ? options.maxInventoryEntries
        : 50;
    if (!gameState || typeof gameState !== 'object') {
        const questStats = getOfficialQuestStats(null);
        return {
            block: null,
            meta: {
                playerStatePromptMode: 'none',
                included: false,
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
    const inventory = getInventoryEntries(gameState.inventory).sort(
        (a, b) => b.count - a.count || a.id.localeCompare(b.id)
    );
    const includedInventory = inventory.slice(0, maxInventoryEntries);
    const questStats = getOfficialQuestStats(gameState);
    const block = `PlayerStateStats: completedOfficialQuests=${questStats.completedQuestCount}, totalOfficialQuests=${questStats.totalOfficialQuestCount}, remainingOfficialQuests=${questStats.remainingOfficialQuestCount}\nPlayerState v${normalizeVersionNumberString(gameState.versionNumberString)} (authoritative; do not infer beyond this):\n${JSON.stringify({ versionNumberString: normalizeVersionNumberString(gameState.versionNumberString), questsFinished, inventory: includedInventory.map(({ id, count }) => ({ id, count })), ...(inventory.length > includedInventory.length ? { truncated: true, totalItems: inventory.length } : {}) }, null, 2)}`;
    return {
        block,
        meta: {
            playerStatePromptMode: 'raw',
            included: true,
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
    const limits = {
        ...PLAYER_STATE_SUMMARY_LIMITS,
        includeInventorySample: Boolean(options.includeInventorySample),
        ...(options.limits || {}),
    };
    if (!gameState || typeof gameState !== 'object')
        return buildRawPlayerStatePromptSummary(null, options);

    const questStats = getOfficialQuestStats(gameState);
    const remainingQuests = getRemainingQuestEntries(gameState, limits.remainingQuestCap);
    const activeProcesses = getActiveProcesses(gameState, limits.activeProcessCap);
    const inventorySlices = buildInventorySlices(
        gameState,
        options.latestUserMessage || '',
        limits
    );
    const lines = [
        `PlayerState compact summary v${normalizeVersionNumberString(gameState.versionNumberString)}.`,
        'This compact PlayerState summary is authoritative for the fields shown.',
        `Official quests: completed ${questStats.completedQuestCount}/${questStats.totalOfficialQuestCount}; remaining ${questStats.remainingOfficialQuestCount}.`,
    ];
    if (remainingQuests.length > 0)
        lines.push(
            `Remaining official quests shown (cap ${limits.remainingQuestCap}): ${remainingQuests.map((quest) => `${quest.id} — ${quest.title}`).join(' | ')}`
        );
    if (questStats.remainingOfficialQuestCount > remainingQuests.length)
        lines.push(
            `Remaining quest list truncated: ${questStats.remainingOfficialQuestCount - remainingQuests.length} additional official quest(s) omitted.`
        );
    lines.push(
        `Active/running processes: ${activeProcesses.length}${activeProcesses.length ? ` shown (cap ${limits.activeProcessCap}): ${activeProcesses.map((process) => `${process.title} [${process.id}] ${process.status}`).join(' | ')}` : ''}.`
    );
    lines.push(`Inventory: ${inventorySlices.entries.length} owned item type(s).`);
    if (inventorySlices.notableResources.length > 0)
        lines.push(
            `Notable balances: ${inventorySlices.notableResources.map(summarizeInventoryEntry).join('; ')}.`
        );
    if (inventorySlices.included.length > 0)
        lines.push(
            `Inventory entries shown (query-relevant/resources/sample; cap ${limits.relevantInventoryCap}): ${inventorySlices.included.map(summarizeInventoryEntry).join('; ')}.`
        );
    if (inventorySlices.omitted)
        lines.push(
            `Inventory details omitted/truncated: ${Math.max(0, inventorySlices.entries.length - inventorySlices.included.length)} owned item type(s) not shown.`
        );
    lines.push(
        'Omitted inventory/quest details are not evidence that the player lacks them; for exact missing details, ask a clarifying question or suggest checking the relevant DSPACE page.'
    );
    const block = lines.join('\n');
    return {
        block,
        meta: {
            playerStatePromptMode: 'compact',
            included: true,
            completedQuestCount: questStats.completedQuestCount,
            totalOfficialQuestCount: questStats.totalOfficialQuestCount,
            remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
            remainingQuestIncludedCount: remainingQuests.length,
            inventoryTotalCount: inventorySlices.entries.length,
            inventoryIncludedCount: inventorySlices.included.length,
            inventoryTruncated: inventorySlices.omitted,
            activeProcessIncludedCount: activeProcesses.length,
            compactStateBlockChars: block.length,
        },
        slices: { remainingQuests, activeProcesses, inventory: inventorySlices },
    };
}
