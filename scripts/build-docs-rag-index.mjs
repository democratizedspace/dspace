import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { glob } from 'glob';
import matter from 'gray-matter';
import MiniSearch from 'minisearch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const DOCS_DIR = path.join(repoRoot, 'frontend/src/pages/docs/md');
const ROUTES_PATH = path.join(repoRoot, 'docs/ROUTES.md');
const CHANGELOG_DIR = path.join(repoRoot, 'frontend/src/pages/docs/md/changelog');
const OUTPUT_DIR = path.join(repoRoot, 'frontend/src/generated/rag');

const MAX_CHUNK_SIZE = 6000;
const TARGET_CHUNK_SIZE = 4000;

const normalizeLineEndings = (text) => text.replace(/\r\n?/g, '\n');

const slugify = (value) =>
    String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/[`"'“”‘’]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

const splitLargeParagraph = (text, maxSize) => {
    const chunks = [];
    let remaining = text.trim();

    while (remaining.length > maxSize) {
        const slice = remaining.slice(0, maxSize);
        const lastSpace = slice.lastIndexOf(' ');
        const cutoff = lastSpace > maxSize * 0.6 ? lastSpace : maxSize;
        chunks.push(remaining.slice(0, cutoff).trim());
        remaining = remaining.slice(cutoff).trim();
    }

    if (remaining) {
        chunks.push(remaining);
    }

    return chunks;
};

const splitTextIntoChunks = (text) => {
    const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    const chunks = [];
    let current = '';

    for (const paragraph of paragraphs) {
        if (!current) {
            current = paragraph;
            continue;
        }

        if (current.length + paragraph.length + 2 <= MAX_CHUNK_SIZE) {
            current = `${current}\n\n${paragraph}`;
            continue;
        }

        if (current.length < TARGET_CHUNK_SIZE) {
            chunks.push(current);
            current = paragraph;
            continue;
        }

        chunks.push(current);
        current = paragraph;
    }

    if (current) {
        chunks.push(current);
    }

    return chunks.flatMap((chunk) =>
        chunk.length > MAX_CHUNK_SIZE ? splitLargeParagraph(chunk, MAX_CHUNK_SIZE) : chunk
    );
};

const extractSections = (markdown, fallbackTitle) => {
    const lines = normalizeLineEndings(markdown).split('\n');
    const sections = [];
    let title = fallbackTitle;
    let current = null;

    const pushCurrent = () => {
        if (!current) {
            return;
        }
        const text = current.lines.join('\n').trim();
        if (text) {
            sections.push({ heading: current.heading, text });
        }
    };

    for (const line of lines) {
        const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (match) {
            const level = match[1].length;
            const headingText = match[2].replace(/\s*#+\s*$/, '').trim();
            if (level === 1 && !title) {
                title = headingText;
            }
            if (level === 2 || level === 3) {
                pushCurrent();
                current = { heading: headingText, lines: [] };
                continue;
            }
        }

        if (!current) {
            current = { heading: title || fallbackTitle || 'Document', lines: [] };
        }
        current.lines.push(line);
    }

    pushCurrent();

    if (!sections.length && current?.lines?.length) {
        const text = current.lines.join('\n').trim();
        if (text) {
            sections.push({ heading: current.heading, text });
        }
    }

    return { title: title || fallbackTitle || 'Document', sections };
};

const ensureExists = async (filePath, label) => {
    try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
            throw new Error();
        }
    } catch (error) {
        throw new Error(`${label} not found at ${filePath}`);
    }
};

const getGitSha = () => {
    try {
        return execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
    } catch (error) {
        return 'unknown';
    }
};

const resolveDocSlug = (relativePath, frontmatterSlug) => {
    if (!frontmatterSlug) {
        throw new Error(`Missing slug in frontmatter for ${relativePath}`);
    }
    if (relativePath.includes('/docs/md/outages/')) {
        return `/docs/outages/${frontmatterSlug}`;
    }
    return `/docs/${frontmatterSlug}`;
};

const buildChunks = async () => {
    await ensureExists(ROUTES_PATH, 'ROUTES.md');
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const docFiles = await glob('**/*.md', {
        cwd: DOCS_DIR,
        absolute: true,
        ignore: ['**/changelog/*.md'],
    });
    const changelogFiles = await glob('**/*.md', {
        cwd: CHANGELOG_DIR,
        absolute: true,
    });

    if (!changelogFiles.length) {
        throw new Error(`No changelog markdown files found under ${CHANGELOG_DIR}`);
    }

    const sortedDocs = docFiles.sort();
    const sortedChangelogs = changelogFiles.sort();

    const chunks = [];
    let chunkIndex = 0;

    const pushChunksForMarkdown = ({
        content,
        title,
        headingFallback,
        kind,
        slug,
        anchorBase,
        pathRelative,
    }) => {
        const { sections } = extractSections(content, title);
        for (const section of sections) {
            const heading = section.heading || headingFallback || title;
            const anchor = anchorBase || slugify(heading);
            const chunkTexts = splitTextIntoChunks(section.text);
            for (const chunkText of chunkTexts) {
                const text = chunkText.trim();
                if (!text) {
                    continue;
                }
                chunkIndex += 1;
                const id = `${kind}-${chunkIndex}`;
                const excerpt = text.length > 240 ? `${text.slice(0, 240).trim()}…` : text;
                chunks.push({
                    id,
                    path: pathRelative,
                    slug,
                    title,
                    heading,
                    anchor,
                    text,
                    kind,
                    excerpt,
                });
            }
        }
    };

    for (const filePath of sortedDocs) {
        const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(raw);
        const title = parsed.data?.title || 'Documentation';
        const frontmatterSlug = parsed.data?.slug;
        const slug = resolveDocSlug(relativePath, frontmatterSlug);
        pushChunksForMarkdown({
            content: parsed.content,
            title,
            headingFallback: title,
            kind: 'doc',
            slug,
            pathRelative: relativePath,
        });
    }

    for (const filePath of sortedChangelogs) {
        const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(raw);
        const title = parsed.data?.title || 'Changelog';
        const releaseSlug = slugify(parsed.data?.slug || path.basename(filePath, '.md'));
        pushChunksForMarkdown({
            content: parsed.content,
            title,
            headingFallback: title,
            kind: 'changelog',
            slug: '/changelog',
            anchorBase: releaseSlug || 'changelog',
            pathRelative: relativePath,
        });
    }

    const routesRaw = await fs.readFile(ROUTES_PATH, 'utf-8');
    const { title: routesTitle, sections: routeSections } = extractSections(
        routesRaw,
        'Routes'
    );
    for (const section of routeSections) {
        const heading = section.heading || routesTitle;
        const anchor = slugify(heading);
        const chunkTexts = splitTextIntoChunks(section.text);
        for (const chunkText of chunkTexts) {
            const text = chunkText.trim();
            if (!text) {
                continue;
            }
            chunkIndex += 1;
            const id = `route-${chunkIndex}`;
            const excerpt = text.length > 240 ? `${text.slice(0, 240).trim()}…` : text;
            chunks.push({
                id,
                path: path.relative(repoRoot, ROUTES_PATH).split(path.sep).join('/'),
                slug: '/docs',
                title: routesTitle,
                heading,
                anchor,
                text,
                kind: 'route',
                excerpt,
            });
        }
    }

    return chunks;
};

const buildIndex = (chunks) => {
    const miniSearch = new MiniSearch({
        fields: ['title', 'heading', 'text', 'slug', 'path'],
        storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path', 'excerpt'],
    });
    miniSearch.addAll(chunks);
    return miniSearch;
};

const main = async () => {
    const chunks = await buildChunks();
    if (!chunks.length) {
        throw new Error('No chunks were generated for docs RAG index.');
    }

    const index = buildIndex(chunks);
    const chunksOutput = path.join(OUTPUT_DIR, 'docs_chunks.json');
    const indexOutput = path.join(OUTPUT_DIR, 'docs_index.json');
    const metaOutput = path.join(OUTPUT_DIR, 'docs_meta.json');

    const meta = {
        generatedAt: new Date().toISOString(),
        chunkCount: chunks.length,
        docCount: new Set(chunks.map((chunk) => chunk.path)).size,
        gitSha: getGitSha(),
    };

    await Promise.all([
        fs.writeFile(chunksOutput, `${JSON.stringify(chunks, null, 2)}\n`),
        fs.writeFile(indexOutput, `${JSON.stringify(index, null, 2)}\n`),
        fs.writeFile(metaOutput, `${JSON.stringify(meta, null, 2)}\n`),
    ]);

    console.log(
        `Built docs RAG index with ${chunks.length} chunks from ${meta.docCount} sources.`
    );
};

main().catch((error) => {
    console.error('Failed to build docs RAG index:', error);
    process.exitCode = 1;
});
