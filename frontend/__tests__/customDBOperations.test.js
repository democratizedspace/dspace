/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    saveItem,
    getItems,
    getItem,
    deleteItem,
    saveProcess,
    getProcesses,
    getProcess,
    deleteProcess,
    saveQuest,
    getQuests,
    getQuest,
    deleteQuest,
} from '../src/utils/indexeddb.js';

describe('Custom DB operations', () => {
    test('saveItem and getItem work correctly', async () => {
        const item = { id: 'abc-123', name: 'Widget' };
        await saveItem(item);
        const result = await getItem('abc-123');
        expect(result).toEqual(item);
    });

    test('getItems returns all stored items', async () => {
        const itemA = { id: 'a', name: 'A' };
        const itemB = { id: 'b', name: 'B' };
        await saveItem(itemA);
        await saveItem(itemB);
        const items = await getItems();
        expect(items).toEqual(expect.arrayContaining([itemA, itemB]));
    });

    test('item functions delete correctly', async () => {
        const item = { id: 'todelete', name: 'Remove me' };
        await saveItem(item);
        await deleteItem('todelete');
        const afterDelete = await getItem('todelete');
        expect(afterDelete).toBeUndefined();
    });

    test('process functions save and delete correctly', async () => {
        const process = { id: 'proc1', title: 'Run' };
        await saveProcess(process);
        const found = await getProcess('proc1');
        expect(found).toEqual(process);

        await deleteProcess('proc1');
        const afterDelete = await getProcess('proc1');
        expect(afterDelete).toBeUndefined();
    });

    test('getProcesses returns all stored processes', async () => {
        const p1 = { id: 'p1', title: 'One' };
        const p2 = { id: 'p2', title: 'Two' };
        await saveProcess(p1);
        await saveProcess(p2);
        const processes = await getProcesses();
        expect(processes).toEqual(expect.arrayContaining([p1, p2]));
    });

    test('quest functions save and list correctly', async () => {
        const quest = { id: 'quest1', title: 'Start' };
        await saveQuest(quest);
        const result = await getQuest('quest1');
        expect(result).toEqual(quest);
        const quests = await getQuests();
        expect(quests).toEqual(expect.arrayContaining([quest]));
    });

    test('quest functions delete correctly', async () => {
        const quest = { id: 'qdel', title: 'Remove' };
        await saveQuest(quest);
        await deleteQuest('qdel');
        const afterDelete = await getQuest('qdel');
        expect(afterDelete).toBeUndefined();
    });
});
