import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import questManifest from '../generated/quests/listManifest.json' assert { type: 'json' };
import { evaluateAchievements } from './achievements.js';
import { mergeSources } from './contextSources.js';

export const FOCUSED_GAME_DATA_DEFAULTS = Object.freeze({
    maxItems: 8,
    maxQuests: 6,
    maxProcesses: 6,
    maxAchievements: 4,
    maxSources: 18,
    maxEntityChars: 520,
    maxTotalChars: 6000,
});

const STOP_WORDS = new Set([
    'a',
    'an',
    'and',
    'are',
    'about',
    'do',
    'does',
    'for',
    'give',
    'have',
    'how',
    'i',
    'is',
    'it',
    'left',
    'make',
    'me',
    'my',
    'of',
    'or',
    'that',
    'the',
    'this',
    'to',
    'tell',
    'what',
    'where',
    'with',
    'would',
    'like',
    'enough',
    'consume',
    'consumes',
    'rewards',
    'reward',
    'process',
    'quest',
    'quests',
    'inventory',
]);

export const normalizeGameDataText = (value) =>
    String(value ?? '')
        .toLowerCase()
        .replace(/([a-z])([0-9])/g, '$1 $2')
        .replace(/([0-9])([a-z])/g, '$1 $2')
        .replace(/[/_-]+/g, ' ')
        .replace(/[^a-z0-9.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const tokensFor = (value) =>
    normalizeGameDataText(value)
        .split(' ')
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const truncate = (text, max) => {
    const value = String(text ?? '')
        .replace(/\s+/g, ' ')
        .trim();
    if (value.length <= max) return value;
    return `${value.slice(0, Math.max(0, max - 1)).trim()}…`;
};

const itemName = (id) => items.find((item) => item.id === id)?.name || id;
const formatItemCount = ({ id, count }) =>
    `${itemName(id)} x${Number.isInteger(count) ? count : Number(count).toFixed(2)}`;
const formatItemList = (list = []) =>
    Array.isArray(list) && list.length ? list.map(formatItemCount).join(', ') : '';

const questData = () =>
    questManifest.map((quest) => ({ ...quest, title: quest.title || quest.id }));

const textForEntity = (entity, type) => {
    if (type === 'item')
        return [entity.id, entity.name, entity.description, entity.category].join(' ');
    if (type === 'process')
        return [
            entity.id,
            entity.title,
            formatItemList(entity.requireItems),
            formatItemList(entity.consumeItems),
            formatItemList(entity.createItems),
            entity.duration,
        ].join(' ');
    if (type === 'quest')
        return [
            entity.id,
            entity.title,
            entity.slug,
            entity.tree,
            entity.description,
            ...(entity.requiresQuests || []),
        ].join(' ');
    return [entity.id, entity.title, entity.description, entity.progress?.displayValue].join(' ');
};

const scoreEntity = (entity, type, queryTokens, queryNorm, extraBoost = 0) => {
    if (!queryNorm) return 0;
    const haystack = normalizeGameDataText(textForEntity(entity, type));
    let score = extraBoost;
    for (const token of queryTokens) {
        if (haystack.split(' ').includes(token)) score += 4;
        else if (haystack.includes(token)) score += 1;
    }
    const name = normalizeGameDataText(entity.name || entity.title || entity.id);
    if (name && queryNorm.includes(name)) score += 18;
    if (name && name.split(' ').every((token) => queryNorm.includes(token))) score += 8;
    if (queryNorm.includes(normalizeGameDataText(entity.id))) score += 20;
    return score;
};

const selectScored = (entities, type, queryTokens, queryNorm, max, boostIds = new Set()) =>
    entities
        .map((entity) => ({
            entity,
            score: scoreEntity(
                entity,
                type,
                queryTokens,
                queryNorm,
                boostIds.has(entity.id) ? 12 : 0
            ),
        }))
        .filter((entry) => entry.score > 0)
        .sort(
            (a, b) =>
                b.score - a.score ||
                String(a.entity.title || a.entity.name || a.entity.id).localeCompare(
                    String(b.entity.title || b.entity.name || b.entity.id)
                )
        )
        .slice(0, max)
        .map((entry) => entry.entity);

const recentContext = (messages = []) =>
    (Array.isArray(messages) ? messages : [])
        .filter((message) => ['user', 'assistant'].includes(message?.role) && message.content)
        .slice(-4)
        .map((message) => message.content)
        .join(' ')
        .slice(0, 1200);

const GAME_QUERY_PATTERN =
    /\b(pla|filament|rocket|benchy|3d|print|printer|quest|quests|process|consume|consumes|create|creates|reward|rewards|inventory|item|items|achievement|progress|preflight|calibration|dspace|dwatt|dusd)\b/i;

const getInventoryEntries = (gameState = {}) =>
    Object.entries(gameState.inventory || {})
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([id, count]) => ({ id, count, name: itemName(id) }));

const renderProcess = (process, max) =>
    truncate(
        `${process.title} [${process.id}]${process.duration ? ` duration ${process.duration}` : ''}${formatItemList(process.requireItems) ? `; requires ${formatItemList(process.requireItems)}` : ''}${formatItemList(process.consumeItems) ? `; consumes ${formatItemList(process.consumeItems)}` : ''}${formatItemList(process.createItems) ? `; creates ${formatItemList(process.createItems)}` : ''}`,
        max
    );
const renderQuest = (quest, max) =>
    truncate(
        `${quest.title} [${quest.id}]${quest.route ? ` route ${quest.route}` : ''}${quest.description ? `; ${quest.description}` : ''}${(quest.requiresQuests || []).length ? `; requires quests ${(quest.requiresQuests || []).join(', ')}` : ''}`,
        max
    );
const renderItem = (item, max) =>
    truncate(
        `${item.name} [${item.id}]${item.category ? ` (${item.category})` : ''}${item.description ? `; ${item.description}` : ''}`,
        max
    );
const renderAchievement = (achievement, max) =>
    truncate(
        `${achievement.title} [${achievement.id}]${achievement.description ? `; ${achievement.description}` : ''}${achievement.progress?.displayValue ? `; progress ${achievement.progress.displayValue}` : ''}`,
        max
    );

export function buildFocusedGameDataContext({
    query = '',
    messages = [],
    gameState = {},
    playerStateSummary = null,
    options = {},
} = {}) {
    const caps = { ...FOCUSED_GAME_DATA_DEFAULTS, ...(options || {}) };
    const combinedQuery = `${query || ''} ${recentContext(messages)}`.trim();
    const queryNorm = normalizeGameDataText(combinedQuery);
    const queryTokens = tokensFor(combinedQuery);
    const reasonCodes = [];
    if (!queryNorm || queryTokens.length === 0) reasonCodes.push('no-focused-query');
    if (!GAME_QUERY_PATTERN.test(combinedQuery)) {
        return {
            block: '',
            sources: [],
            meta: {
                included: false,
                selectedItemCount: 0,
                selectedQuestCount: 0,
                selectedProcessCount: 0,
                selectedAchievementCount: 0,
                selectedItemIds: [],
                selectedQuestIds: [],
                selectedProcessIds: [],
                selectedAchievementIds: [],
                renderedChars: 0,
                budget: caps,
                reasonCodes: ['not-game-data-query'],
                truncated: { total: false, sources: false },
            },
        };
    }

    const inventoryEntries = getInventoryEntries(gameState);
    const inventoryMatches = selectScored(
        inventoryEntries,
        'item',
        queryTokens,
        queryNorm,
        caps.maxItems
    ).map(
        (entry) =>
            `${entry.name} [${entry.id}] owned x${Number.isInteger(entry.count) ? entry.count : entry.count.toFixed(2)}`
    );

    const boostItemIds = new Set(
        inventoryMatches.map((line) => line.match(/\[([^\]]+)\]/)?.[1]).filter(Boolean)
    );
    const selectedItems = selectScored(
        items,
        'item',
        queryTokens,
        queryNorm,
        caps.maxItems,
        boostItemIds
    );
    const selectedProcesses = selectScored(
        processes,
        'process',
        queryTokens,
        queryNorm,
        caps.maxProcesses
    );
    const selectedQuests = selectScored(
        questData(),
        'quest',
        queryTokens,
        queryNorm,
        caps.maxQuests
    );
    const achievements = evaluateAchievements(gameState) || [];
    const selectedAchievements = selectScored(
        achievements,
        'achievement',
        queryTokens,
        queryNorm,
        caps.maxAchievements
    );

    if (inventoryMatches.length) reasonCodes.push('matched-owned-inventory');
    if (selectedItems.length) reasonCodes.push('matched-items');
    if (selectedProcesses.length) reasonCodes.push('matched-processes');
    if (selectedQuests.length) reasonCodes.push('matched-quests');
    if (selectedAchievements.length) reasonCodes.push('matched-achievements');
    if (
        /\b(consume|consumes|reward|rewards|it|that|this)\b/i.test(query || '') &&
        !selectedProcesses.length &&
        !selectedQuests.length
    )
        reasonCodes.push('clarify-ambiguous-entity');

    const sections = [];
    if (inventoryMatches.length)
        sections.push(`Relevant inventory: ${inventoryMatches.join('; ')}`);
    if (selectedItems.length)
        sections.push(
            `Relevant items: ${selectedItems.map((item) => renderItem(item, caps.maxEntityChars)).join(' | ')}`
        );
    if (selectedQuests.length)
        sections.push(
            `Relevant quests: ${selectedQuests.map((quest) => renderQuest(quest, caps.maxEntityChars)).join(' | ')}`
        );
    if (selectedProcesses.length)
        sections.push(
            `Relevant processes: ${selectedProcesses.map((process) => renderProcess(process, caps.maxEntityChars)).join(' | ')}`
        );
    if (selectedAchievements.length)
        sections.push(
            `Relevant achievements: ${selectedAchievements.map((achievement) => renderAchievement(achievement, caps.maxEntityChars)).join(' | ')}`
        );
    const remaining = playerStateSummary?.slices?.remainingQuests?.slice?.(0, 4) || [];
    if (/\b(quest|left|remaining|next)\b/i.test(query || '') && remaining.length)
        sections.push(
            `Relevant player progress: remaining quest hints ${remaining.map((q) => q.title || q.id).join('; ')}`
        );
    if (reasonCodes.includes('clarify-ambiguous-entity'))
        sections.push(
            'Relevant player progress: no unambiguous process or quest was identified; ask which one the player means instead of assuming.'
        );

    let block = sections.join('\n');
    const truncatedTotal = block.length > caps.maxTotalChars;
    if (truncatedTotal) block = truncate(block, caps.maxTotalChars);

    const sources = mergeSources(
        selectedItems.map((item) => ({
            type: 'item',
            id: item.id,
            label: item.name,
            url: `/inventory/item/${item.id}`,
            detail: truncate(item.description, 120),
        })),
        selectedQuests.map((quest) => ({
            type: 'quest',
            id: quest.id,
            label: quest.title,
            url: quest.route || `/quests/${quest.id}`,
            detail: truncate(quest.description, 120),
        })),
        selectedProcesses.map((process) => ({
            type: 'process',
            id: process.id,
            label: process.title,
            url: `/processes/${process.id}`,
        })),
        selectedAchievements.map((achievement) => ({
            type: 'achievement',
            id: achievement.id,
            label: achievement.title,
        }))
    ).slice(0, caps.maxSources);

    return {
        block,
        sources,
        meta: {
            included: Boolean(block),
            selectedItemCount: selectedItems.length,
            selectedQuestCount: selectedQuests.length,
            selectedProcessCount: selectedProcesses.length,
            selectedAchievementCount: selectedAchievements.length,
            selectedItemIds: selectedItems.map((item) => item.id),
            selectedQuestIds: selectedQuests.map((quest) => quest.id),
            selectedProcessIds: selectedProcesses.map((process) => process.id),
            selectedAchievementIds: selectedAchievements.map((achievement) => achievement.id),
            renderedChars: block.length,
            budget: caps,
            reasonCodes: reasonCodes.length ? reasonCodes : ['no-focused-matches'],
            truncated: { total: truncatedTotal, sources: sources.length >= caps.maxSources },
        },
    };
}
