/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from '@jest/globals';

const indexFile = path.join(__dirname, '../src/pages/index.astro');

describe('index.astro', () => {
    it('includes hydration script and UIResponsiveness component', () => {
        const content = fs.readFileSync(indexFile, 'utf8');
        expect(content).toMatch(/window\.dspaceStart = performance\.now\(\)/);
        expect(content).toMatch(/<UIResponsiveness client:load \/>/);
    });

    it('includes the FailoverStatus component', () => {
        const content = fs.readFileSync(indexFile, 'utf8');
        expect(content).toMatch(/<FailoverStatus client:load \/>/);
    });
});
