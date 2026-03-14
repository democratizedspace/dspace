import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('quests page grid layout', () => {
    it('centers partial rows on wide screens and keeps single-column mobile layout', () => {
        const componentPath = join(
            process.cwd(),
            'frontend/src/pages/quests/svelte/Quests.svelte'
        );
        const source = readFileSync(componentPath, 'utf8');

        expect(source).toContain(
            'grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 400px));'
        );
        expect(source).toContain('justify-content: center;');

        expect(source).toContain('@media only screen and (max-width: 640px)');
        expect(source).toContain('grid-template-columns: 1fr;');
    });
});
