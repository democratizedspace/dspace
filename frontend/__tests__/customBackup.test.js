/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { db } from '../src/utils/customcontent.js';
import {
    BACKUP_SCHEMA_VERSION,
    buildCustomContentBackupData,
    restoreCustomContentBackup,
} from '../src/utils/customContentBackup.js';

describe('custom content backup', () => {
    test('export and import round trip', async () => {
        const idItem = await db.items.add({
            id: 'i1',
            name: 'backup item',
            image: 'data:image/png;base64,TEST',
        });
        const idProcess = await db.processes.add({ id: 'p1', title: 'backup process' });
        const idQuest = await db.quests.add({
            id: 'q1',
            title: 'backup quest',
            description: 'd',
            image: 'data:image/png;base64,TEST',
        });

        const backup = await buildCustomContentBackupData();

        await indexedDB.deleteDatabase('CustomContent');

        await restoreCustomContentBackup(backup);

        const item = await db.items.get(idItem);
        const process = await db.processes.get(idProcess);
        const quest = await db.quests.get(idQuest);
        expect(item.name).toBe('backup item');
        expect(process.title).toBe('backup process');
        expect(quest.title).toBe('backup quest');
    });

    test('import invalid data throws', async () => {
        await expect(restoreCustomContentBackup({})).rejects.toThrow('Invalid backup data');
    });

    test('handles empty backup gracefully', async () => {
        const empty = {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            timestamp: new Date().toISOString(),
            counts: { items: 0, processes: 0, quests: 0, images: 0 },
            items: [],
            processes: [],
            quests: [],
            images: [],
        };
        await restoreCustomContentBackup(empty);
        const items = await db.list('item');
        expect(items).toEqual([]);
    });

    test('export returns schema data', async () => {
        const backup = await buildCustomContentBackupData();
        expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
        expect(Object.keys(backup).sort()).toEqual(
            [
                'counts',
                'images',
                'items',
                'processes',
                'quests',
                'schemaVersion',
                'timestamp',
            ].sort()
        );
    });

    test('restore does not overwrite main game state snapshots', async () => {
        await indexedDB.deleteDatabase('CustomContent');
        const mainState = { inventory: { safe: 1 }, versionNumberString: '3.0' };
        const serialized = JSON.stringify(mainState);
        localStorage.setItem('gameState', serialized);
        localStorage.setItem('gameStateBackup', serialized);

        const backup = {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            timestamp: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 1 },
            items: [{ id: 'i-safe', name: 'custom item' }],
            processes: [],
            quests: [],
            images: [
                {
                    id: 'item:i-safe:image',
                    entityType: 'item',
                    entityId: 'i-safe',
                    dataUrl: 'data:image/png;base64,TEST',
                },
            ],
        };

        await restoreCustomContentBackup(backup);

        expect(localStorage.getItem('gameState')).toBe(serialized);
        expect(localStorage.getItem('gameStateBackup')).toBe(serialized);
        const imported = await db.items.get('i-safe');
        expect(imported?.name).toBe('custom item');
    });

    test('invalid image references do not partially apply changes', async () => {
        const invalid = {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            timestamp: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 1 },
            items: [{ id: 'i-invalid', name: 'custom item' }],
            processes: [],
            quests: [],
            images: [
                {
                    id: 'item:missing:image',
                    entityType: 'item',
                    entityId: 'missing',
                    dataUrl: 'data:image/png;base64,TEST',
                },
            ],
        };

        await expect(restoreCustomContentBackup(invalid)).rejects.toThrow('Missing item for image');

        const items = await db.list('item');
        expect(items).toEqual([]);
    });
});
