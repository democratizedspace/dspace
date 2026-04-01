/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const energyFile = path.join(__dirname, '../src/pages/energy/index.astro');

describe('energy/index.astro', () => {
    it('all images include descriptive alt text', () => {
        const content = fs.readFileSync(energyFile, 'utf8');
        const imgTags = content.match(/<img[^>]*>/g) || [];
        expect(imgTags.length).toBeGreaterThan(0);
        imgTags.forEach((tag) => {
            expect(tag).toMatch(/alt="[^"]+"/);
        });
    });

    it('uses responsive image sizing', () => {
        const content = fs.readFileSync(energyFile, 'utf8');
        expect(content).toMatch(/max-width: 50px/);
        expect(content).toMatch(/width: 100%/);
    });
});
