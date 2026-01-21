import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeEach } from 'vitest';
import { db } from '../src/utils/customcontent.js';
import { restoreCustomContentBackup } from '../src/utils/customContentBackup.js';

const fixtureDir = path.resolve(
    process.cwd(),
    'frontend',
    'tests',
    'fixtures',
    'custom-content-backups'
);

const readFixture = (filename: string) => {
    const raw = readFileSync(path.join(fixtureDir, filename), 'utf-8');
    return JSON.parse(raw);
};

const resetCustomContentDb = async () => {
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onblocked = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Failed to reset CustomContent.'));
    });
};

describe('custom content backup import fixtures', () => {
    beforeEach(async () => {
        await resetCustomContentDb();
    });

    it('imports item-only backups with images', async () => {
        const backup = readFixture('item-only.json');

        const result = await restoreCustomContentBackup(backup);

        expect(result).toMatchObject({
            items: 1,
            processes: 0,
            quests: 0,
            images: 1,
        });
        expect(result.summary?.message).toContain('Items: 1');
        const item = await db.items.get(backup.items[0].id);
        expect(item?.name).toBe('Backup item');
        expect(item?.image).toBe('data:image/jpeg;base64,TEST');
    });

    it('imports backups that include processes', async () => {
        const backup = readFixture('item-and-process.json');

        const result = await restoreCustomContentBackup(backup);

        expect(result).toMatchObject({
            items: 1,
            processes: 1,
            quests: 0,
            images: 1,
        });
        const item = await db.items.get(backup.items[0].id);
        const process = await db.processes.get(backup.processes[0].id);
        expect(item?.name).toBe('Backup item with process');
        expect(process?.title).toBe('Backup process');
    });

    it('defaults missing sections to empty arrays', async () => {
        const backup = readFixture('item-only.json');
        delete backup.processes;
        delete backup.quests;

        const result = await restoreCustomContentBackup(backup);

        expect(result).toMatchObject({
            items: 1,
            processes: 0,
            quests: 0,
            images: 1,
        });
        expect(result.summary?.missing).toEqual(['processes', 'quests']);
    });
});
