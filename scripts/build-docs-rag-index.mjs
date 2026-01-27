import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import MiniSearch from 'minisearch';
import { parse } from 'yaml';
import { execSync } from 'node:child_process';

const REPO_ROOT = process.cwd();
const ROUTES_PATH = path.join(REPO_ROOT, 'docs', 'ROUTES.md');
const OUTPUT_DIR = path.join(REPO_ROOT, 'frontend', 'src', 'generated', 'rag');
const MAX_CHUNK_LENGTH = 6000;
const JSON_INDENT = 4;

const toPosixPath = (value) => value.split(path.sep).join('/');

const slugify = (value) => {
    if (!value) {
        return '';
    }

    return String(value)
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
        .trim();
};

const stripMarkdownToText = (markdown) => {
    if (!markdown) {
        return '';
    }

    let text = markdown;

    text = text.replace(/^---[\s\S]*?---/g, ' ');
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
    text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/^\s*#+\s*/gm, '');
    text = text.replace(/^\s*>\s*/gm, '');
    text = text.replace(/[*_~]+/g, '');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
};

const splitLargeText = (text) => {
    if (text.length <= MAX_CHUNK_LENGTH) {
        return [text];
    }

    const paragraphs = text
        .split(/\n\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
    const chunks = [];
    let current = '';

    const pushCurrent = () => {
        if (current) {
            chunks.push(current.trim());
            current = '';
        }
    };

    for (const paragraph of paragraphs) {
        if (!paragraph) {
            continue;
        }

        if (paragraph.length > MAX_CHUNK_LENGTH) {
            pushCurrent();
            let start = 0;
            while (start < paragraph.length) {
                chunks.push(paragraph.slice(start, start + MAX_CHUNK_LENGTH));
                start += MAX_CHUNK_LENGTH;
            }
            continue;
        }

        if (!current) {
            current = paragraph;
            continue;
        }

        if (current.length + paragraph.length + 2 <= MAX_CHUNK_LENGTH) {
            current = `${current}\n\n${paragraph}`;
            continue;
        }

        pushCurrent();
        current = paragraph;
    }

    pushCurrent();

    return chunks.length ? chunks : [text];
};

const parseFrontmatter = (content) => {
    const match = content.match(/^\s*---\s*([\s\S]*?)\s*---\s*/);
    if (!match) {
        return { data: {}, body: content };
    }

    const data = parse(match[1]) ?? {};
    const body = content.slice(match[0].length);

    return { data, body };
};

const extractSections = (content) => {
    const lines = content.split(/\r?\n/);
    const sections = [];
    let inCodeBlock = false;
    let docTitle = '';
    let current = { heading: '', level: 0, lines: [] };

    const pushCurrent = () => {
        if (current.lines.length || current.heading) {
            sections.push({
                heading: current.heading,
                level: current.level,
                content: current.lines.join('\n').trim(),
            });
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
            inCodeBlock = !inCodeBlock;
            current.lines.push(line);
            continue;
        }

        if (!inCodeBlock) {
            const match = line.match(/^(#{1,6})\s+(.*)$/);
            if (match) {
                const level = match[1].length;
                const headingText = match[2].trim();

                if (level === 1 && !docTitle) {
                    docTitle = headingText;
                    continue;
                }

                if (level === 2 || level === 3) {
                    pushCurrent();
                    current = { heading: headingText, level, lines: [] };
                    continue;
                }
            }
        }

        current.lines.push(line);
    }

    pushCurrent();

    return { sections, docTitle };
};

const deriveSlug = (sourcePath, frontmatterSlug) => {
    if (!frontmatterSlug) {
        return '';
    }

    const normalized = toPosixPath(sourcePath);

    if (normalized.includes('/docs/md/outages/')) {
        return `outages/${frontmatterSlug}`;
    }

    if (normalized.includes('/docs/md/changelog/')) {
        return 'changelog';
    }

    return frontmatterSlug;
};

const ensureRoutesFile = () => {
    if (!existsSync(ROUTES_PATH)) {
        throw new Error('Missing docs/ROUTES.md; cannot build docs RAG index.');
    }
};

const readMarkdownFiles = async () => {
    const files = await glob('frontend/src/pages/docs/md/**/*.md', { nodir: true });
    if (!files.length) {
        throw new Error('No docs markdown files found under frontend/src/pages/docs/md.');
    }
    return files;
};

const getGitSha = () => {
    try {
        return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
        return null;
    }
};

const buildChunksForDoc = ({
    sourcePath,
    content,
    title,
    slug,
    kind,
    anchorOverride,
}) => {
    const { body } = parseFrontmatter(content);
    const { sections, docTitle } = extractSections(body);
    const fallbackTitle = title || docTitle || slug;
    const relativePath = toPosixPath(path.relative(REPO_ROOT, sourcePath));

    if (!fallbackTitle) {
        throw new Error(`Missing title for ${relativePath}.`);
    }

    const chunkEntries = [];

    const addChunk = (heading, text, index) => {
        const normalizedHeading = heading || fallbackTitle;
        const anchorBase = anchorOverride || slugify(normalizedHeading) || slugify(fallbackTitle);
        const anchor = anchorBase || `section-${index}`;
        const id = `${relativePath}::${anchor}::${index}`;

        chunkEntries.push({
            id,
            path: relativePath,
            slug,
            title: fallbackTitle,
            heading: normalizedHeading,
            anchor,
            text,
            kind,
        });
    };

    if (!sections.length) {
        const text = stripMarkdownToText(body);
        if (text) {
            const chunks = splitLargeText(text);
            chunks.forEach((chunk, index) => addChunk(fallbackTitle, chunk, index));
        }
        return chunkEntries;
    }

    sections.forEach((section, sectionIndex) => {
        const headingText = section.heading || fallbackTitle;
        const combined = [section.heading ? `${section.heading}\n${section.content}` : section.content]
            .join('\n')
            .trim();
        const plainText = stripMarkdownToText(combined);
        if (!plainText) {
            return;
        }
        const chunks = splitLargeText(plainText);
        chunks.forEach((chunk, chunkIndex) => {
            addChunk(headingText, chunk, sectionIndex * 100 + chunkIndex);
        });
    });

    return chunkEntries;
};

const buildDocsRagIndex = async () => {
    ensureRoutesFile();

    const markdownFiles = await readMarkdownFiles();
    const chunks = [];

    const routesContent = await readFile(ROUTES_PATH, 'utf8');
    const routesTitleMatch = routesContent.match(/^#\s+(.+)$/m);
    const routesTitle = routesTitleMatch ? routesTitleMatch[1].trim() : 'Routes';

    chunks.push(
        ...buildChunksForDoc({
            sourcePath: ROUTES_PATH,
            content: routesContent,
            title: routesTitle,
            slug: 'routes',
            kind: 'route',
        })
    );

    let v3ReleaseFound = false;

    for (const file of markdownFiles.sort()) {
        const content = await readFile(file, 'utf8');
        const { data } = parseFrontmatter(content);
        const frontmatterSlug = String(data?.slug ?? '').trim();
        const frontmatterTitle = String(data?.title ?? '').trim();

        if (!frontmatterSlug) {
            throw new Error(`Missing slug in frontmatter for ${file}.`);
        }

        const kind = file.includes(`${path.sep}changelog${path.sep}`) ? 'changelog' : 'doc';
        const slug = deriveSlug(file, frontmatterSlug);
        const anchorOverride = kind === 'changelog' ? frontmatterSlug.toLowerCase() : undefined;

        if (kind === 'changelog') {
            const tagline = String(data?.tagline ?? '').toLowerCase();
            const summary = String(data?.summary ?? '').toLowerCase();
            const title = frontmatterTitle.toLowerCase();
            if (tagline.includes('v3') || summary.includes('v3') || title.includes('v3')) {
                v3ReleaseFound = true;
            }
        }

        chunks.push(
            ...buildChunksForDoc({
                sourcePath: file,
                content,
                title: frontmatterTitle,
                slug,
                kind,
                anchorOverride,
            })
        );
    }

    if (!v3ReleaseFound) {
        throw new Error('No changelog entries appear to reference v3 release notes.');
    }

    if (!chunks.length) {
        throw new Error('No chunks were generated for docs RAG index.');
    }

    const miniSearch = new MiniSearch({
        fields: ['title', 'heading', 'text', 'slug', 'path'],
        storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'],
        idField: 'id',
    });

    miniSearch.addAll(chunks);

    const kindCounts = chunks.reduce((acc, chunk) => {
        acc[chunk.kind] = (acc[chunk.kind] ?? 0) + 1;
        return acc;
    }, {});

    const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH
        ? Number(process.env.SOURCE_DATE_EPOCH)
        : null;

    const meta = {
        chunkCount: chunks.length,
        kindCounts,
        gitSha: getGitSha(),
        generatedAt: sourceDateEpoch ? new Date(sourceDateEpoch * 1000).toISOString() : null,
    };

    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(
        path.join(OUTPUT_DIR, 'docs_chunks.json'),
        `${JSON.stringify(chunks, null, JSON_INDENT)}\n`
    );
    await writeFile(
        path.join(OUTPUT_DIR, 'docs_index.json'),
        `${JSON.stringify(miniSearch, null, JSON_INDENT)}\n`
    );
    await writeFile(
        path.join(OUTPUT_DIR, 'docs_meta.json'),
        `${JSON.stringify(meta, null, JSON_INDENT)}\n`
    );

    console.log(`Generated ${chunks.length} docs chunks.`);
};

await buildDocsRagIndex();
