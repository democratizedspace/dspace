import { execFileSync } from 'node:child_process';
import { it } from 'vitest';

it('passes the standalone published-image verifier contracts without Docker', () => {
  execFileSync(
    process.execPath,
    ['--test', 'scripts/test-verify-published-image.mjs'],
    {
      stdio: 'inherit',
      timeout: 30000,
    }
  );
});
