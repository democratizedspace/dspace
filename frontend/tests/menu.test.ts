import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import menu from '../src/config/menu.json';

describe('Menu component', () => {
    it('does not include stray trailing character in unpinned template', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/Menu.svelte'),
            'utf8'
        );
        expect(content.includes('{item.name}f')).toBe(false);
    });

    it('exposes Processes under the More menu list', () => {
        const processesItem = menu.find((item) => item.href === '/processes');
        expect(processesItem).toBeDefined();
        expect(processesItem?.pinned).not.toBe(true);
    });
});
