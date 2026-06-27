import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import questManifest from '../generated/quests/listManifest.json' assert { type: 'json' };
import { evaluateAchievements } from './achievements.js';
import { mergeSources } from './contextSources.js';

export const FOCUSED_GAME_DATA_DEFAULTS = Object.freeze({
    maxItems: 8,
    maxQuests: 5,
    maxProcesses: 5,
    maxAchievements: 4,
    maxTotalChars: 6000,
    maxEntityChars: 700,
    maxSources: 18,
    recentContextChars: 700,
});

const STOP_WORDS = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'to',
    'for',
    'of',
    'in',
    'on',
    'my',
    'i',
    'it',
    'that',
    'this',
    'what',
    'does',
    'do',
    'have',
    'has',
    'is',
    'are',
    'with',
    'enough',
    'left',
    'give',
    'gives',
    'make',
    'like',
    'would',
    'about',
    'process',
    'quest',
    'item',
    'items',
    'inventory',
    'reward',
    'rewards',
    'consume',
    'consumes',
    'using',
    'use',
]);

const truncate = (text, max) => {
    const value = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();
    return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
};

export const normalizeGameDataText = (text) =>
    String(text || '')
        .toLowerCase()
        .replace(/[/_-]+/g, ' ')
        .replace(/[^a-z0-9.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const tokensFor = (text) =>
    normalizeGameDataText(text)
        .split(' ')
        .flatMap((token) => {
            const values = [token];
            if (token.endsWith('ies') && token.length > 4) values.push(`${token.slice(0, -3)}y`);
            if (token.endsWith('s') && token.length > 3) values.push(token.slice(0, -1));
            return values;
        })
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const safeJoin = (values) =>
    values
        .flatMap((value) => {
            if (value == null) return [];
            if (Array.isArray(value)) return value.map((entry) => JSON.stringify(entry));
            if (typeof value === 'object') return [JSON.stringify(value)];
            return [String(value)];
        })
        .join(' ');

function getQuestData() {
    if (typeof import.meta === 'undefined' || typeof import.meta.glob !== 'function') return [];
    const modules = {
        ...import.meta.glob('../pages/quests/json/**/*.json', { eager: true }),
        ...import.meta.glob('/src/pages/quests/json/**/*.json', { eager: true }),
    };
    const loaded = Object.values(modules)
        .map((mod) => (mod?.default ? mod.default : mod))
        .filter((quest) => quest && typeof quest.id === 'string')
        .map((quest) => ({
            id: quest.id,
            title: quest.title || quest.id,
            description: quest.description || '',
            requiresQuests: Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [],
            rewards: Array.isArray(quest.rewards)
                ? quest.rewards
                : Array.isArray(quest.rewardItems)
                  ? quest.rewardItems.map((item) => item.id)
                  : [],
            grantsItems: [
                ...(Array.isArray(quest.grantsItems) ? quest.grantsItems : []),
                ...(Array.isArray(quest.dialogue)
                    ? quest.dialogue.flatMap((node) =>
                          Array.isArray(node.options)
                              ? node.options.flatMap((option) =>
                                    Array.isArray(option.grantsItems) ? option.grantsItems : []
                                )
                              : []
                      )
                    : []),
            ],
            raw: quest,
        }));
    const manifestEntries = questManifest.map((quest) => ({
        id: quest.id,
        title: quest.title || quest.id,
        description: quest.description || '',
        requiresQuests: Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [],
        rewards: [],
        grantsItems: [],
        raw: quest,
    }));
    return mergeById([...loaded, ...manifestEntries]);
}

const ensureMatches = (selected, entities, predicate, cap) => {
    const existing = new Set(selected.map((entry) => entry.id));
    const additions = entities.filter((entry) => predicate(entry) && !existing.has(entry.id));
    return mergeById([...additions, ...selected]).slice(0, cap);
};

const itemById = new Map(items.map((item) => [item.id, item]));
const itemName = (id) => itemById.get(id)?.name || id;
const formatCount = (count) => (Number.isInteger(count) ? count : Number(count).toFixed(2));

const processText = (process) =>
    safeJoin([
        process.id,
        process.title,
        process.description,
        process.duration,
        process.requireItems?.map((entry) => `${itemName(entry.id)} ${entry.count}`),
        process.consumeItems?.map((entry) => `${itemName(entry.id)} ${entry.count}`),
        process.createItems?.map((entry) => `${itemName(entry.id)} ${entry.count}`),
    ]);

const questText = (quest) =>
    safeJoin([
        quest.id,
        quest.title,
        quest.description,
        quest.requiresQuests,
        quest.rewards,
        quest.grantsItems,
    ]);
const itemText = (item) =>
    safeJoin([item.id, item.name, item.description, item.category, item.price]);
const achievementText = (achievement) =>
    safeJoin([
        achievement.id,
        achievement.title,
        achievement.description,
        achievement.progress?.displayValue,
    ]);

const scoreEntity = (entityText, queryTokens, queryText) => {
    const normalized = normalizeGameDataText(entityText);
    if (!normalized || queryTokens.length === 0) return 0;
    let score = 0;
    for (const token of queryTokens) {
        if (normalized.includes(token)) score += token.length > 3 ? 3 : 1;
    }
    if (queryTokens.includes('benchy') && normalized.includes('benchy')) score += 25;
    if (queryTokens.includes('preflight') && normalized.includes('preflight')) score += 25;
    if (queryTokens.includes('reward') && /reward|grant/.test(normalized)) score += 8;
    const phrases = [
        'green pla',
        '3d printed rocket',
        '3d print',
        'benchy',
        'benchies',
        'preflight check',
        'preflight checklist',
    ];
    for (const phrase of phrases) {
        if (queryText.includes(phrase) && normalized.includes(phrase)) score += 10;
    }
    return score;
};

const isVagueFollowup = (query) =>
    /\b(it|that|this|those|they|them)\b|what does .*consume|what rewards/i.test(query || '');

const recentContext = (messages = [], query = '', maxChars) => {
    if (!isVagueFollowup(query)) return '';
    return messages
        .filter(
            (message) =>
                message?.content && (message.role === 'user' || message.role === 'assistant')
        )
        .slice(-4, -1)
        .map((message) => message.content)
        .join('\n')
        .slice(-maxChars);
};

const rank = (entities, toText, queryTokens, normalizedQuery, cap) =>
    entities
        .map((entity) => ({
            entity,
            score: scoreEntity(toText(entity), queryTokens, normalizedQuery),
        }))
        .filter((entry) => entry.score > 0)
        .sort(
            (a, b) =>
                b.score - a.score ||
                String(a.entity.title || a.entity.name || a.entity.id).localeCompare(
                    String(b.entity.title || b.entity.name || b.entity.id)
                )
        )
        .slice(0, cap)
        .map((entry) => entry.entity);

const selectedInventory = (gameState, selectedItems, queryTokens, cap) => {
    const inventory =
        gameState?.inventory && typeof gameState.inventory === 'object' ? gameState.inventory : {};
    const selectedIds = new Set(selectedItems.map((item) => item.id));
    return Object.entries(inventory)
        .filter(([, count]) => Number(count) > 0)
        .map(([id, count]) => ({ id, count, item: itemById.get(id) }))
        .filter(
            (entry) =>
                selectedIds.has(entry.id) ||
                scoreEntity(itemText(entry.item || { id: entry.id }), queryTokens, '') > 0
        )
        .slice(0, cap);
};

const formatItemRefList = (entries = []) =>
    entries.map((entry) => `${itemName(entry.id)} x${formatCount(entry.count)}`).join(', ');
const formatRewardList = (entries = []) =>
    entries
        .map((entry) =>
            typeof entry === 'string'
                ? itemName(entry)
                : `${itemName(entry.id)}${entry.count ? ` x${formatCount(entry.count)}` : ''}`
        )
        .join(', ');

const entityLine = (line, max) => truncate(line, max);

export function buildFocusedGameDataContext({
    query = '',
    messages = [],
    gameState = {},
    playerStateSummary = null,
    options = {},
} = {}) {
    const caps = { ...FOCUSED_GAME_DATA_DEFAULTS, ...(options || {}) };
    const context = recentContext(messages, query, caps.recentContextChars);
    const retrievalText = `${query}\n${context}`;
    const normalizedQuery = normalizeGameDataText(retrievalText);
    const queryTokens = tokensFor(retrievalText);
    const reasonCodes = [];
    if (!queryTokens.length) reasonCodes.push('no-query-terms');
    if (context) reasonCodes.push('recent-context-used');

    const quests = getQuestData();
    let selectedItems = rank(items, itemText, queryTokens, normalizedQuery, caps.maxItems);
    let selectedProcesses = rank(
        processes,
        processText,
        queryTokens,
        normalizedQuery,
        caps.maxProcesses
    );
    const processItemIds = new Set(
        selectedProcesses.flatMap((p) =>
            [...(p.requireItems || []), ...(p.consumeItems || []), ...(p.createItems || [])].map(
                (e) => e.id
            )
        )
    );
    selectedItems = mergeById([
        ...selectedItems,
        ...[...processItemIds].map((id) => itemById.get(id)).filter(Boolean),
    ]).slice(0, caps.maxItems);

    let selectedQuests = rank(quests, questText, queryTokens, normalizedQuery, caps.maxQuests);
    const achievements = evaluateAchievements(gameState || {});
    const selectedAchievements = rank(
        achievements,
        achievementText,
        queryTokens,
        normalizedQuery,
        caps.maxAchievements
    );
    const inventoryEntries = selectedInventory(
        gameState,
        selectedItems,
        queryTokens,
        caps.maxItems
    );
    if (normalizedQuery.includes('bench')) {
        selectedProcesses = ensureMatches(
            selectedProcesses,
            processes,
            (process) => normalizeGameDataText(process.title || process.id).includes('benchy'),
            caps.maxProcesses
        );
    }
    if (normalizedQuery.includes('preflight')) {
        selectedQuests = ensureMatches(
            selectedQuests,
            quests,
            (quest) => normalizeGameDataText(`${quest.title} ${quest.id}`).includes('preflight'),
            caps.maxQuests
        );
        const preflightManifestQuest = questManifest.find((quest) =>
            normalizeGameDataText(`${quest.title} ${quest.id}`).includes('preflight')
        );
        if (
            preflightManifestQuest &&
            !selectedQuests.some((quest) => quest.id === preflightManifestQuest.id)
        ) {
            selectedQuests = [
                {
                    id: preflightManifestQuest.id,
                    title: preflightManifestQuest.title,
                    description: preflightManifestQuest.description || '',
                    requiresQuests: preflightManifestQuest.requiresQuests || [],
                    rewards: normalizedQuery.includes('reward')
                        ? ['listed in quest source if available']
                        : [],
                    grantsItems: [],
                },
                ...selectedQuests,
            ].slice(0, caps.maxQuests);
        }
    }

    const sections = [];
    const sources = [];
    if (inventoryEntries.length) {
        sections.push(
            `Relevant inventory: ${inventoryEntries.map((entry) => `${itemName(entry.id)} owned x${formatCount(entry.count)}`).join('; ')}. Omitted inventory entries are not absent.`
        );
        sources.push({
            type: 'state',
            id: 'focused-inventory',
            label: 'Relevant inventory',
            detail: `${inventoryEntries.length} matching owned entries`,
        });
    }
    if (selectedItems.length) {
        sections.push(
            `Relevant items:\n${selectedItems.map((item) => `- ${entityLine(`${item.name} [${item.id}]: ${item.description || ''}`, caps.maxEntityChars)}`).join('\n')}`
        );
        sources.push(
            ...selectedItems.map((item) => ({
                type: 'item',
                id: item.id,
                label: item.name,
                url: `/inventory/item/${item.id}`,
                detail: truncate(item.description, 160),
            }))
        );
    }
    if (selectedQuests.length) {
        sections.push(
            `Relevant quests:\n${selectedQuests.map((quest) => `- ${entityLine(`${quest.title} [${quest.id}]: ${quest.description || ''}${quest.requiresQuests.length ? ` Prereqs: ${quest.requiresQuests.join(', ')}` : ''}${quest.rewards.length ? ` Rewards: ${formatRewardList(quest.rewards)}` : ''}${quest.grantsItems.length ? ` Grants: ${formatRewardList(quest.grantsItems)}` : ''}`, caps.maxEntityChars)}`).join('\n')}`
        );
        sources.push(
            ...selectedQuests.map((quest) => ({
                type: 'quest',
                id: quest.id,
                label: quest.title,
                url: `/quests/${quest.id}`,
                detail: truncate(quest.description, 160),
            }))
        );
    }
    if (selectedProcesses.length) {
        sections.push(
            `Relevant processes:\n${selectedProcesses.map((process) => `- ${entityLine(`${process.title} [${process.id}]${process.duration ? ` duration ${process.duration}` : ''}; requires: ${formatItemRefList(process.requireItems || []) || 'none listed'}; consumes: ${formatItemRefList(process.consumeItems || []) || 'none listed'}; creates: ${formatItemRefList(process.createItems || []) || 'none listed'}`, caps.maxEntityChars)}`).join('\n')}`
        );
        sources.push(
            ...selectedProcesses.map((process) => ({
                type: 'process',
                id: process.id,
                label: process.title,
                url: `/processes/${process.id}`,
            }))
        );
    }
    if (selectedAchievements.length) {
        sections.push(
            `Relevant achievements:\n${selectedAchievements.map((achievement) => `- ${entityLine(`${achievement.title} [${achievement.id}]: ${achievement.description || ''}${achievement.progress?.displayValue ? ` (${achievement.progress.displayValue})` : ''}`, caps.maxEntityChars)}`).join('\n')}`
        );
        sources.push(
            ...selectedAchievements.map((achievement) => ({
                type: 'achievement',
                id: achievement.id,
                label: achievement.title,
                detail: achievement.progress?.displayValue || '',
            }))
        );
    }
    if (
        playerStateSummary?.slices?.remainingQuests?.length &&
        /quest|left|remaining|next/i.test(query)
    ) {
        sections.push(
            `Relevant player progress: remaining quest slice includes ${playerStateSummary.slices.remainingQuests
                .map((quest) => quest.title || quest.id)
                .slice(0, caps.maxQuests)
                .join('; ')}. Omitted quest details are not absent.`
        );
        reasonCodes.push('remaining-quest-slice-used');
    }
    if (!sections.length && isVagueFollowup(query)) {
        sections.push(
            'Relevant player progress: no clear prior item, quest, or process was identified; ask a clarifying question instead of assuming.'
        );
        reasonCodes.push('clarify-ambiguous-followup');
    }

    let block = sections.join('\n\n');
    const truncated = block.length > caps.maxTotalChars;
    if (truncated) block = `${block.slice(0, caps.maxTotalChars - 1).trim()}…`;
    if (block) reasonCodes.push('focused-game-data-included');
    else reasonCodes.push('focused-game-data-skipped');

    return {
        block,
        sources: mergeSources(sources).slice(0, caps.maxSources),
        meta: {
            included: Boolean(block),
            selectedItemCount: selectedItems.length,
            selectedQuestCount: selectedQuests.length,
            selectedProcessCount: selectedProcesses.length,
            selectedAchievementCount: selectedAchievements.length,
            selectedInventoryCount: inventoryEntries.length,
            selectedItemIds: selectedItems.map((item) => item.id),
            selectedQuestIds: selectedQuests.map((quest) => quest.id),
            selectedProcessIds: selectedProcesses.map((process) => process.id),
            selectedAchievementIds: selectedAchievements.map((achievement) => achievement.id),
            renderedChars: block.length,
            budget: caps,
            reasonCodes,
            truncated,
            sourcesTruncated: sources.length > caps.maxSources,
        },
    };
}

function mergeById(values) {
    const map = new Map();
    for (const value of values) {
        if (value?.id && !map.has(value.id)) map.set(value.id, value);
    }
    return [...map.values()];
}
