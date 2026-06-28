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

const RESOURCE_TOKENS = ['dUSD', 'dBI', 'dWatt', 'dSolar', 'dPrint', 'dLaunch', 'dWind'];

const normalize = (value) =>
    String(value || '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .replace(/[-_/.]+/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\b(grams?|g|mm|cm|kg|kwh|wh|w)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const singularizeToken = (token) => {
    if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
    if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
    if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
    return token;
};

const tokensFor = (value) =>
    normalize(value)
        .split(' ')
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
        .flatMap((token) => [...new Set([token, singularizeToken(token)])]);

const compactEntityAliases = (text) => {
    const normalized = normalize(text);
    const aliases = [];
    if (/\bbenchy?\b/.test(normalized)) aliases.push('benchy calibration model 3dprint benchy');
    if (/\brocket(s)?\b/.test(normalized))
        aliases.push('model rocket 3d printed rocket rocketry launch');
    if (/\bgreen\s+pla\b/.test(normalized)) aliases.push('green pla filament');
    for (const token of RESOURCE_TOKENS) {
        const resource = normalize(token);
        if (normalized.includes(resource)) aliases.push(`${token} ${resource}`);
    }
    return aliases.join(' ');
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
    entries.map((entry) => entry?.id).filter((id) => typeof id === 'string' && id.length > 0);

const addUniqueById = (records, record, cap) => {
    if (!record || records.some((entry) => entry.id === record.id) || records.length >= cap)
        return false;
    records.push(record);
    return true;
};

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

const relationshipItemIdsForProcess = (process) => [
    ...itemEntryIds(process?.requireItems),
    ...itemEntryIds(process?.consumeItems),
    ...itemEntryIds(process?.createItems),
];

const processTouchesItem = (process, itemId) =>
    relationshipItemIdsForProcess(process).includes(itemId);

const questRewardIds = (quest) => [
    ...itemEntryIds(quest?.rewards),
    ...itemEntryIds(quest?.rewardItems),
    ...itemEntryIds(quest?.grantsItems),
];

const questRequirementIds = (quest) =>
    [stringifyFields(quest?.nodes), stringifyFields(quest?.requiresItems)].join(' ');

const collectOwnedForItems = (itemIds, gameState = {}, cap) =>
    [...new Set(itemIds)]
        .map((id) => ({ id, name: itemName(id), count: gameState?.inventory?.[id] }))
        .filter(
            (entry) =>
                typeof entry.count === 'number' && Number.isFinite(entry.count) && entry.count > 0
        )
        .slice(0, cap);

const isVagueProcessQuery = (text) =>
    /\b(what does (it|that|this)( process)? consume|what does (it|that|this)( process)? create)\b/i.test(
        text
    );
const isVagueEntityFollowup = (text) =>
    /\b(what rewards? does (it|that|this) give|what does (it|that|this) give|what about (it|that|this|that))\b/i.test(
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
    const rewardIntent = /\b(rewards?|rewarded|unlocks?|unlock|give|gives)\b/i.test(latest);
    const rewardFollowup = isVagueEntityFollowup(latest) && rewardIntent;
    const aliasText = compactEntityAliases(`${latest} ${vagueFollowup ? recent : ''}`);
    const queryText = normalize(`${latest} ${aliasText} ${vagueFollowup ? recent : ''}`);
    const queryTokens = [...new Set(tokensFor(queryText))];
    const reasonCodes = [];

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
    if (RESOURCE_TOKENS.some((token) => normalize(latest).includes(normalize(token))))
        reasonCodes.push('resource-token-hit');

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
    if (wantsRemainingQuests(latest)) {
        for (const remaining of playerStateSummary?.slices?.remainingQuests || []) {
            const quest = getBuiltInQuest(remaining.id);
            if (quest && !selectedQuests.some((entry) => entry.id === quest.id))
                selectedQuests.push(quest);
        }
        selectedQuests = selectedQuests.slice(0, caps.maxQuests);
    }
    const directlySelectedQuestIds = selectedQuests.map((quest) => quest.id);

    for (const item of [...selectedItems]) {
        for (const process of processes) {
            if (
                processTouchesItem(process, item.id) &&
                addUniqueById(selectedProcesses, process, caps.maxProcesses)
            ) {
                reasonCodes.push(
                    itemEntryIds(process.createItems).includes(item.id)
                        ? 'process-creates-match'
                        : 'process-consumes-match'
                );
            }
        }
        for (const quest of questRecords()) {
            if (
                questRewardIds(quest).includes(item.id) &&
                addUniqueById(selectedQuests, quest, caps.maxQuests)
            ) {
                reasonCodes.push('quest-reward-match');
            } else if (
                normalize(questRequirementIds(quest)).includes(normalize(item.name || item.id)) &&
                addUniqueById(selectedQuests, quest, caps.maxQuests)
            ) {
                reasonCodes.push('quest-prereq-match');
            }
        }
    }
    for (const process of [...selectedProcesses]) {
        for (const id of relationshipItemIdsForProcess(process)) {
            addUniqueById(selectedItems, itemById.get(id), caps.maxItems);
        }
    }
    for (const quest of [...selectedQuests]) {
        for (const id of [...questRewardIds(quest), ...(quest.requiresQuests || [])]) {
            addUniqueById(selectedItems, itemById.get(id), caps.maxItems);
            const prereqQuest = getBuiltInQuest(id);
            if (prereqQuest) {
                addUniqueById(selectedQuests, prereqQuest, caps.maxQuests);
                reasonCodes.push('quest-prereq-match');
            }
        }
    }
    if (selectedItems.length || selectedProcesses.length || selectedQuests.length)
        reasonCodes.push('direct-entity-hit');
    if (
        (rewardFollowup && directlySelectedQuestIds.length > 0) ||
        (rewardIntent && selectedQuests.length > 0)
    ) {
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

    const relatedOwnedInventory = collectOwnedForItems(
        [
            ...selectedItems.map((item) => item.id),
            ...selectedProcesses.flatMap((process) => relationshipItemIdsForProcess(process)),
            ...selectedQuests.flatMap((quest) => questRewardIds(quest)),
        ],
        gameState,
        caps.maxItems
    );

    const inventoryEntries = relatedOwnedInventory.length
        ? relatedOwnedInventory
        : Object.entries(gameState?.inventory || {})
              .filter(
                  ([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0
              )
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
            `Relevant inventory: Relevant owned inventory: ${inventoryEntries.map((e) => `${e.name} [${e.id}]=${formatCount(e.count)}`).join('; ')}`,
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
    const relationshipLines = selectedProcesses
        .map((process) => {
            const related = relationshipItemIdsForProcess(process)
                .map((id) => itemById.get(id)?.name || id)
                .slice(0, 6)
                .join(', ');
            return related ? `${process.title} [${process.id}] touches ${related}` : '';
        })
        .filter(Boolean)
        .slice(0, 4);
    if (relationshipLines.length > 0) {
        appendLine(
            lines,
            `Relevant relationships: ${relationshipLines.join(' | ')}`,
            caps.maxTotalChars
        );
    }
    if (vagueFollowup) {
        appendLine(
            lines,
            selectedProcesses.length || selectedQuests.length || selectedItems.length
                ? 'Relevant follow-up context: carried over clear recent entity mentions when available; if multiple entities are shown, ask which one the player means.'
                : 'Relevant follow-up context: no clear recent entity was available.',
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
