/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { runDbBenchmark, DEFAULT_BENCHMARK_COUNT } from '../src/utils/dbBenchmark.js';
import { parseCountArg } from '../scripts/db-benchmark.js';

function resetDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase('CustomContent');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
    });
}

beforeEach(async () => {
    await resetDB();
});

describe('runDbBenchmark', () => {
    test('returns timing metrics and counts', async () => {
        const result = await runDbBenchmark({ count: 10 });
        expect(result.itemCount).toBe(10);
        expect(result.processCount).toBe(10);
        expect(result.questCount).toBe(10);
        expect(result.insertMs).toBeGreaterThan(0);
        expect(result.readMs).toBeGreaterThan(0);
    });

    test('uses default count when none provided', async () => {
        const result = await runDbBenchmark();
        expect(result.itemCount).toBe(50);
        expect(result.processCount).toBe(50);
        expect(result.questCount).toBe(50);
        expect(result.insertMs).toBeGreaterThan(0);
        expect(result.readMs).toBeGreaterThan(0);
    });

    test('exports default count constant', () => {
        expect(DEFAULT_BENCHMARK_COUNT).toBe(50);
    });

    test('parseCountArg extracts numeric value', () => {
        expect(parseCountArg(['--count', '5'])).toBe(5);
        expect(parseCountArg(['-c', '3'])).toBe(3);
        expect(parseCountArg(['--count=7'])).toBe(7);
        expect(parseCountArg([])).toBeUndefined();
    });
});
