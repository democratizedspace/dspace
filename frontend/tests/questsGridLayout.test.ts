import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const questsComponentPath = path.resolve(
    process.cwd(),
    'frontend/src/pages/quests/svelte/Quests.svelte'
);

const componentSource = fs.readFileSync(questsComponentPath, 'utf8');

describe('Quests grid layout styles', () => {
    it('centers partially-filled rows on wider screens', () => {
        expect(componentSource).toMatch(/\.quests-grid\s*\{[\s\S]*justify-content:\s*center;/);
        expect(componentSource).toMatch(
            /\.quests-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(400px,\s*400px\)\);/
        );
    });

    it('keeps the mobile layout as a single full-width column', () => {
        expect(componentSource).toMatch(
            /@media only screen and \(max-width: 640px\)\s*\{[\s\S]*\.quests-grid\s*\{[\s\S]*grid-template-columns:\s*1fr;/
        );
        expect(componentSource).toMatch(
            /@media only screen and \(max-width: 640px\)\s*\{[\s\S]*\.quests-grid\s*\{[\s\S]*justify-content:\s*stretch;/
        );
    });
});
