import { afterEach, describe, expect, test, vi } from 'vitest';

const { runTests } = require('../../run-tests');

describe('runTests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SKIP_E2E;
  });

  test('fails when no root tests run', () => {
    const exec = vi
      .fn()
      .mockReturnValue('No test files found, exiting with code 0');
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const code = runTests(exec, 'linux');
    expect(code).toBe(1);
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('vitest.mjs run --config vitest.config.mts'),
      expect.objectContaining({
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 200 * 1024 * 1024,
      })
    );
    expect(exec).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
  });

  test('runs platform script when tests pass', () => {
    const exec = vi
      .fn()
      .mockReturnValueOnce('Test Files  1 passed\nTests  1 passed')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('');
    const code = runTests(exec, 'linux');
    expect(code).toBe(0);
    expect(exec).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('tests/questDialogueValidation.test.ts'),
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(exec).toHaveBeenNthCalledWith(
      3,
      'node frontend/scripts/validate-hardening.mjs',
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(exec).toHaveBeenNthCalledWith(
      4,
      'node scripts/test-docs-rag.mjs',
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(exec).toHaveBeenNthCalledWith(
      5,
      'bash ./frontend/scripts/prepare-pr.sh',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({ SKIP_UNIT_TESTS: '1' }),
      })
    );
    const preparePrCallEnv = exec.mock.calls[4][1].env;
    expect(preparePrCallEnv.SKIP_E2E).toBeUndefined();
  });

  test('forwards SKIP_E2E only when explicitly set', () => {
    process.env.SKIP_E2E = '1';
    const exec = vi
      .fn()
      .mockReturnValueOnce('Test Files  1 passed\nTests  1 passed')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('');

    const code = runTests(exec, 'linux');

    expect(code).toBe(0);
    expect(exec).toHaveBeenNthCalledWith(
      5,
      'bash ./frontend/scripts/prepare-pr.sh',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({ SKIP_UNIT_TESTS: '1', SKIP_E2E: '1' }),
      })
    );
  });
  test('retries once when vitest worker onTaskUpdate timeout occurs', () => {
    const timeoutError = Object.assign(new Error('first pass failed'), {
      stdout:
        'Errors 1 error\nError: [vitest-worker]: Timeout calling "onTaskUpdate"\n',
      stderr: '',
    });
    const exec = vi
      .fn()
      .mockImplementationOnce(() => {
        throw timeoutError;
      })
      .mockReturnValueOnce('Test Files  1 passed\nTests  1 passed')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('');
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    const code = runTests(exec, 'linux');

    expect(code).toBe(0);
    expect(exec).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('vitest.mjs run --config vitest.config.mts'),
      expect.objectContaining({
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 200 * 1024 * 1024,
      })
    );
    expect(exec).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('vitest.mjs run --config vitest.config.mts'),
      expect.objectContaining({
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 200 * 1024 * 1024,
      })
    );
    expect(write).toHaveBeenCalled();
  });

  test('fails when retry also fails after vitest worker onTaskUpdate timeout', () => {
    const timeoutError = Object.assign(new Error('first pass failed'), {
      stdout:
        'Errors 1 error\nError: [vitest-worker]: Timeout calling "onTaskUpdate"\n',
      stderr: '',
    });
    const retryError = Object.assign(new Error('retry also failed'), {
      stdout: 'Error: another failure\n',
      stderr: '',
    });
    const exec = vi
      .fn()
      .mockImplementationOnce(() => {
        throw timeoutError;
      })
      .mockImplementationOnce(() => {
        throw retryError;
      });
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const code = runTests(exec, 'linux');

    expect(code).toBe(1);
    expect(exec).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenCalledWith(timeoutError.stdout);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
  });
});
