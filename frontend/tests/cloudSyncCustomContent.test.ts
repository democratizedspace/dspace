import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
    exportGameStateString,
    importGameStateString,
    resetGameState,
    loadGameState,
} from '../src/utils/gameState/common.js';
import * as cloudSync from '../src/utils/cloudSync.js';
import * as customContentBackup from '../src/utils/customContentBackup.js';
import * as githubGists from '../src/lib/cloudsync/githubGists';
import { getItems, getProcesses, getQuests, openCustomContentDB } from '../src/utils/indexeddb.js';
import { buildQuestProgressStats } from '../src/utils/questProgressStats.js';
import { listBuiltInQuestIds } from '../src/utils/builtInQuests.js';

const decodeBackup = (value: string) => {
    const decoded =
        typeof atob === 'function' ? atob(value) : Buffer.from(value, 'base64').toString('utf8');
    return JSON.parse(decoded);
};

const deleteCustomContentDatabase = () =>
    new Promise<void>((resolve, reject) => {
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

const overwriteCustomContent = async () => {
    const db = await openCustomContentDB();
    const tx = db.transaction(['items', 'processes', 'quests'], 'readwrite');
    tx.objectStore('items').put({
        id: 'custom-item-1',
        name: 'Conflicting Item',
        custom: true,
    });
    tx.objectStore('processes').put({
        id: 'custom-process-1',
        title: 'Conflicting Process',
        duration: 30,
        custom: true,
        requireItems: [],
        consumeItems: [],
        createItems: [],
    });
    tx.objectStore('quests').put({
        id: 'custom-quest-1',
        title: 'Conflicting Quest',
        description: 'Conflicting custom quest.',
        custom: true,
        dialogue: [],
    });

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Failed to overwrite custom content'));
        tx.onabort = () => reject(tx.error ?? new Error('Failed to overwrite custom content'));
    });
    db.close();
};

describe('cloud sync custom content', () => {
    beforeEach(async () => {
        await resetGameState();
        await deleteCustomContentDatabase();
    });

    test('uploads custom content in gist payload', async () => {
        const customContent = {
            items: [
                {
                    id: 'custom-item-1',
                    name: 'Cloud Sync Item',
                    custom: true,
                },
            ],
            processes: [
                {
                    id: 'custom-process-1',
                    title: 'Cloud Sync Process',
                    duration: 60,
                    custom: true,
                    requireItems: [],
                    consumeItems: [],
                    createItems: [],
                },
            ],
            quests: [
                {
                    id: 'custom-quest-1',
                    title: 'Cloud Sync Quest',
                    description: 'Custom quest stored via cloud sync.',
                    custom: true,
                    dialogue: [],
                },
            ],
        };
        const buildSpy = vi
            .spyOn(customContentBackup, 'buildCustomContentBackupData')
            .mockResolvedValue(customContent);
        const createSpy = vi.spyOn(githubGists, 'createBackupGist').mockResolvedValue({
            id: 'gist-id',
        });

        await cloudSync.uploadGameStateToGist('token');

        expect(createSpy).toHaveBeenCalledTimes(1);
        const { content } = createSpy.mock.calls[0][0];
        const decoded = decodeBackup(content);

        expect(decoded.customContent).toEqual(customContent);

        buildSpy.mockRestore();
        createSpy.mockRestore();
    });

    test('includes custom content in exports and restores on import', async () => {
        await seedCustomContent();
        const customContent = await customContentBackup.buildCustomContentBackupData();
        const encoded = exportGameStateString({
            providerHint: 'github-gist',
            customContent,
            stateOverride: {
                quests: {},
                inventory: {},
                processes: {},
                itemContainerCounts: {
                    '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec': {
                        '5247a603-294a-4a34-a884-1ae20969b2a1': 7,
                    },
                },
                settings: {},
                versionNumberString: '3',
                _meta: { lastUpdated: Date.now() },
            },
        });
        const decoded = decodeBackup(encoded);

        expect(decoded.customContent).toBeTruthy();
        expect(decoded.customContent.items).toHaveLength(1);
        expect(decoded.customContent.processes).toHaveLength(1);
        expect(decoded.customContent.quests).toHaveLength(1);
        expect(decoded.payload.itemContainerCounts['830d74da-9de5-44c7-8b9f-83a1ed3aa8ec']).toEqual(
            {
                '5247a603-294a-4a34-a884-1ae20969b2a1': 7,
            }
        );

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

        const importedState = loadGameState();
        expect(
            importedState.itemContainerCounts['830d74da-9de5-44c7-8b9f-83a1ed3aa8ec']?.[
                '5247a603-294a-4a34-a884-1ae20969b2a1'
            ]
        ).toBe(7);
    });

    test('overwrites existing custom content during import', async () => {
        await seedCustomContent();
        const customContent = await customContentBackup.buildCustomContentBackupData();
        const encoded = exportGameStateString({
            providerHint: 'github-gist',
            customContent,
            stateOverride: {
                quests: {},
                inventory: {},
                processes: {},
                itemContainerCounts: {
                    '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec': {
                        '5247a603-294a-4a34-a884-1ae20969b2a1': 7,
                    },
                },
                settings: {},
                versionNumberString: '3',
                _meta: { lastUpdated: Date.now() },
            },
        });

        await overwriteCustomContent();
        await importGameStateString(encoded);

        const [items, processes, quests] = await Promise.all([
            getItems(),
            getProcesses(),
            getQuests(),
        ]);
        expect(items.find((item) => item.id === 'custom-item-1')?.name).toBe('Cloud Sync Item');
        expect(processes.find((process) => process.id === 'custom-process-1')?.title).toBe(
            'Cloud Sync Process'
        );
        expect(quests.find((quest) => quest.id === 'custom-quest-1')?.title).toBe(
            'Cloud Sync Quest'
        );
    });

    test('restored /gamesaves envelopes preserve deterministic official quest stats', async () => {
        const [officialQuestId] = listBuiltInQuestIds();
        const encoded = exportGameStateString({
            providerHint: 'github-gist',
            stateOverride: {
                quests: {
                    [officialQuestId]: { finished: true },
                    'custom/finished-quest': { finished: true },
                },
                inventory: {},
                processes: {},
                itemContainerCounts: {},
                settings: {},
                versionNumberString: '3',
                _meta: { lastUpdated: Date.now() },
            },
        });

        await importGameStateString(encoded);

        const importedState = loadGameState();
        const stats = buildQuestProgressStats(importedState);

        expect(stats.completedOfficialQuestCount).toBe(1);
        expect(stats.remainingOfficialQuestCount).toBe(stats.totalOfficialQuestCount - 1);
    });
});
