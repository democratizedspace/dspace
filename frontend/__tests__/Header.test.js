/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from '@jest/globals';

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

    it('provides a skip link for accessibility', () => {
        const content = fs.readFileSync(headerFile, 'utf8');
        expect(content).toMatch(/<a href="#main" class="skip-link">Skip to main content<\/a>/);
    });

    it('pins header actions to the top-right corner without layout collisions', () => {
        const content = fs.readFileSync(headerFile, 'utf8');
        expect(content).toMatch(/\.header {\n\s*position: relative;/);
        expect(content).toMatch(/\.header-inner {\n\s*display: grid;\n[\s\S]*position: relative;/);
        expect(content).toMatch(
            /\.header-actions {\n\s*position: absolute;\n\s*top: 0\.35rem;\n\s*right: clamp\(0\.65rem, 3vw, 1\.5rem\);/
        );
    });
});
