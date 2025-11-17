import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('service worker caching contract', () => {
    it('precaches config.json so offline boots retain feature flags', () => {
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

        expect(entries).toContain('/config.json');
    });
});
