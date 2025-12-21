import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const DOCS_MD_DIR = path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');
const DOCS_SECTIONS_FILES = [
    path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'sections.json'),
    path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'json', 'sections.json')
];
const DOC_LINK_PATTERN = /\[[^\]]+\]\((\/docs[^)#\s]*)/g;

type Frontmatter = {
    slug?: unknown;
};

type FrontmatterResult = {
    frontmatter: Frontmatter | null;
    hasFrontmatter: boolean;
};

function readFrontmatter(filePath: string): FrontmatterResult {
    const content = readFileSync(filePath, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);

    if (!match) {
        return { frontmatter: null, hasFrontmatter: false };
    }

    return { frontmatter: parse(match[1]) as Frontmatter, hasFrontmatter: true };
}

function normalizeDocPath(rawPath: string): string {
    const [pathOnly] = rawPath.split('#');
    const trimmed = pathOnly.replace(/\/+$/, '');
    return trimmed === '' ? '/docs' : trimmed.toLowerCase();
}

describe('Docs slugs and references', () => {
    const docFiles = globSync(path.join(DOCS_MD_DIR, '**/*.md'));

    it('requires every docs markdown file to declare a slug', () => {
        const filesMissingSlugs = docFiles
            .map((filePath) => {
                const { frontmatter, hasFrontmatter } = readFrontmatter(filePath);
                const slug = frontmatter?.slug;
                const normalizedSlug = typeof slug === 'string' ? slug.trim() : '';

                if (!hasFrontmatter || normalizedSlug.length === 0) {
                    return filePath;
                }

                return null;
            })
            .filter(Boolean);

        expect(filesMissingSlugs).toEqual([]);
    });

    it('ensures doc links resolve to slugged markdown files', () => {
        const topLevelDocSlugs = docFiles
            .filter((filePath) => !filePath.includes(`${path.sep}outages${path.sep}`))
            .map((filePath) => readFrontmatter(filePath).frontmatter?.slug)
            .filter((slug): slug is string => typeof slug === 'string')
            .map((slug) => slug.toLowerCase());

        const outageDocSlugs = docFiles
            .filter((filePath) => filePath.includes(`${path.sep}outages${path.sep}`))
            .map((filePath) => readFrontmatter(filePath).frontmatter?.slug)
            .filter((slug): slug is string => typeof slug === 'string')
            .map((slug) => slug.toLowerCase());

        const knownDocRoutes = new Set<string>(['/docs', '/docs/outages']);

        topLevelDocSlugs.forEach((slug) => knownDocRoutes.add(`/docs/${slug}`));
        outageDocSlugs.forEach((slug) => knownDocRoutes.add(`/docs/outages/${slug}`));

        const referencedDocRoutes = new Set<string>();

        DOCS_SECTIONS_FILES.forEach((sectionsPath) => {
            const sections = JSON.parse(readFileSync(sectionsPath, 'utf8')) as
                | { links?: { href?: string; external?: boolean }[] }[]
                | undefined;

            sections?.forEach((section) => {
                section.links?.forEach((link) => {
                    if (!link.href || link.external) return;
                    if (!link.href.startsWith('/docs')) return;
                    referencedDocRoutes.add(normalizeDocPath(link.href));
                });
            });
        });

        const markdownDocLinks = docFiles.flatMap((filePath) => {
            const content = readFileSync(filePath, 'utf8');
            const matches: string[] = [];
            let match;

            while ((match = DOC_LINK_PATTERN.exec(content)) !== null) {
                matches.push(match[1]);
            }

            return matches;
        });

        markdownDocLinks.forEach((href) => referencedDocRoutes.add(normalizeDocPath(href)));

        const unresolvedRoutes = Array.from(referencedDocRoutes).filter(
            (href) => !knownDocRoutes.has(href)
        );

        expect(unresolvedRoutes).toEqual([]);
    });
});
