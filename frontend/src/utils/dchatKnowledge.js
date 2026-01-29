import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { evaluateAchievements } from './achievements.js';

const MAX_ITEMS = 25;
const MAX_PROCESSES = 20;
const MAX_QUESTS = 25;
const MAX_QUEST_STATUS_ENTRIES = 12;
const MAX_PROCESS_STATUS_ENTRIES = 8;
const MAX_ACHIEVEMENT_ENTRIES = 6;
const MAX_INVENTORY_SOURCES = 20;
const PRIORITY_QUEST_IDS = [
    'welcome/howtodoquests',
    'welcome/intro-inventory',
    'welcome/run-tests',
    'welcome/smart-plug-test',
    'welcome/connect-github',
];
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

function prioritizeQuests(allQuests) {
    if (!Array.isArray(allQuests) || allQuests.length === 0) {
        return [];
    }

    const questMap = new Map(allQuests.map((quest) => [quest.id, quest]));
    const prioritized = [];

    for (const questId of PRIORITY_QUEST_IDS) {
        if (!questMap.has(questId)) {
            continue;
        }
        prioritized.push(questMap.get(questId));
        questMap.delete(questId);
    }

    const remaining = Array.from(questMap.values()).sort((a, b) => a.title.localeCompare(b.title));

    return prioritized.concat(remaining);
}

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

function getInventoryItemIds(inventory = {}) {
    if (!inventory || typeof inventory !== 'object') {
        return [];
    }

    return Object.entries(inventory)
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([id]) => id)
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

function summarizeAchievements(gameState = {}) {
    return getAchievementSummaryData(gameState).sections;
}

function getAchievementSummaryData(gameState = {}) {
    const achievements = evaluateAchievements(gameState);

    if (!Array.isArray(achievements) || achievements.length === 0) {
        return { sections: [], sources: [], hasProgress: false };
    }

    const unlocked = achievements.filter((achievement) => achievement.unlocked);
    const inProgress = achievements.filter(
        (achievement) => !achievement.unlocked && achievement.progress?.percent > 0
    );

    const formatEntry = (achievement) => {
        const display = achievement.progress?.displayValue;
        return display ? `${achievement.title} (${display})` : achievement.title;
    };

    const unlockedEntries = unlocked
        .slice(0, MAX_ACHIEVEMENT_ENTRIES)
        .map((achievement) => achievement.title);
    const remainingSlots = Math.max(0, MAX_ACHIEVEMENT_ENTRIES - unlockedEntries.length);
    const progressEntries = inProgress.slice(0, remainingSlots).map(formatEntry);

    const sections = [];

    if (unlockedEntries.length > 0) {
        sections.push(`Unlocked: ${unlockedEntries.join(', ')}`);
    }

    if (progressEntries.length > 0) {
        sections.push(`In progress: ${progressEntries.join(', ')}`);
    }

    if (sections.length === 0) {
        sections.push('No achievements unlocked yet.');
    }

    const sources = unlocked
        .slice(0, MAX_ACHIEVEMENT_ENTRIES)
        .map((achievement) => ({
            type: 'achievement',
            id: achievement.id,
            label: achievement.title,
        }))
        .concat(
            inProgress
                .slice(0, remainingSlots)
                .map((achievement) => ({
                    type: 'achievement',
                    id: achievement.id,
                    label: achievement.title,
                    detail: achievement.progress?.displayValue,
                }))
        );

    return {
        sections,
        sources,
        hasProgress: unlocked.length > 0 || inProgress.length > 0,
    };
}

