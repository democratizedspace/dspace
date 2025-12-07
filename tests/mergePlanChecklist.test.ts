import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('release merge plan documentation', () => {
    it('does not ship unchecked checklist items', () => {
        const mergePlanPath = join(process.cwd(), 'docs', 'merge-plan.md');
        const content = readFileSync(mergePlanPath, 'utf8');

        expect(content).not.toMatch(/^(\s*)-\s+\[ \]/m);
    });
});
