/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const cardFile = path.join(__dirname, '../src/components/Card.astro');

describe('Card.astro', () => {
    it('provides alt text for card images', () => {
        const content = fs.readFileSync(cardFile, 'utf8');
        expect(content).toMatch(/<img src={image} class="img" alt={title} \/>/);
    });

    it('uses responsive image sizing', () => {
        const content = fs.readFileSync(cardFile, 'utf8');
        expect(content).toMatch(/\.img {\n\s+width: 100%;\n}/);
    });
});
