import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureAstroBuild } from '../frontend/scripts/ensure-astro-build.mjs';

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-astro-build-retry-'));

describe('ensureAstroBuild retry behavior', () => {
    const originalQuestGraphDebugFlag = process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG;
    let tempDir: string;
    let logger: { log: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        tempDir = createTempDir();
        logger = {
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };
    });

    afterEach(() => {
        if (originalQuestGraphDebugFlag === undefined) {
            delete process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG;
        } else {
            process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG = originalQuestGraphDebugFlag;
        }

        vi.restoreAllMocks();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('skips rebuild when artifacts exist and debug flag is not explicitly requested', () => {
        delete process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG;

        const serverDir = path.join(tempDir, 'dist', 'server');
        const clientDir = path.join(tempDir, 'dist', 'client', '_astro');
        fs.mkdirSync(serverDir, { recursive: true });
        fs.mkdirSync(clientDir, { recursive: true });
        fs.writeFileSync(path.join(serverDir, 'entry.mjs'), 'export default {};');
        fs.writeFileSync(path.join(clientDir, 'asset.js'), 'console.log(1);');

        const execSpy = vi.fn();

        ensureAstroBuild({ root: tempDir, exec: execSpy, logger });

        expect(execSpy).not.toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith('Astro build artifacts detected. Skipping rebuild.');
    });

    it('rebuilds when debug flag is explicitly true and marker is false', () => {
        process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG = 'true';

        const serverDir = path.join(tempDir, 'dist', 'server');
        const clientDir = path.join(tempDir, 'dist', 'client', '_astro');
        fs.mkdirSync(serverDir, { recursive: true });
        fs.mkdirSync(clientDir, { recursive: true });
        fs.writeFileSync(path.join(serverDir, 'entry.mjs'), 'export default {};');
        fs.writeFileSync(path.join(clientDir, 'asset.js'), 'console.log(1);');
        fs.writeFileSync(path.join(tempDir, 'dist', '.quest-graph-debug-flag'), 'false');

        const execSpy = vi.fn();

        ensureAstroBuild({ root: tempDir, exec: execSpy, logger });

        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(logger.log).toHaveBeenCalledWith(
            'Quest graph debug flag mismatch detected. Rebuilding Astro app...'
        );
    });

    it('cleans dist/ once and retries once when first build failure contains ENOENT', () => {
        const retryableError = new Error('Command failed: npm run build') as Error & { stderr?: Buffer };
        retryableError.stderr = Buffer.from('ENOENT: no such file or directory, open dist/client/_astro/x');
        const execSpy = vi
            .fn()
            .mockImplementationOnce(() => {
                throw retryableError;
            })
            .mockImplementationOnce(() => undefined);
        const rmSpy = vi.spyOn(fs, 'rmSync');

        ensureAstroBuild({ root: tempDir, exec: execSpy, logger });

        expect(execSpy).toHaveBeenCalledTimes(2);
        expect(rmSpy).toHaveBeenCalledTimes(1);
        expect(rmSpy).toHaveBeenCalledWith(path.join(tempDir, 'dist'), {
            recursive: true,
            force: true,
        });
    });

    it('does not retry when build failure is non-ENOENT', () => {
        const nonRetryableError = new Error('Command failed: npm run build') as Error & { stderr?: Buffer };
        nonRetryableError.stderr = Buffer.from('TypeError: Cannot read properties of undefined');
        const execSpy = vi.fn().mockImplementation(() => {
            throw nonRetryableError;
        });
        const rmSpy = vi.spyOn(fs, 'rmSync');

        expect(() => ensureAstroBuild({ root: tempDir, exec: execSpy, logger })).toThrow(nonRetryableError);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(rmSpy).not.toHaveBeenCalled();
    });
});
