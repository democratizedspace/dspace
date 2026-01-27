#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';
import MiniSearch from 'minisearch';
import { parse } from 'yaml';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const DOCS_DIR = path.join(repoRoot, 'frontend', 'src', 'pages', 'docs', 'md');
const ROUTES_PATH = path.join(repoRoot, 'docs', 'ROUTES.md');
const OUTPUT_DIR = path.join(repoRoot, 'frontend', 'src', 'generated', 'rag');

const MAX_CHUNK_CHARS = 6000;

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;

const stripMarkdownToText = (markdown) => {
    if (!markdown) {
        return '';
    }

    let text = markdown;

    text = text.replace(/^---[\s\S]*?---/g, ' ');
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/!\[([^\]]*)]\([^)]*\)/g, '$1');
    text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/^\s*#+\s*/gm, '');
    text = text.replace(/^\s*>\s*/gm, '');
    text = text.replace(/[*_~]+/g, '');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
};

const slugifyHeading = (value) => {
    if (!value) {
        return '';
    }

    return String(value)
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
        .trim();
};

const readMarkdownFile = async (filePath) => {
    const raw = await readFile(filePath, 'utf8');
    const match = raw.match(FRONTMATTER_REGEX);

    if (!match) {
        return { frontmatter: {}, content: raw };
    }

    const frontmatter = parse(match[1]) ?? {};
    const content = raw.slice(match[0].length).trimStart();
    return { frontmatter, content };
};

