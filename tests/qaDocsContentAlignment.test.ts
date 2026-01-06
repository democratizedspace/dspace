import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportGameStateString } from '../frontend/src/utils/gameState/common.js';
import { exportCustomContentString } from '../frontend/src/utils/customcontent.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const readDoc = (relativePath: string) =>
    readFileSync(resolve(currentDir, relativePath), 'utf8');

const decodeBase64Json = (value: string) => {
    const buffer = Buffer.from(value, 'base64');
    return JSON.parse(buffer.toString('utf8'));
};

describe('processes doc alignment', () => {
    it('explains requires/consumes/creates semantics and duration normalization', () => {
        const doc = readDoc('../frontend/src/pages/docs/md/processes.md');

        expect(doc).toMatch(/Requires list[^]*not consumed/i);
        expect(doc).toMatch(/Consumes list[^]*removed[^]*process (?:is )?started/i);
        expect(doc).toMatch(/cancel[^]*items (?:will be )?returned/i);
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

describe('backups doc alignment', () => {
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

        const originalBtoa = globalThis.btoa;
        const originalAtob = globalThis.atob;
        globalThis.btoa =
            globalThis.btoa ||
            ((value: string) => Buffer.from(value, 'utf8').toString('base64'));
        globalThis.atob =
            globalThis.atob ||
            ((value: string) => Buffer.from(value, 'base64').toString('utf8'));

        const customExport = await exportCustomContentString();
        const decodedCustom = decodeBase64Json(customExport);
        expect(decodedCustom).toMatchObject({
            items: expect.any(Array),
            processes: expect.any(Array),
            quests: expect.any(Array),
        });

        globalThis.btoa = originalBtoa;
        globalThis.atob = originalAtob;

        expect(doc).toMatch(/Base64-encoded JSON snapshot/i);
        expect(doc).toMatch(/quest progress, inventory, and processes/i);
        expect(doc).toMatch(/items, quests, and processes/i);
    });
});
