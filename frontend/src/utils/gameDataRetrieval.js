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
    maxRelationships: 10,
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

const RESOURCE_ALIASES = new Set(['dusd', 'dbi', 'dwatt', 'dsolar', 'dprint', 'dlaunch', 'dwind']);
const COMPACT_ALIASES = [
    { pattern: /\bbench(y|ies)\b/i, terms: ['benchy', 'calibration model', 'calibration boat'] },
    { pattern: /\brockets?\b/i, terms: ['model rocket', '3d printed rocket', 'rocket'] },
    { pattern: /\bgreen\s*pla\b/i, terms: ['green pla filament'] },
];

const itemById = new Map(items.map((item) => [item.id, item]));
const processById = new Map(processes.map((process) => [process.id, process]));

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[-_/]+/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\b(d)\s+(usd|bi|watt|solar|print|launch|wind)\b/g, '$1$2')
        .replace(/\s+/g, ' ')
        .trim();

const tokensFor = (value) =>
    normalize(value)
        .split(' ')
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
        .flatMap((token) => {
            const variants = [token];
            if (token.endsWith('ies')) variants.push(`${token.slice(0, -3)}y`);
            else if (token.endsWith('s') && token.length > 3) variants.push(token.slice(0, -1));
            if (token.endsWith('checklist')) variants.push('check');
            return variants;
        });

const expandQueryText = (value) => {
    const raw = String(value || '');
    const aliases = COMPACT_ALIASES.filter((alias) => alias.pattern.test(raw)).flatMap(
        (alias) => alias.terms
    );
    return [raw, ...aliases].join(' ');
};

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

const itemEntryText = (entries = []) =>
    entries.map((entry) => [stringifyFields(entry), itemName(entry?.id)].join(' ')).join(' ');

const itemEntryIds = (entries = []) =>
    entries.map((entry) => entry?.id).filter((id) => typeof id === 'string' && id);

