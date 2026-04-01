import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TIMEOUT_MS,
  runPostinstall,
  shouldSkipHusky,
} from '../frontend/scripts/postinstall.js';

describe('frontend postinstall script', () => {
  it('skips husky installation when explicitly disabled', () => {
    const execMock = vi.fn();
    const result = runPostinstall({
      exec: execMock,
      env: { HUSKY: '0' },
      gitDir: '/repo/.git',
      fsExists: () => true,
      timeoutMs: 1234,
    });

    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith('npm run sync', {
      stdio: 'inherit',
      timeout: 1234,
    });
    expect(result).toBe(false);
  });

  it('installs husky when the git directory exists and no skip flag is set', () => {
    const execMock = vi.fn();
    const result = runPostinstall({
      exec: execMock,
      env: {},
      gitDir: '/repo/.git',
      fsExists: () => true,
    });

    expect(execMock).toHaveBeenNthCalledWith(1, 'npm run sync', {
      stdio: 'inherit',
      timeout: DEFAULT_TIMEOUT_MS,
    });
    expect(execMock).toHaveBeenNthCalledWith(2, 'npx husky install', {
      stdio: 'inherit',
      timeout: DEFAULT_TIMEOUT_MS,
    });
    expect(result).toBe(true);
  });

  it('skips husky when the git directory is missing', () => {
    const execMock = vi.fn();
    const result = runPostinstall({
      exec: execMock,
      env: {},
      gitDir: '/repo/.git',
      fsExists: () => false,
    });

    expect(execMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  it('detects skip conditions via shouldSkipHusky helper', () => {
    expect(
      shouldSkipHusky({
        env: { CI: 'true' },
        gitDir: '/repo/.git',
        fsExists: () => true,
      })
    ).toBe(true);
    expect(
      shouldSkipHusky({
        env: {},
        gitDir: '/repo/.git',
        fsExists: () => true,
      })
    ).toBe(false);
  });
});
