import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import { glob } from 'glob';
import yaml from 'yaml';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DOCS_DIR = path.join(repoRoot, 'frontend/src/pages/docs/md');
const ROUTES_PATH = path.join(repoRoot, 'docs/ROUTES.md');
const CHANGELOG_DIR = path.join(DOCS_DIR, 'changelog');
const OUTPUT_DIR = path.join(repoRoot, 'frontend/src/generated/rag');

const MAX_CHUNK_LENGTH = 6000;
const CHUNK_SPLIT_MIN = 2000;

const ensureFileExists = async (filePath, label) => {
    try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
            throw new Error(`${label} at ${filePath} is not a file.`);
        }
    } catch (error) {
        throw new Error(`${label} file is missing: ${filePath}`);
    }
};

const readFileSafe = async (filePath) => {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.replace(/\r\n/g, '\n');
};

const parseFrontmatter = (content) => {
    if (!content.startsWith('---')) {
        return { frontmatter: {}, body: content };
    }

    const endIndex = content.indexOf('\n---');
    if (endIndex === -1) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterRaw = content.slice(3, endIndex).trim();
    const body = content.slice(endIndex + 4).replace(/^\s+/, '');
    const frontmatter = frontmatterRaw ? yaml.parse(frontmatterRaw) ?? {} : {};
    return { frontmatter, body };
};

const normalizeHeading = (value) => String(value || '').trim();

const slugifyHeading = (value) => {
    const normalized = normalizeHeading(value)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return normalized
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

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

const splitTextByLength = (text, maxLength = MAX_CHUNK_LENGTH) => {
    if (text.length <= maxLength) {
        return [text];
    }

    const paragraphs = text.split(/\n{2,}/);
    const chunks = [];
    let buffer = '';

    const pushBuffer = () => {
        if (buffer.trim()) {
            chunks.push(buffer.trim());
            buffer = '';
        }
    };

    for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) {
            continue;
        }

        if (trimmed.length > maxLength) {
            pushBuffer();
            for (let i = 0; i < trimmed.length; i += maxLength) {
                chunks.push(trimmed.slice(i, i + maxLength));
            }
            continue;
        }

        if (!buffer) {
            buffer = trimmed;
            continue;
        }

        const candidate = `${buffer}\n\n${trimmed}`;
        if (candidate.length > maxLength && buffer.length >= CHUNK_SPLIT_MIN) {
            pushBuffer();
            buffer = trimmed;
        } else {
            buffer = candidate;
        }
    }

    pushBuffer();

    return chunks.length ? chunks : [text.trim()];
};

