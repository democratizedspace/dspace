import { describe, test } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Prettier formatting', () => {
  test('frontend sources are formatted', () => {
    const frontendDir = path.join(__dirname, '../../frontend');
    execSync('npx prettier --check "src/**/*.{md,json}"', {
      cwd: frontendDir,
      stdio: 'inherit',
    });
  });
});
