import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('offline service worker integration', () => {
    const repoRoot = process.cwd();

    it('registers the service worker in the global layout', () => {
        const layoutPath = join(repoRoot, 'frontend', 'src', 'layouts', 'Layout.astro');
        const contents = readFileSync(layoutPath, 'utf8');

        expect(contents).toMatch(/navigator\.serviceWorker\.register\(['"]\/service-worker\.js['"]\)/);
    });

    it('imports the cache version script and references versioned caches', () => {
        const swPath = join(repoRoot, 'frontend', 'public', 'service-worker.js');
        const contents = readFileSync(swPath, 'utf8');

        expect(contents).toMatch(/importScripts\(['"]\/cache-version\.js['"]\)/);
        expect(contents).toMatch(/const PRECACHE_PREFIX\s*=\s*'dspace-precache-v';/);
        expect(contents).toMatch(/const RUNTIME_PREFIX\s*=\s*'dspace-runtime-v';/);
    });

    it('persists the cache version in localStorage for mismatch detection', () => {
        const layoutPath = join(repoRoot, 'frontend', 'src', 'layouts', 'Layout.astro');
        const contents = readFileSync(layoutPath, 'utf8');

        expect(contents).toMatch(/dspace-cache-version/);
        expect(contents).toMatch(/localStorage\.setItem\s*\(/);
        expect(contents).toMatch(/CACHE_VERSION/);
        expect(contents).toMatch(/cache-version\.js/);
    });
});
