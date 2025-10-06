import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';

import { db, listCustomQuests } from '../frontend/src/utils/customcontent.js';

async function deleteDatabase(name: string) {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });
}

describe('listCustomQuests helper', () => {
    beforeEach(async () => {
        await deleteDatabase('CustomContent');
        localStorage.clear();
    });

    test('returns stored custom quests with metadata', async () => {
        expect(typeof listCustomQuests).toBe('function');

        await db.quests.add({
            id: 'quest-test',
            title: 'Quest Test',
            description: 'Created via test',
        });

        const quests = await listCustomQuests();
        expect(quests).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'quest-test', title: 'Quest Test', custom: true }),
            ])
        );
    });
});
