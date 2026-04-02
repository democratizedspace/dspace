import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

const staleDspaceBranchPattern =
    /https?:\/\/(?:github\.com\/democratizedspace\/dspace\/(?:blob|tree)|raw\.githubusercontent\.com\/democratizedspace\/dspace)\/v3(?:\/|\b)/i;

const markdownFiles = globSync('**/*.md', {
    ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/test-artifacts/**',
        '**/.pnpm/**',
    ],
});

describe('dspace self-link branch freshness', () => {
    it('flags stale v3 branch-qualified self links', () => {
        expect(
            staleDspaceBranchPattern.test(
                'https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md'
            )
        ).toBe(true);
        expect(
            staleDspaceBranchPattern.test('https://github.com/democratizedspace/dspace/tree/v3/docs')
        ).toBe(true);
        expect(
            staleDspaceBranchPattern.test(
                'https://raw.githubusercontent.com/democratizedspace/dspace/v3/frontend/.vscode/extensions.json'
            )
        ).toBe(true);
    });

    it('allows main-branch self links and non-branch v3 references', () => {
        expect(
            staleDspaceBranchPattern.test(
                'https://github.com/democratizedspace/dspace/blob/main/DEVELOPER_GUIDE.md'
            )
        ).toBe(false);
        expect(staleDspaceBranchPattern.test('docs/qa/v3.md')).toBe(false);
        expect(staleDspaceBranchPattern.test('v3.0.0-rc.4')).toBe(false);
    });

    it('has no stale v3 branch-qualified self links in markdown', () => {
        const staleLinks: { file: string; link: string }[] = [];
        const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

        for (const file of markdownFiles) {
            const content = readFileSync(file, 'utf8');
            const normalizedFile = path.relative(process.cwd(), file).split(path.sep).join('/');
            for (const match of content.matchAll(markdownLinkPattern)) {
                const rawLink = match[1].trim();
                if (staleDspaceBranchPattern.test(rawLink)) {
                    staleLinks.push({ file: normalizedFile, link: rawLink });
                }
            }
        }

        expect(staleLinks).toEqual([]);
    });
});
