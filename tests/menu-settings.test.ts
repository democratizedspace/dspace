import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';

describe('Menu settings entry', () => {
    it('treats Settings as an available destination', () => {
        const settings = menu.find((item) => item.name === 'Settings');

        expect(settings).toBeDefined();
        expect(settings?.comingSoon).not.toBe(true);
        expect(settings?.href).toBe('/settings');
    });
});
