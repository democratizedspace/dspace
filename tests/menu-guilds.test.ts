import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

describe('Guilds menu entry', () => {
    it('is treated as an available destination', () => {
        const guilds = menu.find((item) => item.name === 'Guilds');

        expect(guilds).toBeDefined();
        expect(guilds?.comingSoon).not.toBe(true);
        expect(guilds?.href).toBe('/guilds');
    });
});

describe('Guilds page', () => {
    const pagePath = join(__dirname, '../frontend/src/pages/guilds.astro');

    it('exists so the navigation link resolves', () => {
        expect(existsSync(pagePath)).toBe(true);

        const content = readFileSync(pagePath, 'utf8');
        expect(content).toMatch(/<Page title="Guilds"/);
    });
});
