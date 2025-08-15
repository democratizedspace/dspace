/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const layoutFile = path.join(__dirname, '../src/layouts/Layout.astro');

describe('Layout.astro', () => {
    it('uses mobile-friendly viewport', () => {
        const content = fs.readFileSync(layoutFile, 'utf8');
        expect(content).toMatch(
            /<meta name="viewport" content="width=device-width, initial-scale=1" \/>/
        );
    });
});
