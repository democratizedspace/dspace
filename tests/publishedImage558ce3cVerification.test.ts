import { execFileSync } from 'node:child_process';
import { it } from 'vitest';

it('passes the November published-image recovery verifier contracts without Docker', () => {
  execFileSync(
    process.execPath,
    ['--test', 'scripts/test-verify-published-image-558ce3c.mjs'],
    {
      stdio: 'inherit',
      timeout: 30000,
    }
  );
});
