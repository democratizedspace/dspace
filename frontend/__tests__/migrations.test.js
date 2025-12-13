/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

const itemValidator = vi.fn(() => ({ valid: true, errors: [] }));
const processValidator = vi.fn(() => ({ valid: true, errors: [] }));
const questValidator = vi.fn(() => ({ valid: true, errors: [] }));

vi.mock('../src/utils/customItemValidation.js', () => ({
    validateItemData: itemValidator,
}));
vi.mock('../src/utils/customProcessValidation.js', () => ({
    validateProcessData: processValidator,
}));
vi.mock('../src/utils/customQuestValidation.js', () => ({
    validateQuestData: questValidator,
}));

const { runMigrations, getCurrentSchemaVersion } = await import('../src/utils/migrations.js');

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('test-migrations', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore('meta');
            ['items', 'processes', 'quests'].forEach((name) => {
                const store = db.createObjectStore(name, { keyPath: 'id' });
                store.add({ id: '1' });
            });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getRecord(db, store, id) {
    const tx = db.transaction(store, 'readonly');
    const obj = tx.objectStore(store);
    const req = obj.get(id);
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

describe('migrations.runMigrations', () => {
    let db;
    beforeEach(async () => {
        indexedDB.deleteDatabase('test-migrations');
        db = await openDb();
    });
    afterEach(() => {
        db.close();
    });

    test('applies migrations and updates schema', async () => {
        await runMigrations(db, 3);
        const record = await getRecord(db, 'items', '1');
        expect(record.createdAt).toBeTruthy();
        expect(record.updatedAt).toBeTruthy();
        const version = await getCurrentSchemaVersion(db);
        expect(version).toBe(3);
    });

    test('throws when validation fails', async () => {
        itemValidator.mockReturnValueOnce({ valid: false, errors: ['invalid'] });
        await expect(runMigrations(db, 3)).rejects.toThrow('Data integrity validation failed');
    });
});
