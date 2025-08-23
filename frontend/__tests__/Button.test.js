/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const buttonFile = path.join(__dirname, '../src/components/Button.astro');

describe('Button.astro', () => {
    it('supports aria-label for accessibility', () => {
        const content = fs.readFileSync(buttonFile, 'utf8');
        expect(content).toMatch(/aria-label={ariaLabel \?\? text}/);
    });

    it('uses responsive spacing units', () => {
        const content = fs.readFileSync(buttonFile, 'utf8');
        expect(content).toMatch(/padding: 0\.5rem 1rem;/);
        expect(content).toMatch(/margin: 0\.5rem;/);
    });
});
