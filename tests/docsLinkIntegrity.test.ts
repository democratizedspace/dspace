import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');
const DOC_FILES = globSync(path.join(DOCS_DIR, '**/*.md'));
const LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;

type DocLinks = {
    githubLinks: Set<string>;
    internalRoutes: Set<string>;
};

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
        path.join(pagesDir, normalizedPath, 'index.md'),
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

function resolveAsset(routePath: string): boolean {
    const cleanPath = routePath.replace(/^\//, '');
    const frontendAsset = path.join(process.cwd(), 'frontend', 'public', cleanPath);
    const rootAsset = path.join(process.cwd(), 'public', cleanPath);
    return existsSync(frontendAsset) || existsSync(rootAsset);
}

function isGitHubUrl(rawUrl: string): boolean {
    try {
        const url = new URL(rawUrl);
        return (
            url.hostname === 'github.com' ||
            url.hostname === 'www.github.com' ||
            url.hostname === 'raw.githubusercontent.com'
        );
    } catch {
        return false;
    }
}

function collectDocLinks(): DocLinks {
    const githubLinks = new Set<string>();
    const internalRoutes = new Set<string>();

    for (const file of DOC_FILES) {
        const content = readFileSync(file, 'utf8');
        for (const match of content.matchAll(LINK_PATTERN)) {
            const rawLink = match[1].trim();
            if (!rawLink) continue;
            if (rawLink.startsWith('#')) continue;
            if (rawLink.startsWith('mailto:')) continue;
            if (rawLink.startsWith('data:')) continue;
            if (rawLink.startsWith('javascript:')) continue;
            if (rawLink.startsWith('<')) continue;

            if (rawLink.startsWith('/')) {
                const [targetPath] = rawLink.split('#');
                const [pathOnly] = targetPath.split('?');
                if (pathOnly) {
                    internalRoutes.add(pathOnly);
                }
                continue;
            }

            if (isGitHubUrl(rawLink)) {
                const url = new URL(rawLink);
                url.hash = '';
                githubLinks.add(url.toString());
            }
        }
    }

    return { githubLinks, internalRoutes };
}

async function fetchStatus(url: string): Promise<number> {
    const headers = { 'User-Agent': 'dspace-docs-link-check' };
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', headers });
    if (response.status === 405 || response.status === 403) {
        response = await fetch(url, { method: 'GET', redirect: 'follow', headers });
    }
    return response.status;
}

async function checkGitHubLinks(urls: string[]): Promise<{ url: string; status: number }[]> {
    const queue = [...urls];
    const failures: { url: string; status: number }[] = [];
    const concurrency = 5;

    const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length > 0) {
            const next = queue.shift();
            if (!next) return;
            const status = await fetchStatus(next);
            if (status < 200 || status >= 400) {
                failures.push({ url: next, status });
            }
        }
    });

    await Promise.all(workers);
    return failures;
}

describe('Docs link integrity', () => {
    const { githubLinks, internalRoutes } = collectDocLinks();

    it('resolves internal routes referenced in docs markdown', () => {
        const brokenRoutes = Array.from(internalRoutes).filter((route) => {
            return !resolveInternalRoute(route) && !resolveAsset(route);
        });

        expect(brokenRoutes).toEqual([]);
    });

    it(
        'ensures GitHub links referenced in docs markdown respond successfully',
        async () => {
            const failures = await checkGitHubLinks(Array.from(githubLinks));

            expect(failures).toEqual([]);
        },
        60000
    );
});
