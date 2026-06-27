import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { getBuiltInQuest, listBuiltInQuestIds } from './builtInQuests.js';
import { getOfficialQuestStats } from './gameState/questStats.js';

export const PLAYER_STATE_PROMPT_DEFAULTS = Object.freeze({
    remainingQuestCap: 12,
    inventoryRelevantCap: 8,
    inventorySampleCap: 8,
    activeProcessCap: 6,
});

const RESOURCE_NAMES = ['dUSD', 'dBI', 'dWatt', 'dSolar', 'dPrint', 'dLaunch', 'dWind'];

const itemById = new Map(items.map((item) => [item.id, item]));
const processById = new Map(processes.map((process) => [process.id, process]));

const normalizeVersionNumberString = (value) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '3';
};

const formatCount = (count) =>
    Number.isInteger(count) ? String(count) : String(Number(count.toFixed(4)));

const normalizeText = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const tokenSet = (value) =>
    new Set(
        normalizeText(value)
            .split(/\s+/)
            .filter((token) => token.length >= 2)
    );

const itemLabel = (id) => itemById.get(id)?.name || id;

const inventoryEntries = (inventory = {}) =>
    Object.entries(inventory || {})
        .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
        .map(([id, count]) => ({ id, name: itemLabel(id), count }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const isResourceEntry = (entry) => RESOURCE_NAMES.includes(entry.name);

const entryMatchesQuery = (entry, queryTokens, queryText) => {
    if (!queryText || queryTokens.size === 0) return false;
    const haystack = normalizeText(
        `${entry.id} ${entry.name} ${itemById.get(entry.id)?.description || ''}`
    );
    const entryTokens = tokenSet(haystack);
    if (normalizeText(entry.name) && queryText.includes(normalizeText(entry.name))) return true;
    if (normalizeText(entry.id) && queryText.includes(normalizeText(entry.id))) return true;
    let hits = 0;
    for (const token of queryTokens) {
        if (entryTokens.has(token)) hits += 1;
    }
    return hits >= Math.min(2, queryTokens.size);
};

const wantsInventorySummary = (queryText) =>
    /\binventory\b|\bitems?\b|\bwhat do i have\b/i.test(queryText);

const wantsCompletedQuestSummary = (queryText) =>
    /\b(completed|finished|done)\b.*\bquests?\b|\bquests?\b.*\b(completed|finished|done)\b/i.test(
        queryText
    );

const buildCompletedQuests = (gameState, cap) =>
    Object.entries(gameState?.quests || {})
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => {
            const quest = getBuiltInQuest(questId);
            return { id: questId, title: quest?.title || questId };
        })
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, cap);

const buildRemainingQuests = (gameState, cap) => {
    const officialQuestIds = listBuiltInQuestIds().sort((a, b) => a.localeCompare(b));
    return officialQuestIds
        .filter((questId) => !gameState?.quests?.[questId]?.finished)
        .slice(0, cap)
        .map((questId) => {
            const quest = getBuiltInQuest(questId);
            return { id: questId, title: quest?.title || questId };
        });
};

const isProcessFinishedByElapsedTime = (state, now = Date.now()) => {
    if (state?.finished) return true;
    if (
        !state ||
        !Number.isFinite(state.startedAt) ||
        !Number.isFinite(state.duration) ||
        state.duration <= 0
    ) {
        return false;
    }

    const elapsedBeforePause = Number(state.elapsedBeforePause ?? 0);
    const isPaused = state.pausedAt !== null && state.pausedAt !== undefined;
    const hasLegacyPauseModel = !state.pauseModelVersion;
    let segmentElapsed = 0;

    if (isPaused) {
        if (!hasLegacyPauseModel) {
            segmentElapsed = Math.max(0, state.pausedAt - state.startedAt);
        }
    } else {
        segmentElapsed = Math.max(0, now - state.startedAt);
    }

    return elapsedBeforePause + segmentElapsed >= state.duration;
};

