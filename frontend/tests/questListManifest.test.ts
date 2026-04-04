import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(currentDir, '../src/generated/quests/listManifest.json');

describe('quest list manifest', () => {
    it('is deterministically ordered and normalized', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        expect(Array.isArray(manifest)).toBe(true);
        expect(manifest.length).toBeGreaterThan(100);

        for (let index = 1; index < manifest.length; index += 1) {
            const prev = manifest[index - 1];
            const next = manifest[index];
            const prevKey = `${prev.tree}/${prev.slug}`;
            const nextKey = `${next.tree}/${next.slug}`;
            expect(prevKey.localeCompare(nextKey)).toBeLessThanOrEqual(0);
            expect(Array.isArray(next.requiresQuests)).toBe(true);
        }
    });

    it('includes list-only fields and omits dialogue payloads', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const sample = manifest.find(
            (quest: { id: string }) => quest.id === 'welcome/howtodoquests'
        );
        expect(sample).toBeDefined();
        expect(sample).toMatchObject({
            id: 'welcome/howtodoquests',
            route: '/quests/welcome/howtodoquests',
            sourcePath: './json/welcome/howtodoquests.json',
        });
        expect(sample.dialogue).toBeUndefined();
        expect(sample.rewards).toBeUndefined();
    });
});
