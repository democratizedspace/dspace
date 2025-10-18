import { db, ENTITY_TYPES } from './customcontent.js';

export function normalizeExistingQuest(quest) {
    if (!quest || quest.id == null || !quest.title) {
        return null;
    }

    return {
        ...quest,
        id: quest.id,
        custom: quest.custom ?? false,
    };
}

function isConstraintError(error) {
    const errorName = String(error?.name ?? '');
    const errorMessage = String(error?.message ?? '');
    return (
        errorName.includes('ConstraintError') ||
        errorMessage.includes('ConstraintError') ||
        errorMessage.includes('Key already exists')
    );
}

export async function syncExistingQuestsToIndexedDB(quests = []) {
    const normalizedQuests = quests
        .map((quest) => normalizeExistingQuest(quest))
        .filter(Boolean);

    if (normalizedQuests.length === 0) {
        return [];
    }

    try {
        const storedQuests = await db.list(ENTITY_TYPES.QUEST);
        const persistedIds = new Set(storedQuests.map((quest) => String(quest.id)));

        for (const quest of normalizedQuests) {
            const questId = String(quest.id);
            if (persistedIds.has(questId)) {
                continue;
            }

            try {
                await db.add(ENTITY_TYPES.QUEST, {
                    ...quest,
                    updatedAt: quest.updatedAt ?? quest.createdAt ?? new Date().toISOString(),
                });
                persistedIds.add(questId);
            } catch (error) {
                if (!isConstraintError(error)) {
                    console.warn(
                        `Failed to persist existing quest "${questId}" to IndexedDB`,
                        error
                    );
                }
            }
        }

        const updatedQuests = await db.list(ENTITY_TYPES.QUEST);
        const mergedQuests = new Map(updatedQuests.map((quest) => [String(quest.id), quest]));

        normalizedQuests.forEach((quest) => {
            const questId = String(quest.id);
            if (!mergedQuests.has(questId)) {
                mergedQuests.set(questId, quest);
            }
        });

        return Array.from(mergedQuests.values());
    } catch (error) {
        console.warn('Failed to sync server-provided quests to IndexedDB', error);
        return normalizedQuests;
    }
}
