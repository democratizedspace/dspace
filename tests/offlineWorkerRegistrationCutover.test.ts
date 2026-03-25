import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('offline worker registration cutover guardrails', () => {
    it('registers the worker through a cache-versioned URL helper', () => {
        const scriptPath = path.resolve(
            __dirname,
            '../frontend/public/scripts/offlineWorkerRegistration.js'
        );
        const content = readFileSync(scriptPath, 'utf8');

        expect(content).toMatch(/const resolveServiceWorkerUrl = \(\) => {/);
        expect(content).toContain("const cacheVersionKey = 'dspace-cache-version';");
        expect(content).toMatch(/register\(resolveServiceWorkerUrl\(\)\)/);
        expect(content).toContain('return `${baseUrl}?v=${encodeURIComponent(cacheVersion)}`;');
    });
});
