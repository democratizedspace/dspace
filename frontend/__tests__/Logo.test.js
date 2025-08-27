/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const logoFile = path.join(__dirname, '../src/components/Logo.astro');

describe('Logo.astro', () => {
    it('includes descriptive alt text', () => {
        const content = fs.readFileSync(logoFile, 'utf8');
        expect(content).toMatch(/alt="[^"]*rocket[^"]*"/i);
    });

    it('uses clamp for responsive sizing', () => {
        const content = fs.readFileSync(logoFile, 'utf8');
        expect(content).toMatch(/width: clamp\(4rem, 20vw, 8rem\);/);
        expect(content).toMatch(/height: auto;/);
    });
});
