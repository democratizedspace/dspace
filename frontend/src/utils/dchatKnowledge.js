import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json';
import { evaluateAchievements } from './achievements.js';
import { mergeSources } from './contextSources.js';

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
export const dchatKnowledgeScaffoldingStrings = [
    'Inventory highlights',
    'Items',
    'Quests',
    'Prereqs',
    'Rewards',
    'Quest progress',
    'Achievements',
    'Unlocked',
    'In progress',
    'No achievements unlocked yet.',
    'Processes',
    'Processes in flight',
    'Local game state snapshot',
    'not started',
    'finished',
    'paused',
];
const dchatKnowledgeScaffolding = {
    inventoryHighlights: dchatKnowledgeScaffoldingStrings[0],
    items: dchatKnowledgeScaffoldingStrings[1],
    quests: dchatKnowledgeScaffoldingStrings[2],
    prereqs: dchatKnowledgeScaffoldingStrings[3],
    rewards: dchatKnowledgeScaffoldingStrings[4],
    questProgress: dchatKnowledgeScaffoldingStrings[5],
    achievements: dchatKnowledgeScaffoldingStrings[6],
    unlocked: dchatKnowledgeScaffoldingStrings[7],
    inProgress: dchatKnowledgeScaffoldingStrings[8],
    noAchievements: dchatKnowledgeScaffoldingStrings[9],
    processes: dchatKnowledgeScaffoldingStrings[10],
    processesInFlight: dchatKnowledgeScaffoldingStrings[11],
    localGameStateSnapshot: dchatKnowledgeScaffoldingStrings[12],
    notStarted: dchatKnowledgeScaffoldingStrings[13],
    finished: dchatKnowledgeScaffoldingStrings[14],
    paused: dchatKnowledgeScaffoldingStrings[15],
};

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
    return getItemsForKnowledge().map(
        (item) => `${item.name}: ${truncate(item.description || '')}`
    );
}

function summarizeProcesses() {
    return getProcessesForKnowledge().map((process) => {
        const duration = process.duration ? ` (duration ${process.duration})` : '';
        return `${process.title}${duration}`;
    });
}

