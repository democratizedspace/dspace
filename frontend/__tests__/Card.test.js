/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const cardFile = path.join(__dirname, '../src/components/Card.astro');

describe('Card.astro', () => {
    it('adds descriptive alt text to images', () => {
        const content = fs.readFileSync(cardFile, 'utf8');
        expect(content).toMatch(/alt={imageAlt ?? ''}/);
    });

    it('uses responsive image sizing', () => {
        const content = fs.readFileSync(cardFile, 'utf8');
        expect(content).toMatch(/height: auto;/);
    });
});
