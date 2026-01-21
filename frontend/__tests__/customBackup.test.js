/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/utils/customcontent.js';
import {
    BACKUP_SCHEMA_VERSION,
    buildCustomContentBackupData,
    restoreCustomContentBackup,
} from '../src/utils/customContentBackup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ITEM_ONLY_FIXTURE_PATH = path.join(
    __dirname,
    'fixtures',
    'custom-content-backup-item-only.json'
);

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

    test('imports item-only backup fixtures', async () => {
        const fixture = JSON.parse(readFileSync(ITEM_ONLY_FIXTURE_PATH, 'utf8'));

        const result = await restoreCustomContentBackup(fixture);

        expect(result.items).toBe(1);
        expect(result.processes).toBe(0);
        expect(result.quests).toBe(0);
        expect(result.images).toBe(1);
        expect(result.total).toBe(2);

        const imported = await db.items.get('fixture-item-1');
        expect(imported?.name).toBe('Fixture Item');
        expect(imported?.image).toBe('data:image/jpeg;base64,TEST');
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
