import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const childProcess = require('child_process');
const osModule = require('os');
const detectZeroTests = require('../scripts/utils/detect-zero-tests');
const { runTests } = require('../run-tests.js');
const execSyncMock = vi.spyOn(childProcess, 'execSync');
const platformMock = vi.spyOn(osModule, 'platform').mockReturnValue('linux');
const hasZeroTestsMock = vi.spyOn(detectZeroTests, 'hasZeroTests').mockReturnValue(false);

describe('run-tests.js', () => {
    beforeEach(() => {
        execSyncMock.mockReset();
        hasZeroTestsMock.mockReset();
        hasZeroTestsMock.mockReturnValue(false);
        platformMock.mockReturnValue('linux');
        delete process.env.CI_COVERAGE_DONE;
    });

    afterEach(() => {
        delete process.env.CI_COVERAGE_DONE;
    });

    it('runs root, hardening, docs rag, and prepare scripts with expected arguments', () => {
        execSyncMock.mockReturnValueOnce('Test Files 1 (1)\nTests 1 (1)\n');
        execSyncMock.mockReturnValue('');

        const code = runTests(execSyncMock, osModule.platform());

        expect(code).toBe(0);
        expect(execSyncMock).toHaveBeenNthCalledWith(
            1,
            'npm run test:root',
            expect.objectContaining({ encoding: 'utf-8', stdio: 'pipe' })
        );
        expect(execSyncMock).toHaveBeenNthCalledWith(
            2,
            'npm run hardening:validate',
            expect.objectContaining({ stdio: 'inherit' })
        );
        expect(execSyncMock).toHaveBeenNthCalledWith(
            3,
            'npm run test:docs-rag',
            expect.objectContaining({ stdio: 'inherit' })
        );
        expect(execSyncMock).toHaveBeenNthCalledWith(
            4,
            'bash ./frontend/scripts/prepare-pr.sh',
            expect.objectContaining({
                stdio: 'inherit',
                env: expect.objectContaining({ SKIP_UNIT_TESTS: '1' }),
            })
        );
    });

    it('skips root tests when coverage is already generated', () => {
        process.env.CI_COVERAGE_DONE = '1';
        execSyncMock.mockReturnValue('');

        const code = runTests(execSyncMock, osModule.platform());

        expect(code).toBe(0);
        expect(execSyncMock).toHaveBeenCalledTimes(3);
        expect(execSyncMock).toHaveBeenNthCalledWith(
            1,
            'npm run hardening:validate',
            expect.objectContaining({ stdio: 'inherit' })
        );
        expect(execSyncMock).toHaveBeenNthCalledWith(
            2,
            'npm run test:docs-rag',
            expect.objectContaining({ stdio: 'inherit' })
        );
        expect(execSyncMock).toHaveBeenNthCalledWith(
            3,
            'bash ./frontend/scripts/prepare-pr.sh',
            expect.objectContaining({
                env: expect.objectContaining({ SKIP_UNIT_TESTS: '1' }),
            })
        );
    });
});
