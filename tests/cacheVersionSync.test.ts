import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function loadCacheVersion() {
    const module = await import('../packages/cache-version/index.js');
    return module.CACHE_VERSION;
}

describe('cache version distribution', () => {
    it('keeps the public cache-version script aligned with the shared constant', async () => {
        const cacheVersion = await loadCacheVersion();
        const publicScriptPath = join(process.cwd(), 'frontend', 'public', 'cache-version.js');
        const contents = readFileSync(publicScriptPath, 'utf8');

        expect(contents).toContain(`'${cacheVersion}'`);
        expect(contents).toMatch(new RegExp(`CACHE_VERSION\\s*=\\s*['\"]${cacheVersion}['\"];?`));
    });
});