function summarizeAchievements(gameState = {}) {
    const { unlockedEntries, progressEntries } = getAchievementEntries(gameState);

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
    return getQuestsForKnowledge().map((quest) => {
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

function getItemsForKnowledge() {
    return items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_ITEMS);
}

function getProcessesForKnowledge() {
    return processes
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, MAX_PROCESSES);
}

function getQuestsForKnowledge() {
    return prioritizeQuests(quests).slice(0, MAX_QUESTS);
}

function getAchievementEntries(gameState = {}) {
    const achievements = evaluateAchievements(gameState);

    if (!Array.isArray(achievements) || achievements.length === 0) {
        return { unlockedEntries: [], progressEntries: [], unlocked: [], inProgress: [] };
    }

    const unlocked = achievements.filter((achievement) => achievement.unlocked);
    const inProgress = achievements.filter(
        (achievement) => !achievement.unlocked && achievement.progress?.percent > 0
    );

    const formatEntry = (achievement) => {
        const display = achievement.progress?.displayValue;
        return display ? `${achievement.title} (${display})` : achievement.title;
    };

    const unlockedSlice = unlocked.slice(0, MAX_ACHIEVEMENT_ENTRIES);
    const remainingSlots = Math.max(0, MAX_ACHIEVEMENT_ENTRIES - unlockedSlice.length);
    const inProgressSlice = inProgress.slice(0, remainingSlots);
    const unlockedEntries = unlockedSlice.map((achievement) => achievement.title);
    const progressEntries = inProgressSlice.map(formatEntry);

    return {
        unlockedEntries,
        progressEntries,
        unlocked,
        inProgress,
        unlockedSlice,
        inProgressSlice,
    };
}

function describeQuestProgress(questId, questState) {
    const quest = quests.find((entry) => entry.id === questId);
    const title = quest?.title || questId;
    if (questState?.finished) {
        return `${title}: ${dchatKnowledgeScaffolding.finished}`;
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
        return `${title}: ${dchatKnowledgeScaffolding.notStarted}`;
    }

    let elapsed = elapsedBeforePause || 0;
    if (pausedAt) {
        elapsed += pausedAt - startedAt;
    } else {
        elapsed += Date.now() - startedAt;
    }

    const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
    if (progress >= 100) {
        return `${title}: ${dchatKnowledgeScaffolding.finished} (100%)`;
    }
    if (pausedAt) {
        return `${title}: ${dchatKnowledgeScaffolding.paused} (${progress}%)`;
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

export function buildDchatKnowledgePack(gameState = {}) {
    const knowledgeSections = [];
    const sources = [];
    const stateDetails = [];

    const inventorySummary = formatInventory(gameState.inventory);
    if (inventorySummary.length > 0) {
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.inventoryHighlights}: ${inventorySummary.join('; ')}`
        );
        stateDetails.push('inventory');
    }

    const itemEntries = getItemsForKnowledge();
    if (itemEntries.length > 0) {
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.items}: ${itemEntries
                .map((item) => `${item.name}: ${truncate(item.description || '')}`)
                .join(' | ')}`
        );
        sources.push(
            ...itemEntries.map((item) => ({
                type: 'item',
                id: item.id,
                label: item.name,
                url: `/inventory/item/${item.id}`,
                detail: truncate(item.description || ''),
            }))
        );
    }

    const questEntries = getQuestsForKnowledge();
    if (questEntries.length > 0) {
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.quests}: ${questEntries
                .map((quest) => {
                    const parts = [`${quest.title} [${quest.id}]`];
                    if (quest.description) {
                        parts.push(quest.description);
                    }
                    if (quest.requiresQuests.length > 0) {
                        parts.push(
                            `${dchatKnowledgeScaffolding.prereqs}: ${quest.requiresQuests.join(
                                ', '
                            )}`
                        );
                    }
                    if (quest.rewards.length > 0) {
                        parts.push(
                            `${dchatKnowledgeScaffolding.rewards}: ${quest.rewards.join(', ')}`
                        );
                    }
                    return parts.join(' — ');
                })
                .join(' || ')}`
        );
        sources.push(
            ...questEntries.map((quest) => ({
                type: 'quest',
                id: quest.id,
                label: quest.title || quest.id,
                url: `/quests/${quest.id}`,
                detail: quest.description || '',
            }))
        );
    }

    const questProgressSummary = summarizeQuestProgress(gameState);
    if (questProgressSummary.length > 0) {
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.questProgress}: ${questProgressSummary.join(' | ')}`
        );
        stateDetails.push('quest progress');
    }

    const { unlockedEntries, progressEntries, unlockedSlice, inProgressSlice } =
        getAchievementEntries(gameState);
    if (unlockedEntries.length > 0 || progressEntries.length > 0) {
        const sections = [];
        if (unlockedEntries.length > 0) {
            sections.push(`${dchatKnowledgeScaffolding.unlocked}: ${unlockedEntries.join(', ')}`);
        }
        if (progressEntries.length > 0) {
            sections.push(`${dchatKnowledgeScaffolding.inProgress}: ${progressEntries.join(', ')}`);
        }
        if (sections.length === 0) {
            sections.push(dchatKnowledgeScaffolding.noAchievements);
        }
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.achievements}: ${sections.join(' | ')}`
        );
        stateDetails.push('achievements');
        sources.push(
            ...unlockedSlice.map((achievement) => ({
                type: 'achievement',
                id: achievement.id,
                label: achievement.title,
            })),
            ...inProgressSlice.map((achievement) => ({
                type: 'achievement',
                id: achievement.id,
                label: achievement.title,
                detail: achievement.progress?.displayValue || '',
            }))
        );
    }

    const processEntries = getProcessesForKnowledge();
    if (processEntries.length > 0) {
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.processes}: ${processEntries
                .map((process) => {
                    const duration = process.duration ? ` (duration ${process.duration})` : '';
                    return `${process.title}${duration}`;
                })
                .join(' | ')}`
        );
        sources.push(
            ...processEntries.map((process) => ({
                type: 'process',
                id: process.id,
                label: process.title,
                url: `/processes/${process.id}`,
            }))
        );
    }

    const processProgressSummary = summarizeProcessProgress(gameState);
    if (processProgressSummary.length > 0) {
        knowledgeSections.push(
            `${dchatKnowledgeScaffolding.processesInFlight}: ${processProgressSummary.join(' | ')}`
        );
        stateDetails.push('process progress');
    }

    if (stateDetails.length > 0) {
        sources.push({
            type: 'state',
            id: 'local-game-state',
            label: dchatKnowledgeScaffolding.localGameStateSnapshot,
            detail: stateDetails.join(', '),
        });
    }

    return {
        summary: knowledgeSections.join('\n\n'),
        sources: mergeSources(sources),
    };
}

export function buildDchatKnowledge(gameState = {}) {
    return buildDchatKnowledgePack(gameState).summary;
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
        getItemsForKnowledge,
        getProcessesForKnowledge,
        getQuestsForKnowledge,
        getAchievementEntries,
    };
}
