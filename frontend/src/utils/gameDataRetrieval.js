import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { evaluateAchievements } from './achievements.js';
import { mergeSources } from './contextSources.js';
import { getBuiltInQuest, listBuiltInQuestIds } from './builtInQuests.js';

export const FOCUSED_GAME_DATA_DEFAULTS = Object.freeze({
    maxItems: 8,
    maxQuests: 6,
    maxProcesses: 6,
    maxAchievements: 4,
    maxTotalChars: 6000,
    maxEntityChars: 650,
    maxSources: 18,
    recentMessageCount: 4,
});

const STOPWORDS = new Set([
    'the',
    'and',
    'for',
    'that',
    'this',
    'with',
    'have',
    'does',
    'what',
    'where',
    'when',
    'how',
    'much',
    'many',
    'enough',
    'like',
    'make',
    'give',
    'gives',
    'left',
    'consume',
    'consumes',
    'process',
    'quest',
    'quests',
    'item',
    'items',
    'inventory',
    'about',
    'that',
    'would',
    'want',
    'need',
    'please',
    'into',
    'from',
    'using',
    'used',
    'all',
    'any',
    'can',
    'could',
    'should',
    'is',
    'it',
    'i',
    'my',
    'do',
    'to',
    'a',
    'an',
    'of',
    'in',
    'on',
    'or',
    'be',
    'if',
    'there',
]);

const itemById = new Map(items.map((item) => [item.id, item]));
const processById = new Map(processes.map((process) => [process.id, process]));

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[-_/]+/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const tokensFor = (value) =>
    normalize(value)
        .split(' ')
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
        .flatMap((token) => (token.endsWith('ies') ? [token, `${token.slice(0, -3)}y`] : [token]));

