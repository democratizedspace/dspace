import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };

const MAX_ITEMS = 25;
const MAX_PROCESSES = 20;
const MAX_QUESTS = 25;
const MAX_DESCRIPTION_LENGTH = 180;

function truncate(text, maxLength = MAX_DESCRIPTION_LENGTH) {
    if (typeof text !== 'string') {
        return '';
    }
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength - 1).trim()}…`;
}

function getQuestData() {
    if (typeof import.meta === 'undefined' || typeof import.meta.glob !== 'function') {
        return [];
    }

    const modules = import.meta.glob('../pages/quests/json/**/*.json', { eager: true });

    return Object.values(modules)
        .map((mod) => (mod?.default ? mod.default : mod))
        .filter((quest) => quest && typeof quest.id === 'string')
        .map((quest) => ({
            id: quest.id,
            title: quest.title || quest.id,
            description: truncate(quest.description || ''),
            requiresQuests: Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [],
            rewards:
                Array.isArray(quest.rewards) && quest.rewards.length > 0
                    ? quest.rewards
                    : Array.isArray(quest.rewardItems)
                    ? quest.rewardItems.map((item) => item.id)
                    : [],
        }))
        .sort((a, b) => a.title.localeCompare(b.title));
}

const quests = getQuestData();

function formatInventory(inventory = {}) {
    if (!inventory || typeof inventory !== 'object') {
        return [];
    }

    return Object.entries(inventory)
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([id, count]) => {
            const item = items.find((entry) => entry.id === id);
            const name = item ? item.name : id;
            return `${name} (x${Number.isInteger(count) ? count : count.toFixed(2)})`;
        })
        .sort();
}

function summarizeItems() {
    return items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_ITEMS)
        .map((item) => `${item.name}: ${truncate(item.description || '')}`);
}

function summarizeProcesses() {
    return processes
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, MAX_PROCESSES)
        .map((process) => {
            const duration = process.duration ? ` (duration ${process.duration})` : '';
            return `${process.title}${duration}`;
        });
}

function summarizeQuests() {
    return quests.slice(0, MAX_QUESTS).map((quest) => {
        const parts = [`${quest.title} [${quest.id}]`];
        if (quest.description) {
            parts.push(quest.description);
        }
        if (quest.requiresQuests.length > 0) {
            parts.push(`Prereqs: ${quest.requiresQuests.join(', ')}`);
        }
        if (quest.rewards.length > 0) {
            parts.push(`Rewards: ${quest.rewards.join(', ')}`);
        }
        return parts.join(' — ');
    });
}

export function buildDchatKnowledge(gameState = {}) {
    const knowledgeSections = [];

    const inventorySummary = formatInventory(gameState.inventory);
    if (inventorySummary.length > 0) {
        knowledgeSections.push(`Inventory highlights: ${inventorySummary.join('; ')}`);
    }

    const itemSummary = summarizeItems();
    if (itemSummary.length > 0) {
        knowledgeSections.push(`Items: ${itemSummary.join(' | ')}`);
    }

    const questSummary = summarizeQuests();
    if (questSummary.length > 0) {
        knowledgeSections.push(`Quests: ${questSummary.join(' || ')}`);
    }

    const processSummary = summarizeProcesses();
    if (processSummary.length > 0) {
        knowledgeSections.push(`Processes: ${processSummary.join(' | ')}`);
    }

    return knowledgeSections.join('\n\n');
}

export function __testables() {
    return {
        truncate,
        formatInventory,
        summarizeItems,
        summarizeProcesses,
        summarizeQuests,
    };
}