const buildActiveProcesses = (gameState, cap) => {
    const activeEntries = Object.entries(gameState?.processes || {})
        .filter(([, state]) => state && state.startedAt && !isProcessFinishedByElapsedTime(state))
        .sort(([a], [b]) => a.localeCompare(b));

    return {
        total: activeEntries.length,
        shown: activeEntries.slice(0, cap).map(([id, state]) => ({
            id,
            title: processById.get(id)?.title || id,
            status: state.pausedAt ? 'paused' : 'running',
        })),
    };
};

const buildRawPlayerStateBlock = (gameState, maxInventoryEntries = 50) => {
    const questStats = getOfficialQuestStats(gameState);
    const finished = Object.entries(gameState?.quests || {})
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => questId)
        .sort((a, b) => a.localeCompare(b));
    const inventory = inventoryEntries(gameState?.inventory)
        .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
        .slice(0, maxInventoryEntries)
        .map(({ id, count }) => ({ id, count }));
    const snapshot = {
        versionNumberString: normalizeVersionNumberString(gameState?.versionNumberString),
        questsFinished: finished,
        inventory,
    };
    return `PlayerStateStats: completedOfficialQuests=${questStats.completedQuestCount}, totalOfficialQuests=${questStats.totalOfficialQuestCount}, remainingOfficialQuests=${questStats.remainingOfficialQuestCount}\nPlayerState v${snapshot.versionNumberString} (raw debug; authoritative; do not infer beyond this):\n${JSON.stringify(snapshot, null, 2)}`;
};