function summarizeQuests() {
    return prioritizeQuests(quests)
        .slice(0, MAX_QUESTS)
        .map((quest) => {
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

function describeQuestProgress(questId, questState) {
    const quest = quests.find((entry) => entry.id === questId);
    const title = quest?.title || questId;
    if (questState?.finished) {
        return `${title}: finished`;
    }
    if (typeof questState?.stepId === 'number') {
        const stepNumber = questState.stepId + 1;
        return `${title}: step ${stepNumber} in progress`;
    }
    return `${title}: in progress`;
}

function summarizeQuestProgress(gameState = {}) {
    if (!gameState || typeof gameState !== 'object' || !gameState.quests) {
        return [];
    }

    return Object.entries(gameState.quests)
        .slice(0, MAX_QUEST_STATUS_ENTRIES)
        .map(([questId, questState]) => describeQuestProgress(questId, questState))
        .sort((a, b) => a.localeCompare(b));
}

function describeProcessProgress(processId, processState = {}) {
    const process = processes.find((entry) => entry.id === processId);
    const title = process?.title || processId;
    const { startedAt, duration, pausedAt, elapsedBeforePause } = processState;
    if (!startedAt || !duration) {
        return `${title}: not started`;
    }

    let elapsed = elapsedBeforePause || 0;
    if (pausedAt) {
        elapsed += pausedAt - startedAt;
    } else {
        elapsed += Date.now() - startedAt;
    }

    const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
    if (progress >= 100) {
        return `${title}: finished (100%)`;
    }
    if (pausedAt) {
        return `${title}: paused (${progress}%)`;
    }
    return `${title}: in progress (${progress}%)`;
}

function summarizeProcessProgress(gameState = {}) {
    if (!gameState || typeof gameState !== 'object' || !gameState.processes) {
        return [];
    }

    return Object.entries(gameState.processes)
        .filter(([, processState]) => processState !== undefined)
        .slice(0, MAX_PROCESS_STATUS_ENTRIES)
        .map(([processId, processState]) => describeProcessProgress(processId, processState))
        .sort((a, b) => a.localeCompare(b));
}

function buildQuestUrl(questId) {
    if (typeof questId !== 'string') {
        return undefined;
    }

    const [pathId, ...rest] = questId.split('/');
    if (!pathId || rest.length === 0) {
        return undefined;
    }

    return `/quests/${pathId}/${rest.join('/')}`;
}

function sortSources(sources) {
    return sources.sort((a, b) => {
        const typeCompare = a.type.localeCompare(b.type);
        if (typeCompare !== 0) {
            return typeCompare;
        }
        const labelCompare = (a.label || '').localeCompare(b.label || '');
        if (labelCompare !== 0) {
            return labelCompare;
        }
        return (a.id || '').localeCompare(b.id || '');
    });
}

export function buildDchatKnowledgePack(gameState = {}) {
    const knowledgeSections = [];
    const sources = [];

    const inventorySummary = formatInventory(gameState.inventory);
    if (inventorySummary.length > 0) {
        knowledgeSections.push(`Inventory highlights: ${inventorySummary.join('; ')}`);
    }

    const inventoryItemIds = getInventoryItemIds(gameState.inventory);
    if (inventoryItemIds.length > 0) {
        if (inventoryItemIds.length > MAX_INVENTORY_SOURCES) {
            sources.push({
                type: 'item',
                id: 'inventory-highlights',
                label: 'Inventory highlights',
                detail: inventoryItemIds.slice(0, MAX_INVENTORY_SOURCES).join(', '),
            });
        } else {
            inventoryItemIds.forEach((itemId) => {
                const item = items.find((entry) => entry.id === itemId);
                sources.push({
                    type: 'item',
                    id: itemId,
                    label: item?.name || itemId,
                    url: `/inventory/item/${itemId}`,
                });
            });
        }
    }

    const itemEntries = items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_ITEMS);
    if (itemEntries.length > 0) {
        const itemSummary = itemEntries.map(
            (item) => `${item.name}: ${truncate(item.description || '')}`
        );
        knowledgeSections.push(
            `Items: ${itemSummary.join(' | ')}`
        );
        itemEntries.forEach((item) => {
            sources.push({
                type: 'item',
                id: item.id,
                label: item.name,
                url: `/inventory/item/${item.id}`,
                detail: item.description ? truncate(item.description || '') : undefined,
            });
        });
    }

    const questEntries = prioritizeQuests(quests).slice(0, MAX_QUESTS);
    if (questEntries.length > 0) {
        knowledgeSections.push(
            `Quests: ${questEntries
                .map((quest) => {
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
                })
                .join(' || ')}`
        );
        questEntries.forEach((quest) => {
            sources.push({
                type: 'quest',
                id: quest.id,
                label: quest.title,
                url: buildQuestUrl(quest.id),
                detail: quest.description || undefined,
            });
        });
    }

    const questProgressSummary = summarizeQuestProgress(gameState);
    if (questProgressSummary.length > 0) {
        knowledgeSections.push(`Quest progress: ${questProgressSummary.join(' | ')}`);
    }

    const achievementData = getAchievementSummaryData(gameState);
    if (achievementData.sections.length > 0) {
        knowledgeSections.push(`Achievements: ${achievementData.sections.join(' | ')}`);
    }
    if (achievementData.sources.length > 0) {
        sources.push(...achievementData.sources);
    }

    const processEntries = processes
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, MAX_PROCESSES);
    if (processEntries.length > 0) {
        knowledgeSections.push(
            `Processes: ${processEntries
                .map((process) => {
                    const duration = process.duration ? ` (duration ${process.duration})` : '';
                    return `${process.title}${duration}`;
                })
                .join(' | ')}`
        );
        processEntries.forEach((process) => {
            sources.push({
                type: 'process',
                id: process.id,
                label: process.title,
                url: `/processes/${process.id}`,
            });
        });
    }

    const processProgressSummary = summarizeProcessProgress(gameState);
    if (processProgressSummary.length > 0) {
        knowledgeSections.push(`Processes in flight: ${processProgressSummary.join(' | ')}`);
    }

    const hasStateSnapshot =
        (gameState.inventory && Object.keys(gameState.inventory).length > 0) ||
        (gameState.quests && Object.keys(gameState.quests).length > 0) ||
        (gameState.processes && Object.keys(gameState.processes).length > 0);
    const usesState =
        inventorySummary.length > 0 ||
        questProgressSummary.length > 0 ||
        processProgressSummary.length > 0 ||
        achievementData.hasProgress;

    if (hasStateSnapshot && usesState) {
        const stateDetailParts = [];
        if (inventorySummary.length > 0) {
            stateDetailParts.push('inventory');
        }
        if (questProgressSummary.length > 0) {
            stateDetailParts.push('quest progress');
        }
        if (processProgressSummary.length > 0) {
            stateDetailParts.push('process progress');
        }
        if (achievementData.hasProgress) {
            stateDetailParts.push('achievements');
        }
        sources.push({
            type: 'state',
            id: 'local-game-state',
            label: 'Local game state snapshot',
            detail: stateDetailParts.length > 0 ? stateDetailParts.join(', ') : undefined,
        });
    }

    return { summary: knowledgeSections.join('\n\n'), sources: sortSources(sources) };
}

export function buildDchatKnowledge(gameState = {}) {
    return buildDchatKnowledgePack(gameState).summary;
}

export function __testables() {
    return {
        truncate,
        formatInventory,
        getInventoryItemIds,
        summarizeItems,
        summarizeProcesses,
        summarizeQuests,
        summarizeQuestProgress,
        summarizeProcessProgress,
        prioritizeQuests,
        summarizeAchievements,
        getAchievementSummaryData,
        buildQuestUrl,
    };
}