const processText = (process) =>
    [
        process.id,
        process.title,
        process.description,
        itemEntryText(process.requireItems),
        itemEntryText(process.consumeItems),
        itemEntryText(process.createItems),
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

const questRewardIds = (quest) => [
    ...itemEntryIds(quest.rewards),
    ...itemEntryIds(quest.rewardItems),
];

const scoreRecord = (record, haystackText, queryTokens, queryText) => {
    const haystack = normalize(haystackText);
    if (!haystack || queryTokens.length === 0) return 0;
    const haystackWords = new Set(haystack.split(' '));
    let score = 0;
    for (const token of queryTokens) {
        if (haystackWords.has(token)) score += 2;
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
    /\b(what does (it|that|this)( process)? consume|what does (it|that|this)( process)? create)\b/i.test(
        text
    );
const isVagueEntityFollowup = (text) =>
    /\b(what rewards? does (it|that|this) give|what does (it|that|this) give|what about (it|that|this|those)|can i make (it|that|this)|can i build (it|that|this))\b/i.test(
        text
    );
const wantsRemainingQuests = (text) =>
    /\bquests?\b.*\b(left|remaining|next|todo|to do)\b|\b(left|remaining)\b.*\bquests?\b/i.test(
        text
    );
const wantsInventory = (text) => /\binventory\b|\bwhat do i have\b/i.test(text);
const wantsAchievements = (text) => /\bachievements?\b|\bunlocked\b.*\bachievements?\b/i.test(text);

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

const addUniqueById = (target, records, cap) => {
    if (target.length >= cap) return;
    for (const record of records) {
        if (record?.id && !target.some((entry) => entry.id === record.id)) target.push(record);
        if (target.length >= cap) break;
    }
};

const processItemIds = (process) => ({
    require: itemEntryIds(process.requireItems),
    consume: itemEntryIds(process.consumeItems),
    create: itemEntryIds(process.createItems),
});

const relationshipLines = ({ selectedItems, selectedProcesses, selectedQuests, cap }) => {
    const itemIds = new Set(selectedItems.map((item) => item.id));
    const processIds = new Set(selectedProcesses.map((process) => process.id));
    const questIds = new Set(selectedQuests.map((quest) => quest.id));
    const lines = [];
    for (const process of processes) {
        const ids = processItemIds(process);
        const links = [];
        if (ids.require.some((id) => itemIds.has(id))) links.push('requires selected item');
        if (ids.consume.some((id) => itemIds.has(id))) links.push('consumes selected item');
        if (ids.create.some((id) => itemIds.has(id))) links.push('creates selected item');
        if (processIds.has(process.id)) {
            lines.push(
                `${process.title} [${process.id}] -> requires ${formatItemList(process.requireItems) || 'none listed'}; consumes ${formatItemList(process.consumeItems) || 'none listed'}; creates ${formatItemList(process.createItems) || 'none listed'}`
            );
        } else if (links.length) {
            lines.push(`${process.title} [${process.id}] ${links.join(', ')}`);
        }
        if (lines.length >= cap) return lines;
    }
    for (const quest of questRecords()) {
        if (!questIds.has(quest.id) && !questRewardIds(quest).some((id) => itemIds.has(id)))
            continue;
        lines.push(
            `${quest.title || quest.id} [${quest.id}] -> prereqs ${quest.requiresQuests?.join(', ') || 'none listed'}; rewards ${formatQuestRewards(quest.rewards) || formatItemList(quest.rewardItems) || 'none listed'}`
        );
        if (lines.length >= cap) return lines;
    }
    return lines;
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
    const vagueFollowup = isVagueProcessQuery(latest) || isVagueEntityFollowup(latest);
    const rewardFollowup =
        isVagueEntityFollowup(latest) && /\b(rewards?|give|gives)\b/i.test(latest);
    const expandedLatest = expandQueryText(latest);
    const expandedRecent = expandQueryText(recent);
    const queryText = normalize(`${expandedLatest} ${vagueFollowup ? expandedRecent : ''}`);
    const queryTokens = [...new Set(tokensFor(queryText))];
    const reasonCodes = [];
    if (COMPACT_ALIASES.some((alias) => alias.pattern.test(latest)))
        reasonCodes.push('direct-entity-hit');
    if (queryTokens.some((token) => RESOURCE_ALIASES.has(token)))
        reasonCodes.push('resource-token-hit');

    const achievementIntent = wantsAchievements(latest);

    if (
        queryTokens.length === 0 &&
        !wantsRemainingQuests(latest) &&
        !wantsInventory(latest) &&
        !achievementIntent &&
        !vagueFollowup
    ) {
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
                selectedInventoryCount: 0,
                selectedItemIds: [],
                selectedQuestIds: [],
                selectedProcessIds: [],
                selectedAchievementIds: [],
                selectedInventoryIds: [],
                renderedChars: 0,
                caps,
                truncated: false,
            },
        };
    }

    if (vagueFollowup) reasonCodes.push('followup-entity-carryover', 'recent-context-expanded');
    if (wantsRemainingQuests(latest)) reasonCodes.push('remaining-quest-state');
    if (wantsInventory(latest)) reasonCodes.push('inventory-summary-request');
    if (achievementIntent) reasonCodes.push('achievement-state-request');

    const inventoryOnlyQuery = wantsInventory(latest) && queryTokens.length === 0;
    let selectedItems = inventoryOnlyQuery
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
    if (/\b(rewards?|give|gives|unlocks?|quests?)\b/i.test(latest) && selectedQuests.length > 0) {
        selectedProcesses = selectedProcesses.filter((process) =>
            selectedQuests.some((quest) =>
                normalize(quest.title || quest.id).includes(normalize(process.title))
            )
        );
    }

    const directlySelectedItemIds = new Set(selectedItems.map((item) => item.id));
    const directlySelectedProcessIds = new Set(selectedProcesses.map((process) => process.id));
    const directlySelectedQuestIds = new Set(selectedQuests.map((quest) => quest.id));

    const relatedProcesses = [];
    for (const item of selectedItems) {
        const matches = processes.filter((process) => {
            const ids = processItemIds(process);
            return (
                ids.require.includes(item.id) ||
                ids.consume.includes(item.id) ||
                ids.create.includes(item.id)
            );
        });
        if (matches.some((process) => itemEntryIds(process.createItems).includes(item.id)))
            reasonCodes.push('process-creates-match');
        if (matches.some((process) => itemEntryIds(process.consumeItems).includes(item.id)))
            reasonCodes.push('process-consumes-match');
        addUniqueById(relatedProcesses, matches, caps.maxProcesses);
    }
    addUniqueById(selectedProcesses, relatedProcesses, caps.maxProcesses);

    const relatedItems = [];
    for (const process of selectedProcesses) {
        const ids = [
            ...itemEntryIds(process.requireItems),
            ...itemEntryIds(process.consumeItems),
            ...itemEntryIds(process.createItems),
        ];
        addUniqueById(
            relatedItems,
            ids.map((id) => itemById.get(id)).filter(Boolean),
            caps.maxItems
        );
    }
    if (relatedItems.length > 0) {
        const mergedItems = [];
        addUniqueById(mergedItems, relatedItems, caps.maxItems);
        addUniqueById(mergedItems, selectedItems, caps.maxItems);
        selectedItems = mergedItems;
    }

    const relatedQuests = questRecords().filter((quest) => {
        const rewardHit = questRewardIds(quest).some((id) =>
            selectedItems.some((item) => item.id === id)
        );
        const prereqHit = quest.requiresQuests?.some((id) =>
            selectedQuests.some((selected) => selected.id === id)
        );
        if (rewardHit) reasonCodes.push('quest-reward-match');
        if (prereqHit) reasonCodes.push('quest-prereq-match');
        return rewardHit || prereqHit;
    });
    addUniqueById(selectedQuests, relatedQuests, caps.maxQuests);
    if (wantsRemainingQuests(latest)) {
        for (const remaining of playerStateSummary?.slices?.remainingQuests || []) {
            const quest = getBuiltInQuest(remaining.id);
            if (quest && !selectedQuests.some((entry) => entry.id === quest.id))
                selectedQuests.push(quest);
        }
        selectedQuests = selectedQuests.slice(0, caps.maxQuests);
    }
    if (rewardFollowup && selectedQuests.length > 0) {
        selectedItems = [];
        selectedProcesses = [];
    }

    const achievements = evaluateAchievements(gameState || {});
    const achievementStateEntries = achievements.filter(
        (achievement) => achievement.unlocked || achievement.progress?.percent > 0
    );
    const shouldReturnAchievementState =
        achievementIntent && (queryTokens.length === 0 || /\bunlocked\b/i.test(latest));
    const selectedAchievements = shouldReturnAchievementState
        ? achievementStateEntries.slice(0, caps.maxAchievements)
        : achievementIntent && queryTokens.length > 0
          ? selectScored(
                achievements,
                (a) =>
                    [
                        a.id,
                        a.title,
                        a.description,
                        a.unlocked ? 'achievement unlocked earned complete' : '',
                        a.progress?.percent > 0 ? 'achievement progress in progress' : '',
                        stringifyFields(a.progress),
                    ].join(' '),
                queryTokens,
                queryText,
                caps.maxAchievements
            )
          : [];

    const inventoryEntries = Object.entries(gameState?.inventory || {})
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
        reasonCodes.push('owned-inventory-hit');
        appendLine(
            lines,
            `Relevant owned inventory / Relevant inventory: ${inventoryEntries.map((e) => `${e.name} [${e.id}]=${formatCount(e.count)}`).join('; ')}`,
            caps.maxTotalChars
        );
        sources.push({
            type: 'state',
            id: 'focused-inventory',
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
    const relationships = relationshipLines({
        selectedItems,
        selectedProcesses,
        selectedQuests,
        cap: caps.maxRelationships,
    });
    if (relationships.length > 0) {
        appendLine(
            lines,
            `Relevant relationships: ${relationships.map((line) => truncate(line, caps.maxEntityChars)).join(' || ')}`,
            caps.maxTotalChars
        );
    }
    if (vagueFollowup && lines.length > 1) {
        appendLine(
            lines,
            `Relevant follow-up context: recent turns were searched only to resolve pronouns like it/that; selected IDs above are bounded.`,
            caps.maxTotalChars
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
            truncatedSources: sources.length > caps.maxSources,
            truncatedChars: block.length >= caps.maxTotalChars,
            directSelectedItemIds: [...directlySelectedItemIds],
            directSelectedQuestIds: [...directlySelectedQuestIds],
            directSelectedProcessIds: [...directlySelectedProcessIds],
        },
    };
}

export function __testables() {
    return { normalize, tokensFor, scoreRecord };
}
