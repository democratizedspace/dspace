/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { runDbBenchmark } from '../src/utils/dbBenchmark.js';

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
    });
});
