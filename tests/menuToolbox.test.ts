import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

describe('Toolbox menu entry', () => {
    it('is treated as an available destination', () => {
        const toolbox = menu.find((item) => item.name === 'Toolbox');

        expect(toolbox).toBeDefined();
        expect(toolbox?.comingSoon).not.toBe(true);
        expect(toolbox?.href).toBe('/toolbox');
    });
});

describe('Toolbox page', () => {
    const pagePath = join(__dirname, '../frontend/src/pages/toolbox.astro');

    it('exists so the navigation link resolves', () => {
        expect(existsSync(pagePath)).toBe(true);

        const content = readFileSync(pagePath, 'utf8');
        expect(content).toMatch(/<Page title="Toolbox"/);
    });
});
