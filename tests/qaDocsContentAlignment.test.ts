import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportGameStateString } from '../frontend/src/utils/gameState/common.js';
import { buildCustomContentBackupData } from '../frontend/src/utils/customContentBackup.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const readDoc = (relativePath: string) =>
    readFileSync(resolve(currentDir, relativePath), 'utf8');

const decodeBase64Json = (value: string) => {
    const buffer = Buffer.from(value, 'base64');
    return JSON.parse(buffer.toString('utf8'));
};

async function clearCustomContentDatabase(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onblocked = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Failed to clear IndexedDB'));
    });
}

describe('processes doc alignment', () => {
    it('explains requires/consumes/creates semantics and duration normalization', () => {
        const doc = readDoc('../frontend/src/pages/docs/md/processes.md');

        expect(doc).toMatch(/Requires list[^]*not consumed/i);
        expect(doc).toMatch(/Consumes list[\s\S]*?removed[\s\S]*?process (?:is )?started/i);
        expect(doc).toMatch(/cancel[^]*items[^]*returned/i);
        expect(doc).toMatch(/Creates list[^]*added[^]*completion/i);
        expect(doc).toMatch(/normalizes input like[\s\S]*0\.5h 30s[\s\S]*30m 30s/i);
    });
});

describe('cloud sync doc alignment', () => {
    it('calls out gist token scope, storage, and clearing paths', () => {
        const doc = readDoc('../frontend/src/pages/docs/md/cloud-sync.md');

        expect(doc).toMatch(/personal access token[^]*`gist` scope/i);
        expect(doc).toMatch(/Gist ID/i);
        expect(doc).toMatch(/IndexedDB/i);
        expect(doc).toMatch(/Settings[^]*Remove them/i);
        expect(doc).toMatch(/Custom quests, items, and processes/i);
    });
});

describe('authentication doc alignment', () => {
    it('lists required scopes and token storage UX', () => {
        const doc = readDoc('../frontend/src/pages/docs/md/authentication.md');

        expect(doc).toMatch(/`repo`/i);
        expect(doc).toMatch(/`gist`/i);
        expect(doc).toMatch(/IndexedDB/i);
        expect(doc).toMatch(/gameState\.github\.token/i);
        expect(doc).toMatch(/Clear/i);
        expect(doc).toMatch(/Log out/i);
    });
});

describe('token.place doc alignment', () => {
    it('matches default endpoint and opt-in guidance', () => {
        const doc = readDoc('../frontend/src/pages/docs/md/token-place.md');

        expect(doc).toMatch(/https:\/\/token\.place\/api/);
        expect(doc).toMatch(/disabled by default/i);
        expect(doc).toMatch(/OpenAI/i);
        expect(doc).toMatch(/VITE_TOKEN_PLACE_ENABLED/i);
        expect(doc).toMatch(/VITE_TOKEN_PLACE_URL/i);
    });
});

describe('backups doc alignment', () => {
    beforeEach(async () => {
        await clearCustomContentDatabase();
    });

    afterEach(async () => {
        await clearCustomContentDatabase();
    });

    it('matches the documented export formats for saves and custom content', async () => {
        const doc = readDoc('../frontend/src/pages/docs/md/backups.md');

        const baseState = {
            quests: { q1: { finished: true } },
            inventory: { i1: 2 },
            processes: { p1: { status: 'in_progress' } },
            settings: { theme: 'dark' },
            _meta: { lastUpdated: 0 },
        };
        const encodedSave = exportGameStateString({
            stateOverride: baseState,
            providerHint: 'test',
        });
        const decodedEnvelope = decodeBase64Json(encodedSave);
        expect(decodedEnvelope.payload).toMatchObject({
            quests: baseState.quests,
            inventory: baseState.inventory,
            processes: baseState.processes,
        });

        const customBackup = await buildCustomContentBackupData();
        expect(customBackup).toMatchObject({
            schemaVersion: expect.any(Number),
            timestamp: expect.any(String),
            items: expect.any(Array),
            processes: expect.any(Array),
            quests: expect.any(Array),
            images: expect.any(Array),
        });

        expect(doc).toMatch(/Base64-encoded JSON backup envelope/i);
        expect(doc).toMatch(/quest progress, inventory, and processes/i);
        expect(doc).toMatch(/Copy/i);
        expect(doc).toMatch(/Import/i);
        expect(doc).toMatch(/Prepare backup/i);
        expect(doc).toMatch(/Download backup/i);
        expect(doc).toMatch(/Choose backup file/i);
    });
});
