/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    BACKUP_SCHEMA_VERSION,
    createCustomContentBackupPayload,
    getCustomContentSnapshot,
    importCustomContentBackupPayload,
    parseCustomContentBackup,
    serializeCustomContentBackup,
} from '../src/utils/customContentBackup.js';
import { db } from '../src/utils/customcontent.js';

const IMAGE_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8/5+hHgAGgwJ/l4FfPwAAAABJRU5ErkJggg==';

describe('custom content backup', () => {
    test('export and import round trip', async () => {
        const idItem = await db.items.add({
            id: 'i1',
            name: 'backup item',
            image: IMAGE_DATA_URL,
        });
        const idProcess = await db.processes.add({ id: 'p1', title: 'backup process' });
        const idQuest = await db.quests.add({
            id: 'q1',
            title: 'backup quest',
            description: 'd',
            image: IMAGE_DATA_URL,
        });

        const snapshot = await getCustomContentSnapshot();
        const backup = await createCustomContentBackupPayload(snapshot);

        await indexedDB.deleteDatabase('CustomContent');

        await importCustomContentBackupPayload(backup);

        const item = await db.items.get(idItem);
        const process = await db.processes.get(idProcess);
        const quest = await db.quests.get(idQuest);
        expect(item.name).toBe('backup item');
        expect(process.title).toBe('backup process');
        expect(quest.title).toBe('backup quest');
    });

    test('import invalid data throws', async () => {
        expect(() => parseCustomContentBackup('bad')).toThrow('Backup file is not valid JSON');
    });

    test('handles empty backup gracefully', async () => {
        const empty = {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            counts: { items: 0, processes: 0, quests: 0, images: 0 },
            items: [],
            processes: [],
            quests: [],
        };
        await importCustomContentBackupPayload(empty);
        const items = await db.list('item');
        expect(items).toEqual([]);
    });

    test('export returns JSON payload with schema version', async () => {
        const snapshot = await getCustomContentSnapshot();
        const payload = await createCustomContentBackupPayload(snapshot);
        expect(payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
        expect(payload).toHaveProperty('items');
    });

    test('serializeCustomContentBackup outputs JSON', async () => {
        const snapshot = await getCustomContentSnapshot();
        const payload = await createCustomContentBackupPayload(snapshot);
        expect(() => JSON.parse(serializeCustomContentBackup(payload))).not.toThrow();
    });

    test('importCustomContentBackupPayload does not overwrite main game state snapshots', async () => {
        await indexedDB.deleteDatabase('CustomContent');
        const mainState = { inventory: { safe: 1 }, versionNumberString: '3.0' };
        const serialized = JSON.stringify(mainState);
        localStorage.setItem('gameState', serialized);
        localStorage.setItem('gameStateBackup', serialized);

        const payload = {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 1 },
            items: [{ id: 'i-safe', name: 'custom item', image: IMAGE_DATA_URL }],
            processes: [],
            quests: [],
        };

        await importCustomContentBackupPayload(payload);

        expect(localStorage.getItem('gameState')).toBe(serialized);
        expect(localStorage.getItem('gameStateBackup')).toBe(serialized);
        const imported = await db.items.get('i-safe');
        expect(imported?.name).toBe('custom item');
    });

    test('import rejects backups missing images', async () => {
        const payload = {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            counts: { items: 1, processes: 0, quests: 0, images: 0 },
            items: [{ id: 'i-missing', name: 'missing image' }],
            processes: [],
            quests: [],
        };

        await expect(importCustomContentBackupPayload(payload)).rejects.toThrow(
            'Backup data is missing required images.'
        );
    });
});
