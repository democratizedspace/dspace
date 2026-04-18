import { describe, test } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Prettier formatting', () => {
  test('frontend sources are formatted', () => {
    const frontendDir = path.join(__dirname, '../../frontend');
    try {
      execSync('npm run format:check', {
        cwd: frontendDir,
        maxBuffer: 200 * 1024 * 1024,
        stdio: 'pipe',
      });
    } catch (error) {
      const stdout = error?.stdout?.toString?.() ?? '';
      const stderr = error?.stderr?.toString?.() ?? '';
      throw new Error(`npm run format:check failed.\n${stdout}${stderr}`);
    }
  }, 240000);
});
