import {
    saveItem,
    saveProcess,
    saveQuest,
    getItems,
    getProcesses,
    getQuests,
    openCustomContentDB,
} from './indexeddb.js';

export const DEFAULT_LOAD_TEST_COUNT = 100;

/**
 * Run a concurrent load test against the custom content database.
 * Inserts multiple records for each entity type in parallel and reports timing metrics.
 * @param {object} [options]
 * @param {number} [options.count=100] Number of records for each entity type
 * @returns {Promise<{insertMs:number, readMs:number, itemCount:number, processCount:number, questCount:number}>}
 */
export async function runCustomContentLoadTest({ count = DEFAULT_LOAD_TEST_COUNT } = {}) {
    await openCustomContentDB();

    const startInsert = performance.now();
    const ops = [];
    for (let i = 0; i < count; i++) {
        const itemId = `lt-item-${i}`;
        ops.push(saveItem({ id: itemId, name: `Item ${i}`, description: `Item ${i} description` }));
        ops.push(
            saveProcess({
                id: `lt-proc-${i}`,
                title: `Process ${i}`,
                duration: '1s',
                createItems: [{ id: itemId, count: 1 }],
            })
        );
        ops.push(
            saveQuest({
                id: `lt-quest-${i}`,
                title: `Quest ${i}`,
                description: `Quest ${i} description`,
                image: '/assets/quests/default.jpg',
            })
        );
    }
    await Promise.all(ops);
    const insertMs = performance.now() - startInsert;

    const startRead = performance.now();
    const [items, processes, quests] = await Promise.all([getItems(), getProcesses(), getQuests()]);
    const readMs = performance.now() - startRead;

    return {
        insertMs,
        readMs,
        itemCount: items.length,
        processCount: processes.length,
        questCount: quests.length,
    };
}
