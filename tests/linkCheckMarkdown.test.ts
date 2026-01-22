import { execSync } from 'node:child_process';
import { describe, it } from 'vitest';

describe('markdown link validation', () => {
    it('passes the markdown link checker', () => {
        execSync('node scripts/link-check.mjs', { stdio: 'inherit' });
    });
});
