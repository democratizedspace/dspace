import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;
const MARKDOWN_FILES = globSync(
    [
        path.join(process.cwd(), 'docs', '**', '*.md'),
        path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md', '**', '*.md')
    ],
    {
        ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/test-artifacts/**',
            '**/.pnpm/**'
        ]
    }
);

function resolveInternalRoute(routePath: string): boolean {
    const pagesDir = path.join(process.cwd(), 'frontend', 'src', 'pages');

    if (routePath === '/') {
        return existsSync(path.join(pagesDir, 'index.astro'));
    }

    const cleanPath = routePath.replace(/^\//, '');
    const normalizedPath = cleanPath.replace(/\/$/, '');

    const candidates = [
        path.join(pagesDir, `${normalizedPath}.astro`),
        path.join(pagesDir, `${normalizedPath}.md`),
        path.join(pagesDir, normalizedPath, 'index.astro'),
        path.join(pagesDir, normalizedPath, 'index.md')
    ];

    const parts = normalizedPath.split('/');
    if (normalizedPath.length > 0 && parts[0]) {
        const basePath = parts[0];

        candidates.push(path.join(pagesDir, basePath, '[slug].astro'));

        if (parts.length > 1) {
            candidates.push(path.join(pagesDir, basePath, '[id].astro'));
        }

        if (parts.length > 2) {
            candidates.push(path.join(pagesDir, basePath, '[pathId]', '[questId].astro'));
        }

        if (parts.length > 2 && parts[1]) {
            candidates.push(path.join(pagesDir, basePath, parts[1], '[itemId]', 'index.astro'));
            candidates.push(path.join(pagesDir, basePath, parts[1], '[itemId].astro'));
            candidates.push(path.join(pagesDir, basePath, parts[1], '[id]', 'index.astro'));
            candidates.push(path.join(pagesDir, basePath, parts[1], '[id].astro'));
        }

        if (parts.length > 3 && parts[1]) {
            candidates.push(
                path.join(pagesDir, basePath, parts[1], '[itemId]', `${parts[3]}.astro`)
            );
            candidates.push(
                path.join(pagesDir, basePath, parts[1], '[id]', `${parts[3]}.astro`)
            );
        }

        if (basePath === 'processes' && parts.length > 1) {
            candidates.push(path.join(pagesDir, 'processes', '[processId].astro'));
        }

        candidates.push(path.join(pagesDir, basePath, '[...slug].astro'));
    }

    return candidates.some((candidate) => existsSync(candidate));
}

function collectLinks() {
    const internalLinks: Array<{ file: string; link: string }> = [];
    const githubLinks = new Set<string>();

    for (const file of MARKDOWN_FILES) {
        const content = readFileSync(file, 'utf8');
        let match;

        while ((match = LINK_PATTERN.exec(content)) !== null) {
            const rawLink = match[1].trim();

            if (!rawLink) continue;
            if (rawLink.startsWith('#')) continue;
            if (rawLink.startsWith('mailto:')) continue;
            if (rawLink.startsWith('data:')) continue;
            if (rawLink.startsWith('javascript:')) continue;
            if (rawLink.startsWith('<')) continue;

            if (rawLink.startsWith('/')) {
                internalLinks.push({ file, link: rawLink });
                continue;
            }

            if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
                const url = new URL(rawLink);
                if (url.hostname === 'github.com') {
                    url.hash = '';
                    githubLinks.add(url.toString());
                }
            }
        }
    }

    return { internalLinks, githubLinks: Array.from(githubLinks) };
}

async function fetchWithFallback(url: string): Promise<Response> {
    const headResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'user-agent': 'dspace-link-check' }
    });

    if (headResponse.status !== 405) {
        return headResponse;
    }

    return fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'user-agent': 'dspace-link-check' }
    });
}

describe('Docs link integrity', () => {
    const { internalLinks, githubLinks } = collectLinks();

    it('resolves internal docs routes used in markdown', () => {
        const brokenInternal = internalLinks.filter(({ link }) => {
            const [targetPath] = link.split('#');
            if (!targetPath) return false;

            if (resolveInternalRoute(targetPath)) {
                return false;
            }

            const frontendAssetPath = path.join(process.cwd(), 'frontend', 'public', targetPath);
            if (existsSync(frontendAssetPath)) {
                return false;
            }

            const rootAssetPath = path.join(process.cwd(), 'public', targetPath);
            return !existsSync(rootAssetPath);
        });

        expect(brokenInternal).toEqual([]);
    });

    it(
        'ensures GitHub links in docs do not 404',
        async () => {
            const brokenLinks: Array<{ url: string; status: number }> = [];

            for (const url of githubLinks) {
                const response = await fetchWithFallback(url);
                if (response.status >= 200 && response.status < 400) {
                    continue;
                }

                brokenLinks.push({ url, status: response.status });
            }

            expect(brokenLinks).toEqual([]);
        },
        { timeout: 60000 }
    );
});
