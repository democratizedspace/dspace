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

    test('exportCustomContentString uses stable schema', async () => {
        const encoded = await exportCustomContentString();
        const decoded = JSON.parse(atob(encoded));
        expect(Object.keys(decoded).sort()).toEqual(['items', 'processes', 'quests']);
    });

    test('importCustomContentString does not overwrite main game state snapshots', async () => {
        await indexedDB.deleteDatabase('CustomContent');
        const mainState = { inventory: { safe: 1 }, versionNumberString: '3.0' };
        const serialized = JSON.stringify(mainState);
        localStorage.setItem('gameState', serialized);
        localStorage.setItem('gameStateBackup', serialized);

        const encoded = btoa(
            JSON.stringify({
                items: [{ id: 'i-safe', name: 'custom item' }],
                processes: [],
                quests: [],
            })
        );

        await importCustomContentString(encoded);

        expect(localStorage.getItem('gameState')).toBe(serialized);
        expect(localStorage.getItem('gameStateBackup')).toBe(serialized);
        const imported = await db.items.get('i-safe');
        expect(imported?.name).toBe('custom item');
    });
});
