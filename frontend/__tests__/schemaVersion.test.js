/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    openCustomContentDB,
    getSchemaVersion,
    CUSTOM_CONTENT_DB_VERSION,
} from '../src/utils/indexeddb.js';

describe('Custom content DB schema version', () => {
    test('returns current schema version', async () => {
        const db = await openCustomContentDB();
        expect(db.version).toBe(CUSTOM_CONTENT_DB_VERSION);
        const version = await getSchemaVersion();
        expect(version).toBe(CUSTOM_CONTENT_DB_VERSION);
    });
});
