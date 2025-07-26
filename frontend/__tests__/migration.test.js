/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    openCustomContentDB,
    saveQuest,
    getQuest,
    getSchemaVersion,
    CUSTOM_CONTENT_DB_VERSION,
} from '../src/utils/indexeddb.js';
import { setSchemaVersion, runMigrations } from '../src/utils/migrations.js';

describe('data migration system', () => {
    test('adds createdAt field and bumps version', async () => {
        const db = await openCustomContentDB();
        await saveQuest({ id: 'q1', title: 'Old Quest', description: 'Legacy' });
        await setSchemaVersion(db, 1);
        await runMigrations(db, CUSTOM_CONTENT_DB_VERSION);
        const quest = await getQuest('q1');
        expect(quest.createdAt).toBeDefined();
        const version = await getSchemaVersion();
        expect(version).toBe(CUSTOM_CONTENT_DB_VERSION);
    });
});
