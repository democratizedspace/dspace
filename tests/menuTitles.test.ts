import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';

describe('Menu titles entry', () => {
  it('treats Titles as an available destination', () => {
    const titles = menu.find((item) => item.name === 'Titles');

    expect(titles).toBeDefined();
    expect(titles?.comingSoon).not.toBe(true);
    expect(titles?.href).toBe('/titles');
  });
});
