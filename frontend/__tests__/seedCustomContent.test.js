/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { db } from '../src/utils/customcontent.js';

describe('seedCustomContent script', () => {
    test('seeds sample entities', async () => {
        global.window = { indexedDB };
        const { seedCustomContent } = await import('../scripts/seed-custom-content.js');
        const ids = await seedCustomContent();
        const item = await db.items.get(ids.itemId);
        const process = await db.processes.get(ids.processId);
        const quest = await db.quests.get(ids.questId);

        expect(item.name).toBe('Seeded Item');
        expect(process.title).toBe('Seeded Process');
        expect(quest.title).toBe('Map the Constellations');
    });
});
