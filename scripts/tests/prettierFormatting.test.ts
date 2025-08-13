import { describe, test } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Prettier formatting', () => {
  test('frontend sources are formatted', () => {
    const frontendDir = path.join(__dirname, '../../frontend');
    execSync('npm run format:check', {
      cwd: frontendDir,
      stdio: 'inherit',
    });
  }, 60000);
});
