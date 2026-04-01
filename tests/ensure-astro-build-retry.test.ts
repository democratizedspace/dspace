import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureAstroBuild } from '../frontend/scripts/ensure-astro-build.mjs';

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-astro-build-retry-'));

describe('ensureAstroBuild retry behavior', () => {
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
        vi.restoreAllMocks();
        fs.rmSync(tempDir, { recursive: true, force: true });
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
