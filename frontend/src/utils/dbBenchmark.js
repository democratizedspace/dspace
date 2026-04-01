/* istanbul ignore file - helpers tested via indexeddb.js */
import {
    saveItem,
    saveProcess,
    saveQuest,
    getItems,
    getProcesses,
    getQuests,
    openCustomContentDB,
} from './indexeddb.js';

export const DEFAULT_BENCHMARK_COUNT = 50;

/**
 * Run a simple performance benchmark of the custom content database.
 * @param {object} [options]
 * @param {number} [options.count=50] Number of records for each entity type
 * @returns {Promise<{insertMs:number, readMs:number, itemCount:number, processCount:number, questCount:number}>}
 */
export async function runDbBenchmark({ count = DEFAULT_BENCHMARK_COUNT } = {}) {
    await openCustomContentDB();
    const startInsert = performance.now();
    for (let i = 0; i < count; i++) {
        await saveItem({ id: `item-${i}`, name: `Item ${i}`, description: `Benchmark item ${i}` });
        await saveProcess({
            id: `proc-${i}`,
            title: `Process ${i}`,
            duration: '1h',
            requireItems: [{ id: `item-${i}`, count: 1 }],
        });
        await saveQuest({
            id: `quest-${i}`,
            title: `Quest ${i}`,
            description: `Benchmark quest ${i}`,
            image: '/placeholder.png',
        });
    }
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
