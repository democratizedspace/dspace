import { describe, expect, test, vi } from 'vitest';

const { runTests } = require('../../run-tests');

describe('runTests', () => {
  test('fails when no root tests run', () => {
    const exec = vi.fn().mockReturnValue('No test files found, exiting with code 0');
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = runTests(exec, 'linux');
    expect(code).toBe(1);
    expect(exec).toHaveBeenCalledWith('npm run test:root', { encoding: 'utf-8', stdio: 'pipe' });
    expect(exec).toHaveBeenCalledTimes(1);
    write.mockRestore();
  });

  test('runs platform script when tests pass', () => {
    const exec = vi
      .fn()
      .mockReturnValueOnce('Test Files  1 passed\nTests  1 passed')
      .mockReturnValueOnce('');
    const code = runTests(exec, 'linux');
    expect(code).toBe(0);
    expect(exec).toHaveBeenNthCalledWith(
      2,
      'bash ./frontend/scripts/prepare-pr.sh',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({ SKIP_UNIT_TESTS: '1' })
      })
    );
  });
});
