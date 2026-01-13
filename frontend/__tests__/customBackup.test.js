/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    BACKUP_SCHEMA_VERSION,
    importCustomContentBackupFile,
    prepareCustomContentBackup,
} from '../src/utils/customContentBackup.js';
import { db } from '../src/utils/customcontent.js';

const buildBackupFile = (payload) => {
    return new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
};

describe('custom content backup', () => {
    test('prepare and import round trip', async () => {
        const idItem = await db.items.add({
            id: 'i1',
            name: 'backup item',
            image: 'data:image/png;base64,ITEM',
        });
        const idProcess = await db.processes.add({ id: 'p1', title: 'backup process' });
        const idQuest = await db.quests.add({
            id: 'q1',
            title: 'backup quest',
            description: 'd',
            image: 'data:image/png;base64,QUEST',
        });

        const { blob, payload } = await prepareCustomContentBackup();
        const raw = await blob.text();
        const parsed = JSON.parse(raw);

        expect(parsed.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
        expect(parsed.counts.items).toBe(1);
        expect(parsed.counts.processes).toBe(1);
        expect(parsed.counts.quests).toBe(1);
        expect(parsed.counts.images).toBe(2);
        expect(payload.images).toHaveLength(2);

        await indexedDB.deleteDatabase('CustomContent');

        const backupFile = buildBackupFile(parsed);
        await importCustomContentBackupFile(backupFile);

        const item = await db.items.get(idItem);
        const process = await db.processes.get(idProcess);
        const quest = await db.quests.get(idQuest);
        expect(item.name).toBe('backup item');
        expect(item.image).toBe('data:image/png;base64,ITEM');
        expect(process.title).toBe('backup process');
        expect(quest.title).toBe('backup quest');
        expect(quest.image).toBe('data:image/png;base64,QUEST');
    });

    test('import invalid data throws', async () => {
        const badFile = new File(['bad'], 'bad.json', { type: 'application/json' });
        await expect(importCustomContentBackupFile(badFile)).rejects.toThrow('Invalid backup file');
    });

    test('handles empty backup gracefully', async () => {
        const emptyFile = buildBackupFile({
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            counts: { items: 0, processes: 0, quests: 0, images: 0 },
            items: [],
            processes: [],
            quests: [],
            images: [],
        });
        await importCustomContentBackupFile(emptyFile);
        const items = await db.list('item');
        expect(items).toEqual([]);
    });

    test('import rejects unsupported schema versions without partial writes', async () => {
        const backupFile = buildBackupFile({
            schemaVersion: 2,
            createdAt: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 0 },
            items: [{ id: 'safe-item', name: 'Should not import' }],
            processes: [],
            quests: [],
            images: [],
        });

        await expect(importCustomContentBackupFile(backupFile)).rejects.toThrow(
            'Unsupported backup schema version'
        );

        const items = await db.list('item');
        expect(items).toEqual([]);
    });

    test('import does not overwrite main game state snapshots', async () => {
        await indexedDB.deleteDatabase('CustomContent');
        const mainState = { inventory: { safe: 1 }, versionNumberString: '3.0' };
        const serialized = JSON.stringify(mainState);
        localStorage.setItem('gameState', serialized);
        localStorage.setItem('gameStateBackup', serialized);

        const backupFile = buildBackupFile({
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 0 },
            items: [{ id: 'i-safe', name: 'custom item' }],
            processes: [],
            quests: [],
            images: [],
        });

        await importCustomContentBackupFile(backupFile);

        expect(localStorage.getItem('gameState')).toBe(serialized);
        expect(localStorage.getItem('gameStateBackup')).toBe(serialized);
        const imported = await db.items.get('i-safe');
        expect(imported?.name).toBe('custom item');
    });
});
