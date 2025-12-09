import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import { evaluateAchievements } from './achievements.js';

const MAX_ITEMS = 25;
const MAX_PROCESSES = 20;
const MAX_QUESTS = 25;
const MAX_QUEST_STATUS_ENTRIES = 12;
const MAX_PROCESS_STATUS_ENTRIES = 8;
const MAX_ACHIEVEMENT_ENTRIES = 6;
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
    const achievements = evaluateAchievements(gameState);

    if (!Array.isArray(achievements) || achievements.length === 0) {
        return [];
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

    return sections;
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
        .slice(0, MAX_PROCESS_STATUS_ENTRIES)
        .map(([processId, processState]) => describeProcessProgress(processId, processState))
        .sort((a, b) => a.localeCompare(b));
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

    const questProgressSummary = summarizeQuestProgress(gameState);
    if (questProgressSummary.length > 0) {
        knowledgeSections.push(`Quest progress: ${questProgressSummary.join(' | ')}`);
    }

    const achievementSummary = summarizeAchievements(gameState);
    if (achievementSummary.length > 0) {
        knowledgeSections.push(`Achievements: ${achievementSummary.join(' | ')}`);
    }

    const processSummary = summarizeProcesses();
    if (processSummary.length > 0) {
        knowledgeSections.push(`Processes: ${processSummary.join(' | ')}`);
    }

    const processProgressSummary = summarizeProcessProgress(gameState);
    if (processProgressSummary.length > 0) {
        knowledgeSections.push(`Processes in flight: ${processProgressSummary.join(' | ')}`);
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
        summarizeQuestProgress,
        summarizeProcessProgress,
        prioritizeQuests,
        summarizeAchievements,
    };
}
