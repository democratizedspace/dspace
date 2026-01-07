import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Page layout styling', () => {
    it('ensures main content uses border-box sizing and wrapping safeguards', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '../src/components/Page.astro'),
            'utf8'
        );

        expect(content).toContain('main *');
        expect(content).toContain('box-sizing: border-box');
        expect(content).toContain('overflow-wrap: anywhere');
    });
});
