import fs from 'node:fs';
import path from 'node:path';

describe('GitHub workflow pnpm cache', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const expectations: Record<string, number> = {
        '.github/workflows/ci.yml': 1,
        '.github/workflows/tests.yml': 3,
        '.github/workflows/quest-chart.yml': 1,
    };

    for (const [workflowPath, expectedCount] of Object.entries(expectations)) {
        it(`${workflowPath} caches the pnpm store`, () => {
            const absolutePath = path.join(repoRoot, workflowPath);
            const content = fs.readFileSync(absolutePath, 'utf8');
            const cacheStepMatches = content.match(/Cache pnpm store/g) ?? [];
            expect(cacheStepMatches.length).toBe(expectedCount);
            const cacheActionMatches = content.match(/actions\/cache@v4/g) ?? [];
            expect(cacheActionMatches.length).toBeGreaterThanOrEqual(expectedCount);
            expect(content).toMatch(/hashFiles\(['"]pnpm-lock\.yaml['"]\)/);
        });
    }
});
