/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const compactCardFile = path.join(__dirname, '../src/components/CompactCard.astro');
const cardFile = path.join(__dirname, '../src/components/Card.astro');

describe('Card components accessibility', () => {
    it('CompactCard image includes alt text and responsive sizing', () => {
        const content = fs.readFileSync(compactCardFile, 'utf8');
        expect(content).toMatch(/<img src={image} alt={title} class="item-image" \/>/);
        expect(content).toMatch(/max-width: 100px;/);
        expect(content).toMatch(/height: auto;/);
    });

    it('Card image includes alt text and responsive sizing', () => {
        const content = fs.readFileSync(cardFile, 'utf8');
        expect(content).toMatch(/<img src={image} alt={title} class="img" \/>/);
        expect(content).toMatch(/\.img {\n\s+width: 100%;\n\s+height: auto;/);
    });
});
