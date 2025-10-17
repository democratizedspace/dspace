import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('CI workflows avoid unusable pnpm filters for frontend exec commands', () => {
    it('does not use pnpm --filter ./frontend exec', () => {
        const workflowPaths = globSync('.github/workflows/*.yml', {
            cwd: repoRoot,
        });

        const offenders: string[] = [];

        for (const relativePath of workflowPaths) {
            const absolutePath = join(repoRoot, relativePath);
            const content = readFileSync(absolutePath, 'utf8');

            const lines = content.split(/\r?\n/);

            lines.forEach((line, index) => {
                if (line.includes('pnpm --filter ./frontend exec')) {
                    offenders.push(`${relativePath}:${index + 1}`);
                }
            });
        }

        const message = offenders.length
            ? `Remove pnpm --filter ./frontend exec from: ${offenders.join(', ')}`
            : undefined;

        expect(offenders, message).toHaveLength(0);
    });
});
