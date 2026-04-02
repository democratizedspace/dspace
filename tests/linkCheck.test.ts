import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const runLinkCheck = () =>
    execFileSync('node', ['scripts/link-check.mjs'], {
        encoding: 'utf8',
        stdio: 'pipe',
    });
const staleBranchLinkPattern =
    /https?:\/\/(?:github\.com\/democratizedspace\/dspace\/blob\/v3(?:\/|$)|github\.com\/democratizedspace\/dspace\/tree\/v3(?:\/|$)|raw\.githubusercontent\.com\/democratizedspace\/dspace\/v3\/)/;

describe('markdown link validation', () => {
    it('resolves internal and GitHub links without 404s', () => {
        expect(() => runLinkCheck()).not.toThrow();
    });

    it('rejects stale v3 branch URLs and allows main branch plus named v3 references', () => {
        expect(
            staleBranchLinkPattern.test(
                'https://github.com/democratizedspace/dspace/blob/v3/docs/prompts/codex/quests.md'
            )
        ).toBe(true);
        expect(
            staleBranchLinkPattern.test(
                'https://github.com/democratizedspace/dspace/tree/v3/frontend/src/pages'
            )
        ).toBe(true);
        expect(
            staleBranchLinkPattern.test(
                'https://raw.githubusercontent.com/democratizedspace/dspace/v3/frontend/.vscode/extensions.json'
            )
        ).toBe(true);

        expect(
            staleBranchLinkPattern.test(
                'https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/quests.md'
            )
        ).toBe(false);
        expect(staleBranchLinkPattern.test('docs/qa/v3.md')).toBe(false);
        expect(staleBranchLinkPattern.test('v3.0.0-rc.4')).toBe(false);
    });

    it('has no stale v3 branch URLs to democratizedspace/dspace in tracked files', () => {
        const result = spawnSync(
            'rg',
            [
                '--hidden',
                '-n',
                'https?://github\\.com/democratizedspace/dspace/(blob|tree)/v3(?:/|$)|https?://raw\\.githubusercontent\\.com/democratizedspace/dspace/v3/',
                'AGENTS.md',
                'docs',
                'frontend',
                '.github',
            ],
            { encoding: 'utf8' }
        );

        if (result.error) {
            throw new Error(`rg not available: ${result.error.message}`);
        }

        expect(result.status).toBe(1);
        expect(result.stdout).toBe('');
    });
});
