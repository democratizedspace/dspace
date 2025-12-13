import 'fake-indexeddb/auto';
import { describe, expect, test, beforeEach } from 'vitest';
import {
  runCustomContentLoadTest,
  DEFAULT_LOAD_TEST_COUNT,
} from '../frontend/src/utils/customContentLoadTest.js';

function resetDB() {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('CustomContent');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

describe('runCustomContentLoadTest', () => {
  beforeEach(async () => {
    await resetDB();
  });

  test('returns counts and timing metrics', async () => {
    const result = await runCustomContentLoadTest({ count: 5 });
    expect(result.itemCount).toBe(5);
    expect(result.processCount).toBe(5);
    expect(result.questCount).toBe(5);
    expect(result.insertMs).toBeGreaterThan(0);
    expect(result.readMs).toBeGreaterThan(0);
  });

  test('uses default count when omitted', async () => {
    const result = await runCustomContentLoadTest();
    expect(result.itemCount).toBe(DEFAULT_LOAD_TEST_COUNT);
    expect(result.processCount).toBe(DEFAULT_LOAD_TEST_COUNT);
    expect(result.questCount).toBe(DEFAULT_LOAD_TEST_COUNT);
  });
});
