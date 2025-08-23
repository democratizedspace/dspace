/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const componentFile = path.join(__dirname, '../src/components/GrowableImage.astro');

describe('GrowableImage.astro', () => {
    it('provides alt text for accessibility', () => {
        const content = fs.readFileSync(componentFile, 'utf8');
        expect(content).toMatch(/alt=\{alt \?\? ''\}/);
    });

    it('scales responsively', () => {
        const content = fs.readFileSync(componentFile, 'utf8');
        expect(content).toMatch(/max-width: 100%;/);
        expect(content).toMatch(/height: auto;/);
    });
});
