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
    maxCharsPerEntity: 650,
    maxSources: 18,
    recentMessageChars: 500,
});

const STOP_WORDS = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'for',
    'to',
    'of',
    'in',
    'on',
    'with',
    'what',
    'does',
    'do',
    'did',
    'is',
    'it',
    'this',
    'that',
    'my',
    'have',
    'has',
    'had',
    'enough',
    'give',
    'gives',
    'left',
    'like',
    'make',
    'about',
    'consume',
    'consumes',
    'reward',
    'rewards',
    'quest',
    'quests',
    'process',
    'processes',
    'inventory',
    'i',
    'id',
    'me',
    'please',
    'would',
    'could',
    'should',
    'there',
]);

const ENTITY_HINTS =
    /\b(pla|filament|benchy|rocket|print|printed|printer|preflight|check|consume|consumes|create|creates|reward|rewards|quest|quests|process|processes|inventory|item|items|enough)\b/i;
const VAGUE_FOLLOWUP = /\b(it|that|this|those|them|same|previous|above)\b/i;

function questModules() {
    if (typeof import.meta === 'undefined' || typeof import.meta.glob !== 'function') return [];
    return Object.values(import.meta.glob('../pages/quests/json/**/*.json', { eager: true }))
        .map((mod) => (mod?.default ? mod.default : mod))
        .filter((quest) => quest && typeof quest.id === 'string');
}

const questModuleEntries = questModules();
const quests = (questModuleEntries.length > 0 ? questModuleEntries : questManifest).map(
    (quest) => ({
        ...quest,
        title: quest.title || quest.id,
        route: quest.route || `/quests/${quest.id}`,
    })
);

const itemById = new Map(items.map((item) => [item.id, item]));
const processById = new Map(processes.map((process) => [process.id, process]));
const questById = new Map(quests.map((quest) => [quest.id, quest]));

