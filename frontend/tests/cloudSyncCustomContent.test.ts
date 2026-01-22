import { beforeEach, describe, expect, test } from 'vitest';
import {
    exportGameStateString,
    importGameStateString,
    resetGameState,
} from '../src/utils/gameState/common.js';
import { buildCustomContentBackupData } from '../src/utils/customContentBackup.js';
import { getItems, getProcesses, getQuests, openCustomContentDB } from '../src/utils/indexeddb.js';

const decodeBackup = (value: string) => JSON.parse(Buffer.from(value, 'base64').toString('utf8'));

const deleteCustomContentDatabase = async () =>
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onerror = () =>
            reject(request.error ?? new Error('Failed to delete CustomContent'));
        request.onblocked = () => resolve();
    });

const seedCustomContent = async () => {
    const db = await openCustomContentDB();
    const tx = db.transaction(['items', 'processes', 'quests'], 'readwrite');
    tx.objectStore('items').add({
        id: 'custom-item-1',
        name: 'Cloud Sync Item',
        custom: true,
    });
    tx.objectStore('processes').add({
        id: 'custom-process-1',
        title: 'Cloud Sync Process',
        duration: 60,
        custom: true,
        requireItems: [],
        consumeItems: [],
        createItems: [],
    });
    tx.objectStore('quests').add({
        id: 'custom-quest-1',
        title: 'Cloud Sync Quest',
        description: 'Custom quest stored via cloud sync.',
        custom: true,
        dialogue: [],
    });

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Failed to seed custom content'));
        tx.onabort = () => reject(tx.error ?? new Error('Failed to seed custom content'));
    });
    db.close();
};

describe('cloud sync custom content', () => {
    beforeEach(async () => {
        await resetGameState();
        await deleteCustomContentDatabase();
    });

    test('includes custom content in exports and restores on import', async () => {
        await seedCustomContent();
        const customContent = await buildCustomContentBackupData();
        const encoded = exportGameStateString({
            providerHint: 'github-gist',
            customContent,
        });
        const decoded = decodeBackup(encoded);

        expect(decoded.customContent).toBeTruthy();
        expect(decoded.customContent.items).toHaveLength(1);
        expect(decoded.customContent.processes).toHaveLength(1);
        expect(decoded.customContent.quests).toHaveLength(1);

        await deleteCustomContentDatabase();
        await importGameStateString(encoded);

        const [items, processes, quests] = await Promise.all([
            getItems(),
            getProcesses(),
            getQuests(),
        ]);
        expect(items.map((item) => item.id)).toContain('custom-item-1');
        expect(processes.map((process) => process.id)).toContain('custom-process-1');
        expect(quests.map((quest) => quest.id)).toContain('custom-quest-1');
    });
});
