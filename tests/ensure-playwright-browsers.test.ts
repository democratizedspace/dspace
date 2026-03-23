import { describe, it, expect, vi } from 'vitest';
import { ensurePlaywrightBrowsers } from '../frontend/scripts/utils/ensure-playwright-browsers.js';

describe('ensurePlaywrightBrowsers', () => {
  it('attempts linux system dependency installation before returning when chromium exists', async () => {
    const exec = vi.fn();
    const fs = {
      existsSync: vi.fn((path: string) => path.includes('cli.js')),
      writeFileSync: vi.fn(),
    };

    await ensurePlaywrightBrowsers({
      cwd: '/tmp',
      env: {},
      platform: 'linux',
      installSystemDeps: true,
      browser: {
        executablePath: () => '/bin/sh',
      },
      exec,
      fs,
      depsStampPath: '/tmp/dspace-playwright-deps-stamp',
    });

    expect(exec).toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining([expect.stringContaining('cli.js'), 'install-deps']),
      expect.objectContaining({ cwd: '/tmp' })
    );
    expect(exec).not.toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining([expect.stringContaining('cli.js'), 'install', 'chromium']),
      expect.any(Object)
    );
  });
});
