import 'fake-indexeddb/auto';
import { describe, beforeEach, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, ENTITY_TYPES } from '../frontend/src/utils/customcontent.js';
import { syncExistingQuestsToIndexedDB } from '../frontend/src/utils/questPersistence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questTemplatePath = path.resolve(
    __dirname,
    '../frontend/test-data/constellations-quest.json'
);

async function clearCustomContentDatabase(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onblocked = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Failed to clear IndexedDB'));
    });
}

describe('QuestForm duplicate title protections', () => {
    beforeEach(async () => {
        await clearCustomContentDatabase();
    });

    test('seeds server-provided quests into IndexedDB', async () => {
        const quest = JSON.parse(readFileSync(questTemplatePath, 'utf8'));

        const results = await syncExistingQuestsToIndexedDB([quest]);
        expect(results.some((storedQuest) => String(storedQuest.id) === String(quest.id))).toBe(
            true
        );

        const storedQuests = await db.list(ENTITY_TYPES.QUEST);
        expect(
            storedQuests.filter((storedQuest) => String(storedQuest.id) === String(quest.id)).length
        ).toBe(1);

        const repeated = await syncExistingQuestsToIndexedDB([quest]);
        const duplicateCount = repeated.filter(
            (storedQuest) => String(storedQuest.id) === String(quest.id)
        ).length;
        expect(duplicateCount).toBe(1);
    });
});
