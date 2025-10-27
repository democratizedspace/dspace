import { beforeEach, describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import 'fake-indexeddb/auto';
import {
  openCustomContentDB,
  saveQuest,
  getQuest,
  getQuests,
  getItems,
  getProcesses,
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

  test('migrates the v1 basic save-data fixture without data loss', async () => {
    const fixturePath = join(
      process.cwd(),
      'tests',
      'fixtures',
      'save-data',
      'v1-basic.json'
    );
    const raw = readFileSync(fixturePath, 'utf8');
    const fixture = JSON.parse(raw);

    await seedLegacyDatabase(fixture);

    let migratedDb;
    try {
      migratedDb = await openCustomContentDB();
    } catch (error) {
      const inspectDb = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('CustomContent', CUSTOM_CONTENT_DB_VERSION);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (event) => {
          const target = event.target as IDBOpenDBRequest | null;
          reject(target?.error ?? event);
        };
      });
      const integrityErrors = await validateDataIntegrity(inspectDb);
      console.error('Migration integrity errors', integrityErrors);
      inspectDb.close();
      throw error;
    }

    const errors = await validateDataIntegrity(migratedDb);
    expect(errors).toHaveLength(0);

    const [quest] = await getQuests();
    expect(quest).toMatchObject({
      id: 'legacy/offline-orientation',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const [item] = await getItems();
    expect(item).toMatchObject({
      id: 'legacy-item',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const [legacyProcess] = await getProcesses();
    expect(legacyProcess).toMatchObject({
      id: 'legacy-process',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const schemaVersion = await getSchemaVersion();
    expect(schemaVersion).toBe(CUSTOM_CONTENT_DB_VERSION);

    migratedDb.close();
  });
});

async function seedLegacyDatabase(fixture) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CustomContent', CUSTOM_CONTENT_DB_VERSION);
    let seeded = false;

    const fail = (event: Event) => {
      const target = event.target as IDBOpenDBRequest | IDBTransaction | null;
      reject(target?.error ?? event);
    };

    const seed = (db: IDBDatabase) => {
      if (seeded) {
        return;
      }
      seeded = true;

      const tx = db.transaction(['meta', 'items', 'processes', 'quests'], 'readwrite');
      const meta = tx.objectStore('meta');
      const items = tx.objectStore('items');
      const processes = tx.objectStore('processes');
      const quests = tx.objectStore('quests');

      meta.put(fixture.meta?.schemaVersion ?? 1, 'schemaVersion');

      items.clear();
      for (const record of fixture.items ?? []) {
        items.put(record);
      }

      processes.clear();
      for (const record of fixture.processes ?? []) {
        processes.put(record);
      }

      quests.clear();
      for (const record of fixture.quests ?? []) {
        quests.put(record);
      }

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = fail;
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('processes')) {
        db.createObjectStore('processes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('quests')) {
        db.createObjectStore('quests', { keyPath: 'id' });
      }
      seed(db);
    };

    request.onsuccess = () => {
      const db = request.result;
      seed(db);
    };

    request.onerror = fail;
  });
}