const extractHeadings = (markdown) => {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    let current = { heading: '', level: 0, lines: [] };
    let titleFromH1 = '';

    lines.forEach((line) => {
        const match = line.match(/^(#{1,6})\s+(.*)$/);
        if (!match) {
            current.lines.push(line);
            return;
        }

        const level = match[1].length;
        const headingText = match[2].trim();

        if (level === 1 && !titleFromH1) {
            titleFromH1 = headingText;
        }

        if (level >= 2 && level <= 3) {
            if (current.heading || current.lines.length) {
                sections.push(current);
            }
            current = { heading: headingText, level, lines: [] };
        } else {
            current.lines.push(line);
        }
    });

    if (current.heading || current.lines.length) {
        sections.push(current);
    }

    return { sections, titleFromH1 };
};

const splitSectionText = (markdown, maxChars) => {
    const paragraphs = markdown.split(/\n\s*\n/);
    const chunks = [];
    let current = '';

    const pushCurrent = () => {
        if (!current.trim()) {
            current = '';
            return;
        }
        chunks.push(current.trim());
        current = '';
    };

    paragraphs.forEach((paragraph) => {
        const text = stripMarkdownToText(paragraph);
        if (!text) {
            return;
        }

        if (!current) {
            if (text.length <= maxChars) {
                current = text;
                return;
            }

            let remaining = text;
            while (remaining.length > maxChars) {
                chunks.push(remaining.slice(0, maxChars));
                remaining = remaining.slice(maxChars);
            }
            current = remaining;
            return;
        }

        if (current.length + 1 + text.length <= maxChars) {
            current = `${current}\n${text}`;
        } else {
            pushCurrent();
            current = text;
        }
    });

    pushCurrent();

    return chunks;
};

const buildChunksForFile = (filePath, kind, slug, title, anchorOverride) => {
    return readMarkdownFile(filePath).then(({ frontmatter, content }) => {
        const { sections, titleFromH1 } = extractHeadings(content);
        const docTitle = title || frontmatter.title || titleFromH1 || path.basename(filePath);

        const normalizedSections = sections.length
            ? sections
            : [{ heading: docTitle, level: 1, lines: content.split(/\r?\n/) }];

        const chunks = [];
        normalizedSections.forEach((section, sectionIndex) => {
            const headingText = section.heading || docTitle;
            const anchor =
                anchorOverride ||
                (section.heading ? slugifyHeading(section.heading) : slugifyHeading(docTitle));
            const markdownBody = section.lines.join('\n').trim();
            const chunkSource = markdownBody || headingText;
            const textChunks = splitSectionText(chunkSource, MAX_CHUNK_CHARS);

            textChunks.forEach((text, index) => {
                const excerpt = text.length > 200 ? `${text.slice(0, 200)}…` : text;
                chunks.push({
                    id: `${slug}:${anchor}:${sectionIndex}:${index}`,
                    path: path.relative(repoRoot, filePath),
                    slug,
                    title: docTitle,
                    heading: headingText,
                    anchor,
                    text,
                    kind,
                    excerpt,
                });
            });
        });

        return chunks;
    });
};

const buildDocsChunks = async () => {
    if (!existsSync(ROUTES_PATH)) {
        throw new Error('docs/ROUTES.md is missing; cannot build docs RAG index.');
    }

    const docFiles = await glob('frontend/src/pages/docs/md/**/*.md', {
        cwd: repoRoot,
        absolute: true,
    });

    const changelogFiles = await glob('frontend/src/pages/docs/md/changelog/*.md', {
        cwd: repoRoot,
        absolute: true,
    });

    if (!changelogFiles.length) {
        throw new Error(
            'No changelog release notes found under frontend/src/pages/docs/md/changelog.'
        );
    }

    const routesChunk = await buildChunksForFile(
        ROUTES_PATH,
        'route',
        'routes',
        'Routes Documentation'
    );

    const sortedDocs = docFiles.sort();
    const chunks = [];

    for (const filePath of sortedDocs) {
        const relativePath = path.relative(DOCS_DIR, filePath);
        const parts = relativePath.split(path.sep);
        const sectionDir = parts.length > 1 ? parts[0] : '';

        const { frontmatter } = await readMarkdownFile(filePath);
        const rawSlug = typeof frontmatter.slug === 'string' ? frontmatter.slug.trim() : '';

        if (!rawSlug && sectionDir !== 'changelog') {
            throw new Error(`Docs markdown missing slug frontmatter: ${relativePath}`);
        }

        const isChangelogIndex = relativePath === 'changelog.md';
        const isChangelogEntry = sectionDir === 'changelog' && relativePath !== 'changelog.md';
        const isOutageDoc = sectionDir === 'outages';
        const kind = isChangelogIndex || isChangelogEntry ? 'changelog' : 'doc';

        let slug = rawSlug.toLowerCase();
        let anchorOverride = '';

        if (isOutageDoc && rawSlug) {
            slug = `outages/${rawSlug.toLowerCase()}`;
        } else if (isChangelogEntry) {
            slug = 'changelog';
            anchorOverride = rawSlug.toLowerCase();
        } else if (sectionDir && !isChangelogIndex && rawSlug) {
            slug = `${sectionDir}/${rawSlug.toLowerCase()}`;
        }

        const fileChunks = await buildChunksForFile(
            filePath,
            kind,
            slug,
            frontmatter.title,
            anchorOverride
        );

        chunks.push(...fileChunks);
    }

    return [...routesChunk, ...chunks];
};

const buildIndex = (chunks) => {
    const miniSearch = new MiniSearch({
        fields: ['title', 'heading', 'text', 'slug', 'path'],
        storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path', 'excerpt'],
    });

    miniSearch.addAll(chunks);
    return miniSearch;
};

const buildMeta = (chunks) => {
    const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH
        ? Number.parseInt(process.env.SOURCE_DATE_EPOCH, 10)
        : null;

    return {
        totalChunks: chunks.length,
        kindCounts: chunks.reduce((acc, chunk) => {
            acc[chunk.kind] = (acc[chunk.kind] ?? 0) + 1;
            return acc;
        }, {}),
        generatedAt: Number.isFinite(sourceDateEpoch)
            ? new Date(sourceDateEpoch * 1000).toISOString()
            : null,
        gitSha: process.env.GIT_SHA ?? null,
    };
};

const main = async () => {
    const chunks = await buildDocsChunks();

    if (!chunks.length) {
        throw new Error('No docs chunks generated; refusing to write empty RAG index.');
    }

    await mkdir(OUTPUT_DIR, { recursive: true });

    const index = buildIndex(chunks);
    const meta = buildMeta(chunks);

    await writeFile(
        path.join(OUTPUT_DIR, 'docs_chunks.json'),
        `${JSON.stringify(chunks, null, 4)}\n`
    );

    await writeFile(
        path.join(OUTPUT_DIR, 'docs_index.json'),
        `${JSON.stringify(index, null, 4)}\n`
    );

    await writeFile(
        path.join(OUTPUT_DIR, 'docs_meta.json'),
        `${JSON.stringify(meta, null, 4)}\n`
    );

    console.log(`Generated ${chunks.length} docs chunks and MiniSearch index.`);
};

main().catch((error) => {
    console.error('Failed to build docs RAG index:', error);
    process.exit(1);
});
