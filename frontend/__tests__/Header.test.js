/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const headerFile = path.join(__dirname, '../src/components/Header.astro');

describe('Header.astro', () => {
    it('respects prefers-reduced-motion for users', () => {
        const content = fs.readFileSync(headerFile, 'utf8');
        expect(content).toMatch(
            /@media \(prefers-reduced-motion: reduce\) {\n\s*\.text-gradient {\n\s*animation: none;/
        );
    });

    it('limits text gradient width responsively', () => {
        const content = fs.readFileSync(headerFile, 'utf8');
        expect(content).toMatch(/max-width: 100%;/);
    });
});
