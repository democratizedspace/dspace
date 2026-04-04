import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const manifestPath = path.join(process.cwd(), 'frontend/src/generated/quests/listManifest.json');

describe('quest list manifest', () => {
    it('is sorted deterministically and normalized', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const ids = manifest.map((entry: { id: string }) => entry.id);
        const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
        expect(ids).toEqual(sortedIds);

        for (const entry of manifest) {
            expect(entry).toHaveProperty('id');
            expect(entry).toHaveProperty('title');
            expect(entry).toHaveProperty('description');
            expect(entry).toHaveProperty('image');
            expect(Array.isArray(entry.requiresQuests)).toBe(true);
        }
    });

    it('does not include heavy dialogue payload fields', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        for (const entry of manifest) {
            expect(entry.dialogue).toBeUndefined();
            expect(entry.default).toBeUndefined();
            expect(entry.options).toBeUndefined();
        }
    });
});
