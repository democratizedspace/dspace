import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('service worker caching contract', () => {
    it('keeps config.json available offline without pinning stale flags', () => {
        const serviceWorkerPath = path.resolve(
            __dirname,
            '../frontend/public/service-worker.js'
        );
        const content = readFileSync(serviceWorkerPath, 'utf8');

        const precacheMatch = content.match(/const PRECACHE_URLS = \[(?<entries>[\s\S]*?)\];/);
        expect(precacheMatch?.groups?.entries).toBeTruthy();

        const entries = precacheMatch!.groups!.entries
            .split(',')
            .map((entry) => entry.replace(/['"`]/g, '').trim())
            .filter(Boolean);

        expect(entries).not.toContain('/config.json');
        expect(content).toContain("const CONFIG_PATH = '/config.json';");
        expect(content).toMatch(/function prewarmConfigCache\(\)/);
        expect(content).toMatch(/\.then\(\(\) => prewarmConfigCache\(\)\)/);
        expect(content).toMatch(
            /if \(url\.pathname === CONFIG_PATH\) {\s*event\.respondWith\(handleConfigFetch\(request\)\)/
        );
        expect(content).toContain('const ASSET_MATCHERS');
        expect(content).toContain('retainRecentCaches');
    });
});
