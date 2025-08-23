/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const headerFile = path.join(__dirname, '../src/components/Header.astro');

describe('Header.astro', () => {
    it('has a home link with an accessible label', () => {
        const content = fs.readFileSync(headerFile, 'utf8');
        expect(content).toMatch(/<a href="\/" aria-label="Home">/);
    });

    it('uses responsive font sizing', () => {
        const content = fs.readFileSync(headerFile, 'utf8');
        expect(content).toMatch(/font-size: clamp\(1.5rem, 5vw, 2em\);/);
    });
});
