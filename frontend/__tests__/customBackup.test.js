/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    db,
    exportCustomContentString,
    importCustomContentString,
} from '../src/utils/customcontent.js';

describe('custom content backup', () => {
    test('export and import round trip', async () => {
        const idItem = await db.items.add({ id: 'i1', name: 'backup item' });
        const idProcess = await db.processes.add({ id: 'p1', title: 'backup process' });
        const idQuest = await db.quests.add({
            id: 'q1',
            title: 'backup quest',
            description: 'd',
            image: 'x',
        });

        const backup = await exportCustomContentString();

        await indexedDB.deleteDatabase('CustomContent');

        await importCustomContentString(backup);

        const item = await db.items.get(idItem);
        const process = await db.processes.get(idProcess);
        const quest = await db.quests.get(idQuest);
        expect(item.name).toBe('backup item');
        expect(process.title).toBe('backup process');
        expect(quest.title).toBe('backup quest');
    });

    test('import invalid data throws', async () => {
        await expect(importCustomContentString('bad')).rejects.toThrow('Invalid backup data');
    });

    test('handles empty backup gracefully', async () => {
        const empty = btoa(JSON.stringify({ items: [], processes: [], quests: [] }));
        await importCustomContentString(empty);
        const items = await db.list('item');
        expect(items).toEqual([]);
    });

    test('export returns base64 string', async () => {
        const str = await exportCustomContentString();
        expect(typeof str).toBe('string');
        expect(() => atob(str)).not.toThrow();
    });
});
