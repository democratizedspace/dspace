import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const thisDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(thisDir, '..');
const configPath = join(frontendDir, 'playwright.config.ts');

describe('playwright.config.ts', () => {
    it('defaults the baseURL to 127.0.0.1 to avoid IPv6-only localhost resolution', () => {
        const source = readFileSync(configPath, 'utf-8');

        expect(source).toContain('127.0.0.1:${port}');
        expect(source).not.toContain('://localhost:${port}');
    });
});