const splitMarkdownIntoSections = (markdown) => {
    const lines = markdown.split('\n');
    const sections = [];
    let current = { heading: '', level: 0, content: [] };
    let inCodeBlock = false;

    const flush = () => {
        const content = current.content.join('\n').trim();
        if (content) {
            sections.push({ ...current, content });
        }
    };

    for (const line of lines) {
        const fenceMatch = line.match(/^\s*(```|~~~)/);
        if (fenceMatch) {
            inCodeBlock = !inCodeBlock;
        }

        if (!inCodeBlock) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)\s*$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const headingText = headingMatch[2].trim();

                if (level >= 2) {
                    flush();
                    current = { heading: headingText, level, content: [] };
                    continue;
                }

                if (level === 1 && !current.heading) {
                    current.heading = headingText;
                    current.level = level;
                    continue;
                }
            }
        }

        current.content.push(line);
    }

    flush();

    return sections.length ? sections : [{ heading: '', level: 0, content: markdown.trim() }];
};

const resolveDocSlug = (frontmatter, filePath) => {
    const slug = String(frontmatter?.slug ?? '').trim();
    if (slug) {
        return slug.toLowerCase();
    }
    return path.basename(filePath, path.extname(filePath)).toLowerCase();
};

const resolveDocTitle = (frontmatter, content) => {
    const title = String(frontmatter?.title ?? '').trim();
    if (title) {
        return title;
    }
    const headingMatch = content.match(/^#\s+(.+)$/m);
    return headingMatch ? headingMatch[1].trim() : 'Doc';
};

const chunkDocument = ({
    filePath,
    content,
    frontmatter,
    kind,
    slugBase,
    anchorBase,
}) => {
    const sections = splitMarkdownIntoSections(content);
    const title = resolveDocTitle(frontmatter, content);
    const slug = slugBase;
    const pathRelative = path.relative(repoRoot, filePath).split(path.sep).join('/');

    const chunks = [];

    sections.forEach((section, sectionIndex) => {
        const heading = normalizeHeading(section.heading) || title;
        const anchor = anchorBase || slugifyHeading(section.heading) || 'top';
        const plainText = stripMarkdownToText(section.content);
        const textChunks = splitTextByLength(plainText || '');

        textChunks.forEach((textChunk, chunkIndex) => {
            const id = `${kind}:${slug}:${anchor}:${sectionIndex}:${chunkIndex}`;
            chunks.push({
                id,
                path: pathRelative,
                slug,
                title,
                heading,
                anchor,
                text: textChunk,
                kind,
            });
        });
    });

    return chunks;
};

const gatherDocs = async () => {
    await ensureFileExists(ROUTES_PATH, 'Routes index');

    const docFiles = await glob(path.join(DOCS_DIR, '**/*.md'), { nodir: true });
    const changelogFiles = await glob(path.join(CHANGELOG_DIR, '*.md'), { nodir: true });

    if (!changelogFiles.length) {
        throw new Error(`No changelog entries found in ${CHANGELOG_DIR}`);
    }

    const v3ChangelogPath = path.join(CHANGELOG_DIR, '20260301.md');
    await ensureFileExists(v3ChangelogPath, 'v3 changelog');

    const chunks = [];

    const sortedDocFiles = docFiles.sort();
    for (const filePath of sortedDocFiles) {
        if (filePath.includes(`${path.sep}changelog${path.sep}`)) {
            continue;
        }

        const raw = await readFileSafe(filePath);
        const { frontmatter, body } = parseFrontmatter(raw);
        const slugValue = resolveDocSlug(frontmatter, filePath);
        const slugBase = `/docs/${slugValue}`;

        chunks.push(
            ...chunkDocument({
                filePath,
                content: body,
                frontmatter,
                kind: 'doc',
                slugBase,
            })
        );
    }

    const sortedChangelogFiles = changelogFiles.sort();
    for (const filePath of sortedChangelogFiles) {
        const raw = await readFileSafe(filePath);
        const { frontmatter, body } = parseFrontmatter(raw);
        const entrySlug = resolveDocSlug(frontmatter, filePath);
        const slugBase = '/changelog';

        chunks.push(
            ...chunkDocument({
                filePath,
                content: body,
                frontmatter,
                kind: 'changelog',
                slugBase,
                anchorBase: entrySlug,
            })
        );
    }

    const routesContent = await readFileSafe(ROUTES_PATH);
    chunks.push(
        ...chunkDocument({
            filePath: ROUTES_PATH,
            content: routesContent,
            frontmatter: {},
            kind: 'route',
            slugBase: '/docs/routes',
            anchorBase: 'top',
        })
    );

    return chunks;
};

const buildIndex = (chunks) => {
    const miniSearch = new MiniSearch({
        idField: 'id',
        fields: ['title', 'heading', 'text', 'slug', 'path'],
        storeFields: ['id', 'slug', 'title', 'heading', 'anchor', 'kind', 'path'],
        searchOptions: {
            boost: { title: 3, heading: 2 },
        },
    });

    miniSearch.addAll(chunks);

    return miniSearch;
};

const getGitSha = () => {
    try {
        return execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
    } catch (error) {
        return null;
    }
};

const writeArtifacts = async (chunks, index) => {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const chunksPath = path.join(OUTPUT_DIR, 'docs_chunks.json');
    const indexPath = path.join(OUTPUT_DIR, 'docs_index.json');
    const metaPath = path.join(OUTPUT_DIR, 'docs_meta.json');

    const meta = {
        generatedFrom: {
            routes: path.relative(repoRoot, ROUTES_PATH).split(path.sep).join('/'),
            docs: path.relative(repoRoot, DOCS_DIR).split(path.sep).join('/'),
            changelog: path.relative(repoRoot, CHANGELOG_DIR).split(path.sep).join('/'),
        },
        counts: {
            totalChunks: chunks.length,
            docs: chunks.filter((chunk) => chunk.kind === 'doc').length,
            routes: chunks.filter((chunk) => chunk.kind === 'route').length,
            changelog: chunks.filter((chunk) => chunk.kind === 'changelog').length,
        },
        gitSha: getGitSha(),
    };

    await fs.writeFile(chunksPath, `${JSON.stringify(chunks, null, 2)}\n`);
    await fs.writeFile(indexPath, JSON.stringify(index));
    await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

    return { chunksPath, indexPath, metaPath };
};

const main = async () => {
    const chunks = await gatherDocs();

    const filtered = chunks
        .map((chunk) => ({
            ...chunk,
            text: String(chunk.text || '').trim(),
        }))
        .filter((chunk) => chunk.text && chunk.slug && chunk.anchor);

    if (!filtered.length) {
        throw new Error('No document chunks were generated.');
    }

    const index = buildIndex(filtered);
    await writeArtifacts(filtered, index);

    console.log(
        `Generated ${filtered.length} chunks into ${path.relative(repoRoot, OUTPUT_DIR)}/`
    );
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
