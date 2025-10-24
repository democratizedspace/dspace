import { beforeEach, describe, expect, it, vi } from 'vitest';

const OFFLINE_ERROR_MESSAGE = 'IndexedDB is not supported';
const offlineReject = () => Promise.reject(new Error(OFFLINE_ERROR_MESSAGE));

const addEntityMock = vi.fn(offlineReject);
const getEntityMock = vi.fn(offlineReject);
const updateEntityMock = vi.fn(offlineReject);
const deleteEntityMock = vi.fn(offlineReject);
const getQuestsMock = vi.fn(offlineReject);
const getItemsMock = vi.fn(offlineReject);
const getProcessesMock = vi.fn(offlineReject);

vi.mock('../frontend/src/utils/indexeddb.js', async () => {
    const actual = await vi.importActual<typeof import('../frontend/src/utils/indexeddb.js')>(
        '../frontend/src/utils/indexeddb.js'
    );

    return {
        ...actual,
        addEntity: addEntityMock,
        getEntity: getEntityMock,
        updateEntity: updateEntityMock,
        deleteEntity: deleteEntityMock,
        getQuests: getQuestsMock,
        getItems: getItemsMock,
        getProcesses: getProcessesMock,
    };
});

async function loadModules() {
    const customcontent = await import('../frontend/src/utils/customcontent.js');
    const questPersistence = await import('../frontend/src/utils/questPersistence.js');
    return { customcontent, questPersistence };
}

describe('offline quest caching', () => {
    beforeEach(() => {
        vi.resetModules();

        addEntityMock.mockReset();
        getEntityMock.mockReset();
        updateEntityMock.mockReset();
        deleteEntityMock.mockReset();
        getQuestsMock.mockReset();
        getItemsMock.mockReset();
        getProcessesMock.mockReset();

        addEntityMock.mockImplementation(offlineReject);
        getEntityMock.mockImplementation(offlineReject);
        updateEntityMock.mockImplementation(offlineReject);
        deleteEntityMock.mockImplementation(offlineReject);
        getQuestsMock.mockImplementation(offlineReject);
        getItemsMock.mockImplementation(offlineReject);
        getProcessesMock.mockImplementation(offlineReject);

        // Ensure the environment mimics browsers without IndexedDB support.
        delete (globalThis as typeof globalThis & { indexedDB?: unknown }).indexedDB;
    });

    it('falls back to in-memory quest storage when IndexedDB is unavailable', async () => {
        const { customcontent } = await loadModules();
        const { db, ENTITY_TYPES } = customcontent;

        const questId = await db.quests.add({
            title: 'Offline orientation',
            description: 'Prep the player for offline play.',
            image: '/assets/quests/offline.jpg',
            dialogue: [
                {
                    id: 'start',
                    text: 'Ready to learn offline caching?',
                    options: [{ type: 'finish', text: 'Finish quest' }],
                },
            ],
        });

        expect(addEntityMock).toHaveBeenCalledTimes(1);
        expect(typeof questId === 'string' || typeof questId === 'number').toBe(true);

        const quests = await db.list(ENTITY_TYPES.QUEST);
        expect(getQuestsMock).toHaveBeenCalledTimes(1);

        const storedQuest = quests.find((quest) => quest.id === questId);
        expect(storedQuest).toMatchObject({
            id: questId,
            title: 'Offline orientation',
            description: 'Prep the player for offline play.',
            image: '/assets/quests/offline.jpg',
            custom: true,
        });
        expect(storedQuest?.dialogue?.[0]?.text).toBe('Ready to learn offline caching?');
    });

    it('caches server-provided quests for offline runs', async () => {
        const { customcontent, questPersistence } = await loadModules();
        const { db, ENTITY_TYPES } = customcontent;
        const { syncExistingQuestsToIndexedDB } = questPersistence;

        const offlineQuest = {
            id: 'welcome/offline',
            title: 'Cached quest',
            description: 'Stay productive without a network connection.',
            image: '/assets/quests/offline.jpg',
        };

        const firstSync = await syncExistingQuestsToIndexedDB([offlineQuest]);
        expect(firstSync).toHaveLength(1);
        expect(firstSync[0]).toMatchObject({
            id: offlineQuest.id,
            title: offlineQuest.title,
            custom: false,
        });
        expect(addEntityMock).toHaveBeenCalledTimes(1);

        addEntityMock.mockClear();
        const secondSync = await syncExistingQuestsToIndexedDB([offlineQuest]);
        expect(addEntityMock).not.toHaveBeenCalled();
        expect(secondSync).toHaveLength(1);

        const cached = await db.list(ENTITY_TYPES.QUEST);
        const stored = cached.find((quest) => quest.id === offlineQuest.id);
        expect(stored).toMatchObject({
            id: offlineQuest.id,
            title: offlineQuest.title,
            image: offlineQuest.image,
        });
    });
});
