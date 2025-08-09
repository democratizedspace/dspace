import { beforeEach, describe, test, expect } from 'vitest';
import 'fake-indexeddb/auto';
import {
  openCustomContentDB,
  saveQuest,
  getQuest,
  getSchemaVersion,
  CUSTOM_CONTENT_DB_VERSION,
} from '../frontend/src/utils/indexeddb.js';
import {
  setSchemaVersion,
  runMigrations,
  validateDataIntegrity,
} from '../frontend/src/utils/migrations.js';

beforeEach(async () => {
  await indexedDB.deleteDatabase('CustomContent');
});

describe('data migration system', () => {
  test('adds createdAt and updatedAt fields and bumps version', async () => {
    const db = await openCustomContentDB();
    await saveQuest({
      id: 'q1',
      title: 'Old Quest',
      description: 'Legacy quest',
      image: 'data:image/png;base64,AAAA',
    });
    await setSchemaVersion(db, 1);
    await runMigrations(db, CUSTOM_CONTENT_DB_VERSION);
    const quest = await getQuest('q1');
    expect(quest.createdAt).toBeDefined();
    expect(quest.updatedAt).toBeDefined();
    const version = await getSchemaVersion();
    expect(version).toBe(CUSTOM_CONTENT_DB_VERSION);
    const errors = await validateDataIntegrity(db);
    expect(errors).toHaveLength(0);
  });

  test('detects invalid records during integrity check', async () => {
    const db = await openCustomContentDB();
    const tx = db.transaction('processes', 'readwrite');
    tx.objectStore('processes').put({ id: 'bad', duration: '1h' });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
    const errors = await validateDataIntegrity(db);
    expect(errors).toEqual([
      expect.objectContaining({ store: 'processes', id: 'bad' }),
    ]);
  });
});