const truncate = (value, max) => {
    const text = String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trim()}…`;
};

const formatCount = (count) =>
    Number.isInteger(count) ? String(count) : String(Number(count).toFixed(4));

const itemName = (id) => itemById.get(id)?.name || id;

const formatItemList = (entries = []) =>
    entries
        .map(
            (entry) =>
                `${itemName(entry.id)} [${entry.id}] x${formatCount(entry.quantity ?? entry.count ?? 1)}`
        )
        .join(', ');

const questRecords = () =>
    listBuiltInQuestIds()
        .map((id) => getBuiltInQuest(id))
        .filter(Boolean)
        .map((quest) => ({
            id: quest.id,
            title: quest.title || quest.id,
            description: quest.description || '',
            requiresQuests: Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [],
            rewards: Array.isArray(quest.rewards) ? quest.rewards : [],
            rewardItems: Array.isArray(quest.rewardItems) ? quest.rewardItems : [],
            nodes: Array.isArray(quest.nodes) ? quest.nodes : [],
        }));

const formatQuestRewards = (rewards = []) =>
    rewards
        .map((reward) => {
            if (typeof reward === 'string' || typeof reward === 'number') return String(reward);
            if (reward?.id)
                return `${itemName(reward.id)} [${reward.id}] x${formatCount(reward.quantity ?? reward.count ?? 1)}`;
            return truncate(stringifyFields(reward), 120);
        })
        .filter(Boolean)
        .join(', ');

const stringifyFields = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(stringifyFields).join(' ');
    if (typeof value === 'object') return Object.values(value).map(stringifyFields).join(' ');
    return '';
};

const processText = (process) =>
    [
        process.id,
        process.title,
        process.description,
        stringifyFields(process.requireItems),
        stringifyFields(process.consumeItems),
        stringifyFields(process.createItems),
        process.duration,
    ].join(' ');

const itemText = (item) =>
    [item.id, item.name, item.description, item.category, item.price].join(' ');
const questText = (quest) =>
    [
        quest.id,
        quest.title,
        quest.description,
        stringifyFields(quest.requiresQuests),
        stringifyFields(quest.rewards),
        stringifyFields(quest.rewardItems),
        stringifyFields(quest.nodes),
    ].join(' ');

const scoreRecord = (record, haystackText, queryTokens, queryText) => {
    const haystack = normalize(haystackText);
    if (!haystack || queryTokens.length === 0) return 0;
    let score = 0;
    for (const token of queryTokens) {
        if (haystack.split(' ').includes(token)) score += 2;
        else if (haystack.includes(token)) score += 1;
    }
    const title = normalize(record.title || record.name || record.id);
    if (title && queryText.includes(title)) score += 12;
    const id = normalize(record.id);
    if (id && queryText.includes(id)) score += 10;
    return score;
};

const recentContextText = (messages = [], count) =>
    messages
        .slice(-count)
        .map((message) => (typeof message?.content === 'string' ? message.content : ''))
        .join(' ');

const isVagueProcessQuery = (text) =>
    /\b(what does (it|that|this) consume|what does (it|that|this) create|what about that)\b/i.test(
        text
    );
const wantsRemainingQuests = (text) =>
    /\bquests?\b.*\b(left|remaining|next|todo|to do)\b|\b(left|remaining)\b.*\bquests?\b/i.test(
        text
    );
const wantsInventory = (text) => /\binventory\b|\bwhat do i have\b/i.test(text);

const activeProcessIds = (gameState = {}, playerStateSummary) => {
    const fromSummary = playerStateSummary?.slices?.activeProcesses?.map((entry) => entry.id) || [];
    const fromState = Object.entries(gameState?.processes || {})
        .filter(([, state]) => state && !state.finished)
        .map(([id]) => id);
    return [...new Set([...fromSummary, ...fromState])];
};

const selectScored = (records, textFn, queryTokens, queryText, cap) =>
    records
        .map((record) => ({
            record,
            score: scoreRecord(record, textFn(record), queryTokens, queryText),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || String(a.record.id).localeCompare(String(b.record.id)))
        .slice(0, cap)
        .map((entry) => entry.record);

const appendLine = (lines, line, maxTotalChars) => {
    if (!line) return false;
    const nextLength = lines.join('\n').length + line.length + 1;
    if (nextLength > maxTotalChars) return false;
    lines.push(line);
    return true;
};

export function buildFocusedGameDataContext({
    query = '',
    messages = [],
    gameState = {},
    playerStateSummary = null,
    options = {},
} = {}) {
    const caps = { ...FOCUSED_GAME_DATA_DEFAULTS, ...options };
    const latest = String(query || '');
    const recent = recentContextText(messages, caps.recentMessageCount);
    const queryText = normalize(`${latest} ${isVagueProcessQuery(latest) ? recent : ''}`);
    const queryTokens = [...new Set(tokensFor(queryText))];
    const reasonCodes = [];

    if (queryTokens.length === 0 && !wantsRemainingQuests(latest) && !wantsInventory(latest)) {
        return {
            block: '',
            sources: [],
            meta: {
                included: false,
                reasonCodes: ['no-focused-game-data-intent'],
                selectedItemCount: 0,
                selectedQuestCount: 0,
                selectedProcessCount: 0,
                selectedAchievementCount: 0,
                renderedChars: 0,
                caps,
                truncated: false,
            },
        };
    }

    if (isVagueProcessQuery(latest)) reasonCodes.push('recent-context-expanded');
    if (wantsRemainingQuests(latest)) reasonCodes.push('remaining-quest-state');
    if (wantsInventory(latest)) reasonCodes.push('inventory-summary-request');

    const inventoryOnlyQuery = wantsInventory(latest) && queryTokens.length === 0;
    const selectedItems = inventoryOnlyQuery
        ? []
        : selectScored(items, itemText, queryTokens, queryText, caps.maxItems);
    let selectedProcesses = selectScored(
        processes,
        processText,
        queryTokens,
        queryText,
        caps.maxProcesses
    );
    if (isVagueProcessQuery(latest)) {
        for (const id of activeProcessIds(gameState, playerStateSummary)) {
            const process = processById.get(id);
            if (process && !selectedProcesses.some((entry) => entry.id === id))
                selectedProcesses.unshift(process);
        }
        selectedProcesses = selectedProcesses.slice(0, caps.maxProcesses);
    }

    let selectedQuests = selectScored(
        questRecords(),
        questText,
        queryTokens,
        queryText,
        caps.maxQuests
    );
    if (wantsRemainingQuests(latest)) {
        for (const remaining of playerStateSummary?.slices?.remainingQuests || []) {
            const quest = getBuiltInQuest(remaining.id);
            if (quest && !selectedQuests.some((entry) => entry.id === quest.id))
                selectedQuests.push(quest);
        }
        selectedQuests = selectedQuests.slice(0, caps.maxQuests);
    }

    const achievements = evaluateAchievements(gameState || {});
    const selectedAchievements =
        queryTokens.length > 0
            ? selectScored(
                  achievements,
                  (a) => [a.id, a.title, a.description, stringifyFields(a.progress)].join(' '),
                  queryTokens,
                  queryText,
                  caps.maxAchievements
              )
            : achievements
                  .filter(
                      (achievement) => achievement.unlocked || achievement.progress?.percent > 0
                  )
                  .slice(0, caps.maxAchievements);

    const inventoryEntries = (inventoryOnlyQuery ? [] : Object.entries(gameState?.inventory || {}))
        .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
        .map(([id, count]) => ({ id, name: itemName(id), count }))
        .filter(
            (entry) =>
                wantsInventory(latest) ||
                scoreRecord(
                    entry,
                    `${entry.id} ${entry.name} ${itemById.get(entry.id)?.description || ''}`,
                    queryTokens,
                    queryText
                ) > 0
        )
        .slice(0, caps.maxItems);

    const lines = [];
    const sources = [];
    appendLine(
        lines,
        'Focused DSPACE game data (query-selected; omitted catalog entries are unknown/omitted, not absent).',
        caps.maxTotalChars
    );
    if (inventoryEntries.length > 0) {
        reasonCodes.push('matched-owned-inventory');
        appendLine(
            lines,
            `Relevant inventory: ${inventoryEntries.map((e) => `${e.name} [${e.id}]=${formatCount(e.count)}`).join('; ')}`,
            caps.maxTotalChars
        );
        sources.push({
            type: 'state',
            id: 'local-game-state',
            label: 'Relevant inventory',
            detail: `${inventoryEntries.length} bounded owned entries`,
        });
    }
    if (selectedProcesses.length > 0) {
        appendLine(
            lines,
            `Relevant processes: ${selectedProcesses.map((process) => truncate(`${process.title} [${process.id}]${process.duration ? ` duration ${process.duration}.` : ''} Requires: ${formatItemList(process.requireItems)}. Consumes: ${formatItemList(process.consumeItems)}. Creates: ${formatItemList(process.createItems)}.`, caps.maxEntityChars)).join(' || ')}`,
            caps.maxTotalChars
        );
        sources.push(
            ...selectedProcesses.map((process) => ({
                type: 'process',
                id: process.id,
                label: process.title,
                url: `/processes/${process.id}`,
            }))
        );
    } else if (isVagueProcessQuery(latest)) {
        reasonCodes.push('ambiguous-process-followup');
        appendLine(
            lines,
            'Relevant processes: no unambiguous process recovered from recent chat; ask which process the player means instead of guessing.',
            caps.maxTotalChars
        );
    }
    if (selectedItems.length > 0) {
        appendLine(
            lines,
            `Relevant items: ${selectedItems.map((item) => truncate(`${item.name} [${item.id}] — ${item.description || ''}${item.category ? ` Category: ${item.category}.` : ''}`, caps.maxEntityChars)).join(' | ')}`,
            caps.maxTotalChars
        );
        sources.push(
            ...selectedItems.map((item) => ({
                type: 'item',
                id: item.id,
                label: item.name,
                url: `/inventory/item/${item.id}`,
                detail: truncate(item.description || '', 180),
            }))
        );
    }
    if (selectedQuests.length > 0) {
        appendLine(
            lines,
            `Relevant quests: ${selectedQuests.map((quest) => truncate(`${quest.title || quest.id} [${quest.id}] — ${quest.description || ''}${quest.requiresQuests?.length ? ` Prereqs: ${quest.requiresQuests.join(', ')}.` : ''}${quest.rewards?.length ? ` Rewards: ${formatQuestRewards(quest.rewards)}.` : ''}${quest.rewardItems?.length ? ` Reward items: ${formatItemList(quest.rewardItems)}.` : ''}`, caps.maxEntityChars)).join(' || ')}`,
            caps.maxTotalChars
        );
        sources.push(
            ...selectedQuests.map((quest) => ({
                type: 'quest',
                id: quest.id,
                label: quest.title || quest.id,
                url: `/quests/${quest.id}`,
                detail: truncate(quest.description || '', 180),
            }))
        );
    }
    if (selectedAchievements.length > 0) {
        appendLine(
            lines,
            `Relevant achievements: ${selectedAchievements.map((a) => truncate(`${a.title} [${a.id}]${a.progress?.displayValue ? ` progress ${a.progress.displayValue}` : ''}`, caps.maxEntityChars)).join(' | ')}`,
            caps.maxTotalChars
        );
        sources.push(
            ...selectedAchievements.map((a) => ({ type: 'achievement', id: a.id, label: a.title }))
        );
    }
    if (
        (wantsRemainingQuests(latest) || playerStateSummary?.slices?.remainingQuests?.length) &&
        selectedQuests.length > 0
    ) {
        appendLine(
            lines,
            `Relevant player progress: compact PlayerState is authoritative for remaining/finished quest counts; selected quest definitions above are only details for shown IDs.`,
            caps.maxTotalChars
        );
    }

    const block = lines.length > 1 ? lines.join('\n') : '';
    return {
        block,
        sources: mergeSources(sources).slice(0, caps.maxSources),
        meta: {
            included: Boolean(block),
            reasonCodes: reasonCodes.length
                ? [...new Set(reasonCodes)]
                : [block ? 'lexical-match' : 'no-focused-matches'],
            selectedItemIds: selectedItems.map((item) => item.id),
            selectedQuestIds: selectedQuests.map((quest) => quest.id),
            selectedProcessIds: selectedProcesses.map((process) => process.id),
            selectedAchievementIds: selectedAchievements.map((achievement) => achievement.id),
            selectedInventoryIds: inventoryEntries.map((entry) => entry.id),
            selectedItemCount: selectedItems.length,
            selectedQuestCount: selectedQuests.length,
            selectedProcessCount: selectedProcesses.length,
            selectedAchievementCount: selectedAchievements.length,
            selectedInventoryCount: inventoryEntries.length,
            renderedChars: block.length,
            caps,
            truncated: block.length >= caps.maxTotalChars || sources.length > caps.maxSources,
        },
    };
}

export function __testables() {
    return { normalize, tokensFor, scoreRecord };
}