export function normalizeGameDataText(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[/_-]+/g, ' ')
        .replace(/[^a-z0-9.\s]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokensFor(text) {
    return normalizeGameDataText(text)
        .split(' ')
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function compact(value, max = 220) {
    const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function itemName(id) {
    return itemById.get(id)?.name || id;
}

function formatItemList(entries = []) {
    if (!Array.isArray(entries) || entries.length === 0) return '';
    return entries.map((entry) => `${itemName(entry.id)} x${entry.count ?? 1}`).join(', ');
}

function entityText(entity, type) {
    if (type === 'item') {
        return [
            entity.id,
            entity.name,
            entity.slug,
            entity.description,
            entity.category,
            entity.unit,
            entity.price,
        ].join(' ');
    }
    if (type === 'process') {
        return [
            entity.id,
            entity.title,
            entity.description,
            entity.duration,
            formatItemList(entity.requireItems),
            formatItemList(entity.consumeItems),
            formatItemList(entity.createItems),
        ].join(' ');
    }
    if (type === 'quest') {
        return [
            entity.id,
            entity.title,
            entity.slug,
            entity.description,
            ...(entity.requiresQuests || []),
            ...(entity.rewards || []),
            ...(entity.rewardItems || []).map((entry) => `${entry.id} ${entry.name || ''}`),
            JSON.stringify(entity.nodes || []).slice(0, 1200),
        ].join(' ');
    }
    return [entity.id, entity.title, entity.description, entity.progress?.displayValue].join(' ');
}

function scoreEntity(entity, type, tokens, phrase) {
    const text = normalizeGameDataText(entityText(entity, type));
    if (!text) return 0;
    let score = 0;
    const name = normalizeGameDataText(entity.name || entity.title || entity.id);
    if (phrase && name && phrase.includes(name)) score += 25;
    if (phrase && name && name.includes(phrase)) score += 18;
    if (phrase && text.includes(phrase)) score += 12;
    for (const token of tokens) {
        if (name.split(' ').includes(token)) score += 6;
        else if (entity.id && normalizeGameDataText(entity.id).split(' ').includes(token))
            score += 5;
        else if (text.includes(token)) score += 1;
    }
    return score;
}

function recentContext(messages = [], options = {}) {
    const maxChars = options.recentMessageChars || FOCUSED_GAME_DATA_DEFAULTS.recentMessageChars;
    return (Array.isArray(messages) ? messages : [])
        .slice(-4, -1)
        .map((message) => message?.content || '')
        .join(' ')
        .slice(-maxChars);
}

function selectRanked(collection, type, queryText, caps) {
    const phrase = normalizeGameDataText(queryText);
    const tokens = tokensFor(queryText);
    if (tokens.length === 0) return [];
    return collection
        .map((entity) => ({ entity, score: scoreEntity(entity, type, tokens, phrase) }))
        .filter(({ score }) => score > 0)
        .sort(
            (a, b) =>
                b.score - a.score ||
                String(a.entity.title || a.entity.name || a.entity.id).localeCompare(
                    String(b.entity.title || b.entity.name || b.entity.id)
                )
        )
        .slice(0, caps)
        .map(({ entity, score }) => ({ ...entity, __score: score }));
}

function addProcessItems(selectedItems, selectedProcesses) {
    for (const process of selectedProcesses) {
        for (const entry of [
            ...(process.requireItems || []),
            ...(process.consumeItems || []),
            ...(process.createItems || []),
        ]) {
            const item = itemById.get(entry.id);
            if (item && !selectedItems.some((candidate) => candidate.id === item.id))
                selectedItems.push(item);
        }
    }
}

function selectInventory(gameState, selectedItems, queryText, cap = 8) {
    const inventory =
        gameState?.inventory && typeof gameState.inventory === 'object' ? gameState.inventory : {};
    const queryTokens = new Set(tokensFor(queryText));
    return Object.entries(inventory)
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([id, count]) => {
            const item = itemById.get(id);
            const selected = selectedItems.some((entry) => entry.id === id);
            const itemTokens = tokensFor(
                [id, item?.name, item?.description, item?.category].join(' ')
            );
            const tokenHit = itemTokens.some((token) => queryTokens.has(token));
            return { id, name: item?.name || id, count, score: selected ? 10 : tokenHit ? 5 : 0 };
        })
        .filter((entry) => entry.score > 0 || /\binventory\b/i.test(queryText))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, cap);
}

function remainingQuestIds(playerStateSummary) {
    const slices = playerStateSummary?.slices || {};
    return (slices.remainingOfficialQuests || slices.remainingQuests || [])
        .map((entry) => (typeof entry === 'string' ? entry : entry.id))
        .filter(Boolean);
}

function renderEntity(line, maxCharsPerEntity = FOCUSED_GAME_DATA_DEFAULTS.maxCharsPerEntity) {
    return compact(line, maxCharsPerEntity);
}

function buildSources(
    { inventoryEntries, selectedItems, selectedQuests, selectedProcesses, selectedAchievements },
    maxSources
) {
    const sources = [];
    if (inventoryEntries.length > 0) {
        sources.push({
            type: 'state',
            id: 'focused-inventory',
            label: 'Relevant inventory',
            detail: `${inventoryEntries.length} selected owned entries`,
        });
    }
    sources.push(
        ...selectedItems.map((item) => ({
            type: 'item',
            id: item.id,
            label: item.name,
            url: `/inventory/item/${item.id}`,
            detail: compact(item.description || '', 120),
        }))
    );
    sources.push(
        ...selectedQuests.map((quest) => ({
            type: 'quest',
            id: quest.id,
            label: quest.title || quest.id,
            url: `/quests/${quest.id}`,
            detail: compact(quest.description || '', 120),
        }))
    );
    sources.push(
        ...selectedProcesses.map((process) => ({
            type: 'process',
            id: process.id,
            label: process.title || process.id,
            url: `/processes/${process.id}`,
        }))
    );
    sources.push(
        ...selectedAchievements.map((achievement) => ({
            type: 'achievement',
            id: achievement.id,
            label: achievement.title || achievement.id,
            detail: achievement.progress?.displayValue || '',
        }))
    );
    return mergeSources(sources).slice(0, maxSources);
}

export function buildFocusedGameDataContext({
    query = '',
    messages = [],
    gameState = {},
    playerStateSummary = null,
    options = {},
} = {}) {
    const config = { ...FOCUSED_GAME_DATA_DEFAULTS, ...(options || {}) };
    const recent = recentContext(messages, config);
    const hasVagueFollowup = VAGUE_FOLLOWUP.test(query) || /^\s*what\s+(does|about)\b/i.test(query);
    const retrievalText = hasVagueFollowup ? `${query} ${recent}` : query;
    const reasonCodes = [];

    if (!ENTITY_HINTS.test(retrievalText) && !/\b(inventory|progress|left)\b/i.test(query)) {
        return {
            block: '',
            sources: [],
            meta: {
                included: false,
                reasonCodes: ['no-game-data-intent'],
                renderedChars: 0,
                budgets: config,
                selectedIds: { items: [], quests: [], processes: [], achievements: [] },
                counts: { items: 0, quests: 0, processes: 0, achievements: 0, inventory: 0 },
                truncated: false,
            },
        };
    }

    if (hasVagueFollowup) reasonCodes.push('recent-context-followup');
    else reasonCodes.push('latest-query');

    let selectedItems = selectRanked(items, 'item', retrievalText, config.maxItems);
    const shouldSearchProcesses =
        /\b(process|processes|consume|consumes|create|creates|duration|make|print|printed|benchy|rocket|calibration|pla)\b/i.test(
            retrievalText
        ) && !/^\s*do\s+i\s+have\s+enough\s+[^?]+\??\s*$/i.test(query);
    let selectedProcesses = shouldSearchProcesses
        ? selectRanked(processes, 'process', retrievalText, config.maxProcesses)
        : [];
    let selectedQuests = selectRanked(quests, 'quest', retrievalText, config.maxQuests);

    if (/benchy|benchies/i.test(retrievalText)) {
        const benchy = processById.get('3dprint-benchy') || processById.get('print-benchy');
        if (benchy && !selectedProcesses.some((process) => process.id === benchy.id)) {
            selectedProcesses = [benchy, ...selectedProcesses].slice(0, config.maxProcesses);
            reasonCodes.push('benchy-alias');
        }
    }

    if (/\bleft\b|remaining|quest/i.test(query)) {
        const remaining = remainingQuestIds(playerStateSummary)
            .map((id) => questById.get(id))
            .filter(Boolean)
            .slice(0, config.maxQuests);
        if (remaining.length > 0) {
            selectedQuests = [
                ...remaining,
                ...selectedQuests.filter(
                    (quest) => !remaining.some((entry) => entry.id === quest.id)
                ),
            ].slice(0, config.maxQuests);
            reasonCodes.push('remaining-quests');
        }
    }

    addProcessItems(selectedItems, selectedProcesses);
    selectedItems = selectedItems.slice(0, config.maxItems);

    const achievements = evaluateAchievements(gameState || {});
    const selectedAchievements = selectRanked(
        Array.isArray(achievements) ? achievements : [],
        'achievement',
        retrievalText,
        config.maxAchievements
    );
    const inventoryEntries = selectInventory(
        gameState,
        selectedItems,
        retrievalText,
        config.maxItems
    );

    const sections = [];
    if (inventoryEntries.length > 0)
        sections.push(
            `Relevant inventory: ${inventoryEntries.map((entry) => `${entry.name} (x${Number.isInteger(entry.count) ? entry.count : entry.count.toFixed(2)})`).join('; ')}. Omitted inventory entries are omitted, not absent.`
        );
    if (selectedItems.length > 0)
        sections.push(
            `Relevant items: ${selectedItems.map((item) => renderEntity(`${item.name} [${item.id}]${item.category ? ` (${item.category})` : ''}: ${item.description || 'No description.'}`, config.maxCharsPerEntity)).join(' | ')}`
        );
    if (selectedQuests.length > 0)
        sections.push(
            `Relevant quests: ${selectedQuests.map((quest) => renderEntity(`${quest.title || quest.id} [${quest.id}]: ${quest.description || 'No description.'}${(quest.requiresQuests || []).length ? ` Prereqs: ${(quest.requiresQuests || []).join(', ')}.` : ''}${(quest.rewards || []).length ? ` Rewards: ${(quest.rewards || []).join(', ')}.` : ''}${(quest.rewardItems || []).length ? ` Reward items: ${(quest.rewardItems || []).map((entry) => `${itemName(entry.id)} x${entry.count ?? 1}`).join(', ')}.` : ''}`, config.maxCharsPerEntity)).join(' | ')}`
        );
    if (selectedProcesses.length > 0)
        sections.push(
            `Relevant processes: ${selectedProcesses.map((process) => renderEntity(`${process.title || process.id} [${process.id}]${process.duration ? ` duration ${process.duration}` : ''}. Requires: ${formatItemList(process.requireItems) || 'none'}. Consumes: ${formatItemList(process.consumeItems) || 'none'}. Creates: ${formatItemList(process.createItems) || 'none'}.`, config.maxCharsPerEntity)).join(' | ')}`
        );
    if (selectedAchievements.length > 0)
        sections.push(
            `Relevant achievements: ${selectedAchievements.map((achievement) => renderEntity(`${achievement.title || achievement.id} [${achievement.id}]${achievement.unlocked ? ' unlocked' : ''}${achievement.progress?.displayValue ? ` progress ${achievement.progress.displayValue}` : ''}`, config.maxCharsPerEntity)).join(' | ')}`
        );
    if (
        hasVagueFollowup &&
        selectedProcesses.length === 0 &&
        selectedQuests.length === 0 &&
        selectedItems.length === 0
    )
        sections.push(
            'Relevant player progress: No unambiguous prior item, quest, or process was identified; ask a clarifying question instead of assuming.'
        );

    let block = sections.join('\n');
    const truncated = block.length > config.maxTotalChars;
    if (truncated) block = `${block.slice(0, config.maxTotalChars - 1).trim()}…`;

    const selectedIds = {
        items: selectedItems.map((entry) => entry.id),
        quests: selectedQuests.map((entry) => entry.id),
        processes: selectedProcesses.map((entry) => entry.id),
        achievements: selectedAchievements.map((entry) => entry.id),
    };
    const counts = {
        items: selectedItems.length,
        quests: selectedQuests.length,
        processes: selectedProcesses.length,
        achievements: selectedAchievements.length,
        inventory: inventoryEntries.length,
    };

    return {
        block,
        sources: block
            ? buildSources(
                  {
                      inventoryEntries,
                      selectedItems,
                      selectedQuests,
                      selectedProcesses,
                      selectedAchievements,
                  },
                  config.maxSources
              )
            : [],
        meta: {
            included: Boolean(block),
            reasonCodes,
            renderedChars: block.length,
            budgets: config,
            selectedIds,
            counts,
            truncated,
        },
    };
}
