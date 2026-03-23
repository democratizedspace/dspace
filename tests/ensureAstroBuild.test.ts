import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ensureAstroBuild } from '../frontend/scripts/ensure-astro-build.mjs';

function makeTempRoot() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-astro-build-'));
}

function writeFile(filePath: string, contents = 'x') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ensureAstroBuild', () => {
    it('skips rebuild when Astro server assets live under dist/server/_astro', () => {
        const root = makeTempRoot();
        writeFile(path.join(root, 'dist', 'server', 'entry.mjs'));
        writeFile(path.join(root, 'dist', 'server', '_astro', 'chunk.js'));
        writeFile(path.join(root, 'dist', '.quest-graph-debug-flag'), 'false');

        const exec = vi.fn();

        ensureAstroBuild({ root, exec, logger: { log: vi.fn(), warn: vi.fn() } });

        expect(exec).not.toHaveBeenCalled();
    });

    it('rebuilds when no client assets are present', () => {
        const root = makeTempRoot();
        writeFile(path.join(root, 'dist', 'server', 'entry.mjs'));

        const exec = vi.fn();

        ensureAstroBuild({ root, exec, logger: { log: vi.fn(), warn: vi.fn() } });

        expect(exec).toHaveBeenCalledWith('npm run build', {
            cwd: root,
            stdio: 'inherit',
        });
    });
});
