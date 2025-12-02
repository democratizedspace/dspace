import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');

function loadFile(relativePath: string): string {
    const path = resolve(ROOT, relativePath);
    return readFileSync(path, 'utf-8');
}

describe('homepage SSR safety', () => {
    it('guards the homepage render path with structured error logging', () => {
        const indexAstro = loadFile('frontend/src/pages/index.astro');

        expect(indexAstro).toContain("message: 'Failed to render homepage'");
        expect(indexAstro).toContain('<Page columns="1">');
        expect(indexAstro).toContain('Something went wrong while loading the homepage.');
    });

    it('logs and falls back when changelog loading fails', () => {
        const whatsNew = loadFile('frontend/src/components/WhatsNew.astro');

        expect(whatsNew).toContain("message: 'Failed to load homepage changelog entries'");
        expect(whatsNew).toContain('Unable to load the latest updates right now.');
    });
});
