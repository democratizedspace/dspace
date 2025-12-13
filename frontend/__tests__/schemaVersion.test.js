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

    test('defaults to latest version when meta entry is missing', async () => {
        const db = await openCustomContentDB();
        const tx = db.transaction('meta', 'readwrite');
        tx.objectStore('meta').delete('schemaVersion');
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            /* istanbul ignore next */
            tx.onerror = (e) => reject(e.target.error);
        });
        const version = await getSchemaVersion();
        expect(version).toBe(CUSTOM_CONTENT_DB_VERSION);
    });
});
