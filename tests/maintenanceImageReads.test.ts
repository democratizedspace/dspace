import { execFileSync } from 'node:child_process';
import { it } from 'vitest';

it('passes publisher registry fault injection without publication or Docker', () => {
  execFileSync(
    process.execPath,
    ['--test', 'scripts/test-maintenance-image-reads.mjs'],
    {
      stdio: 'inherit',
      timeout: 30000,
    }
  );
});
