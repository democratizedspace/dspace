import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  findFallbackChromiumExecutable,
  sanitizeProxyEnv,
} from '../frontend/scripts/utils/ensure-playwright-browsers.js';

describe('ensure-playwright-browsers fallback executable discovery', () => {
  it('returns newest cached chromium executable when browser cache exists', () => {
    const mockFs = {
      readdirSync: () => [
        { isDirectory: () => true, name: 'chromium-1181' },
        { isDirectory: () => true, name: 'chromium-1194' },
        { isDirectory: () => true, name: 'ffmpeg-1011' },
      ],
      existsSync: (candidatePath: string) =>
        candidatePath.includes(
          path.join('chromium-1194', 'chrome-linux', 'chrome')
        ),
    };

    const executablePath = findFallbackChromiumExecutable({
      env: {},
      fs: mockFs,
      platform: 'linux',
      homeDir: '/tmp/home',
    });

    expect(executablePath).toContain(
      path.join('chromium-1194', 'chrome-linux', 'chrome')
    );
  });

  it('returns empty string when cache directory cannot be read', () => {
    const executablePath = findFallbackChromiumExecutable({
      env: {},
      fs: {
        readdirSync: () => {
          throw new Error('no cache dir');
        },
        existsSync: () => false,
      },
    });

    expect(executablePath).toBe('');
  });

  it('keeps non-placeholder proxy environment variables during sanitization', () => {
    const sanitized = sanitizeProxyEnv({
      HTTP_PROXY: 'http://realproxy:8081',
      HTTPS_PROXY: 'https://corp-proxy:8443',
    });

    expect(sanitized.HTTP_PROXY).toBe('http://realproxy:8081');
    expect(sanitized.HTTPS_PROXY).toBe('https://corp-proxy:8443');
  });
});