export const buildPlayerStatePromptSummary = (gameState, options = {}) => {
    const mode =
        options.playerStatePromptMode === 'raw' || options.includeRawPlayerState
            ? 'raw'
            : 'compact';
    const questStats = getOfficialQuestStats(gameState || null);
    if (!gameState || typeof gameState !== 'object') {
        return {
            block: null,
            meta: {
                included: false,
                mode: 'none',
                questsFinishedCount: 0,
                completedQuestCount: questStats.completedQuestCount,
                totalOfficialQuestCount: questStats.totalOfficialQuestCount,
                remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
                remainingQuestIncludedCount: 0,
                inventoryTotalCount: 0,
                inventoryIncludedCount: 0,
                inventoryTruncated: false,
                activeProcessIncludedCount: 0,
                blockCharCount: 0,
            },
            slices: {
                resourceBalances: [],
                relevantInventory: [],
                remainingQuests: [],
                activeProcesses: [],
            },
        };
    }

    if (mode === 'raw') {
        const block = buildRawPlayerStateBlock(gameState, options.maxInventoryEntries);
        const entries = inventoryEntries(gameState.inventory);
        return {
            block,
            meta: {
                included: true,
                mode: 'raw',
                questsFinishedCount: Object.values(gameState.quests || {}).filter(
                    (quest) => quest?.finished
                ).length,
                completedQuestCount: questStats.completedQuestCount,
                totalOfficialQuestCount: questStats.totalOfficialQuestCount,
                remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
                remainingQuestIncludedCount: 0,
                inventoryTotalCount: entries.length,
                inventoryIncludedCount: Math.min(entries.length, options.maxInventoryEntries || 50),
                inventoryTruncated: entries.length > (options.maxInventoryEntries || 50),
                activeProcessIncludedCount: 0,
                blockCharCount: block.length,
            },
            slices: {
                resourceBalances: [],
                relevantInventory: [],
                remainingQuests: [],
                activeProcesses: [],
            },
        };
    }

    const caps = { ...PLAYER_STATE_PROMPT_DEFAULTS, ...options };
    const queryText = normalizeText(options.latestUserMessage || options.query || '');
    const queryTokens = tokenSet(queryText);
    const entries = inventoryEntries(gameState.inventory);
    const resourceBalances = entries.filter(isResourceEntry);
    const queryRelevant = entries
        .filter(
            (entry) => !isResourceEntry(entry) && entryMatchesQuery(entry, queryTokens, queryText)
        )
        .slice(0, caps.inventoryRelevantCap);
    const inventorySample = wantsInventorySummary(queryText)
        ? entries
              .filter(
                  (entry) =>
                      !isResourceEntry(entry) &&
                      !queryRelevant.some((match) => match.id === entry.id)
              )
              .slice(0, caps.inventorySampleCap)
        : [];
    const relevantInventory = [...queryRelevant, ...inventorySample];
    const completedQuests = wantsCompletedQuestSummary(queryText)
        ? buildCompletedQuests(gameState, caps.remainingQuestCap)
        : [];
    const remainingQuests = buildRemainingQuests(gameState, caps.remainingQuestCap);
    const activeProcessSummary = buildActiveProcesses(gameState, caps.activeProcessCap);
    const activeProcesses = activeProcessSummary.shown;
    const inventoryIncludedCount = resourceBalances.length + relevantInventory.length;
    const inventoryTruncated = entries.length > inventoryIncludedCount;

    const lines = [
        `PlayerStateCompact v${normalizeVersionNumberString(gameState.versionNumberString)} (authoritative for fields shown).`,
        `Official quests: completed ${questStats.completedQuestCount}/${questStats.totalOfficialQuestCount}; remaining ${questStats.remainingOfficialQuestCount}.`,
    ];
    if (completedQuests.length > 0) {
        lines.push(
            `Completed quests shown (cap ${caps.remainingQuestCap}): ${completedQuests.map((quest) => `${quest.id} — ${quest.title}`).join(' | ')}.`
        );
    }
    if (remainingQuests.length > 0) {
        lines.push(
            `Remaining official quests shown (cap ${caps.remainingQuestCap}): ${remainingQuests.map((quest) => `${quest.id} — ${quest.title}`).join(' | ')}.`
        );
    }
    lines.push(`Inventory: ${entries.length} owned item/resource types total.`);
    if (resourceBalances.length > 0) {
        lines.push(
            `Notable balances: ${resourceBalances.map((entry) => `${entry.name}=${formatCount(entry.count)}`).join(', ')}.`
        );
    }
    if (relevantInventory.length > 0) {
        lines.push(
            `Query-relevant/sample owned inventory shown (relevant cap ${caps.inventoryRelevantCap}, sample cap ${caps.inventorySampleCap}): ${relevantInventory.map((entry) => `${entry.name} [${entry.id}]=${formatCount(entry.count)}`).join('; ')}.`
        );
    }
    lines.push(
        `Active processes: ${activeProcessSummary.total} total${activeProcesses.length ? `; shown: ${activeProcesses.map((process) => `${process.title} [${process.id}] ${process.status}`).join('; ')}` : ''}.`
    );
    if (inventoryTruncated || questStats.remainingOfficialQuestCount > remainingQuests.length) {
        lines.push(
            'Omitted inventory/quest details are not evidence that the player lacks them; ask a clarifying question or suggest checking the relevant DSPACE page for exact missing details.'
        );
    }
    const block = lines.join('\n');

    return {
        block,
        meta: {
            included: true,
            mode: 'compact',
            questsFinishedCount: Object.values(gameState.quests || {}).filter(
                (quest) => quest?.finished
            ).length,
            completedQuestCount: questStats.completedQuestCount,
            totalOfficialQuestCount: questStats.totalOfficialQuestCount,
            remainingOfficialQuestCount: questStats.remainingOfficialQuestCount,
            remainingQuestIncludedCount: remainingQuests.length,
            inventoryTotalCount: entries.length,
            inventoryIncludedCount,
            inventoryTruncated,
            activeProcessIncludedCount: activeProcesses.length,
            blockCharCount: block.length,
        },
        slices: { resourceBalances, relevantInventory, remainingQuests, activeProcesses },
    };
};
