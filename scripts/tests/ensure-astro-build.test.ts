import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureAstroBuild } from '../../frontend/scripts/ensure-astro-build.mjs';

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'astro-build-test-'));

describe('ensureAstroBuild', () => {
    let tempDir: string;
    let execSpy: ReturnType<typeof vi.fn>;
    let logger: { log: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        tempDir = createTempDir();
        execSpy = vi.fn();
        logger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        };

        const serverDir = path.join(tempDir, 'dist', 'server');
        fs.mkdirSync(serverDir, { recursive: true });
        fs.writeFileSync(path.join(serverDir, 'entry.mjs'), '');
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('rebuilds when client assets directory is missing', () => {
        ensureAstroBuild({ root: tempDir, exec: execSpy, logger });

        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(execSpy.mock.calls[0][0]).toBe('npm run build');
    });

    it('skips rebuild when both server and client assets are present', () => {
        const clientAssetsDir = path.join(tempDir, 'dist', 'client', '_astro');
        fs.mkdirSync(clientAssetsDir, { recursive: true });
        fs.writeFileSync(path.join(clientAssetsDir, 'placeholder.js'), '');

        ensureAstroBuild({ root: tempDir, exec: execSpy, logger });

        expect(execSpy).not.toHaveBeenCalled();
    });
});
