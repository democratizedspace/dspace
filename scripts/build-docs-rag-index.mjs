import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import { glob } from 'glob';
import yaml from 'yaml';
import { execSync } from 'node:child_process';
import GithubSlugger from 'github-slugger';
import prettier from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DOCS_DIR = path.join(repoRoot, 'frontend/src/pages/docs/md');
const ROUTES_PATH = path.join(repoRoot, 'docs/ROUTES.md');
const CHANGELOG_DIR = path.join(DOCS_DIR, 'changelog');
const OUTPUT_DIR = path.join(repoRoot, 'frontend/src/generated/rag');
const CHANGELOG_CANDIDATES = [
    path.join(repoRoot, 'docs/CHANGELOG.md'),
    path.join(repoRoot, 'docs/changelog.md'),
    path.join(repoRoot, 'docs/release-notes.md'),
    path.join(repoRoot, 'frontend/src/pages/docs/md/changelog*.md'),
    path.join(repoRoot, 'frontend/src/pages/docs/md/changelog/*.md'),
];

const MAX_CHUNK_LENGTH = 6000;
const CHUNK_SPLIT_MIN = 2000;
const FRONTEND_PRETTIER_TARGET = path.join(
    repoRoot,
    'frontend/src/generated/rag/docs_chunks.json'
);

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

const formatJson = async (data, targetPath) => {
    const config = (await prettier.resolveConfig(targetPath)) ?? {};
    const formatted = await prettier.format(JSON.stringify(data), {
        ...config,
        parser: 'json',
    });
    return `${formatted.trimEnd()}\n`;
};

const parseFrontmatter = (content) => {
    if (!content.startsWith('---')) {
        return { frontmatter: {}, body: content };
    }

    const endIndex = content.indexOf('\n---\n', 3);
    if (endIndex === -1) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterRaw = content.slice(3, endIndex).trim();
    const body = content.slice(endIndex + 4).replace(/^\s+/, '');
    const frontmatter = frontmatterRaw ? yaml.parse(frontmatterRaw) ?? {} : {};
    return { frontmatter, body };
};

const normalizeHeading = (value) => String(value || '').trim();

const stripMarkdownToText = (markdown) => {
    if (!markdown) {
        return '';
    }

    let text = markdown;

    text = text.replace(/^---[\s\S]*?---/g, ' ');
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`([^`]*)`/g, '$1');
    text = text.replace(/!\[([^\]]*)]\([^)]*\)/g, '$1');
    text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/^\s*#+\s*/gm, '');
    text = text.replace(/^\s*>\s*/gm, '');
    text = text.replace(/[*~]+/g, '');
    text = text.replace(/\n{2,}/g, '\n\n');
    text = text.replace(/\n(?!\n)/g, ' ');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\n+/g, '\n\n').trim();

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
    if (!slug) {
        throw new Error(`Missing docs slug in ${path.relative(repoRoot, filePath)}`);
    }
    return slug.toLowerCase();
};

const resolveChangelogSlug = (frontmatter, filePath) => {
    const slug = String(frontmatter?.slug ?? '').trim();
    if (slug) {
        return slug.toLowerCase();
    }

    return path.basename(filePath, path.extname(filePath)).toLowerCase();
};

const resolveDocSlugBase = (frontmatter, filePath) => {
    const slugValue = resolveDocSlug(frontmatter, filePath);

    if (slugValue.startsWith('/docs/')) {
        return slugValue;
    }
    if (slugValue.startsWith('/')) {
        return `/docs${slugValue}`;
    }

    const relativePath = path.relative(DOCS_DIR, filePath);
    const normalizedRelative = relativePath.split(path.sep).join('/');
    const relativeDir = path.posix.dirname(normalizedRelative);

    if (relativeDir === '.') {
        return `/docs/${slugValue}`;
    }

    if (relativeDir === 'outages') {
        return `/docs/outages/${slugValue}`;
    }

    throw new Error(
        `Unhandled docs route for ${path.relative(repoRoot, filePath)} (dir: ${relativeDir})`
    );
};

const resolveHeadingText = (heading) => stripMarkdownToText(heading);

const resolveSectionAnchor = ({ slugger, heading, anchorBase }) => {
    if (anchorBase) {
        return anchorBase;
    }

    const normalizedHeading = normalizeHeading(resolveHeadingText(heading));
    if (!normalizedHeading) {
        return 'top';
    }

    return slugger.slug(normalizedHeading) || 'top';
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
    const slugger = new GithubSlugger();

    const chunks = [];

    sections.forEach((section, sectionIndex) => {
        const heading = normalizeHeading(resolveHeadingText(section.heading)) || title;
        const anchor = resolveSectionAnchor({ slugger, heading: section.heading, anchorBase });
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

const discoverChangelogSources = async () => {
    const sources = new Set();

    for (const candidate of CHANGELOG_CANDIDATES) {
        if (candidate.includes('*')) {
            const matches = await glob(candidate, { nodir: true });
            matches.forEach((match) => sources.add(match));
            continue;
        }

        try {
            const stat = await fs.stat(candidate);
            if (stat.isFile()) {
                sources.add(candidate);
            }
        } catch (error) {
            // Ignore missing optional candidates.
        }
    }

    const sorted = Array.from(sources).sort();

    if (!sorted.length) {
        throw new Error(
            `No changelog or release notes sources found. Checked: ${CHANGELOG_CANDIDATES.join(
                ', '
            )}`
        );
    }

    return sorted;
};

const isV3ChangelogSource = ({ filePath, frontmatter, body }) => {
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('v3')) {
        return true;
    }

    const frontmatterText = [
        frontmatter?.version,
        frontmatter?.tagline,
        frontmatter?.summary,
        frontmatter?.title,
    ]
        .filter(Boolean)
        .join(' ');

    if (/\bv3\b/i.test(frontmatterText)) {
        return true;
    }

    const hasV3Header = body
        .split('\n')
        .some((line) => /^#{1,6}\s+.*\bv3\b/i.test(line));

    return hasV3Header;
};

const gatherDocs = async () => {
    await ensureFileExists(ROUTES_PATH, 'Routes index');

    const docFiles = await glob(path.join(DOCS_DIR, '**/*.md'), { nodir: true });
    const changelogFiles = await discoverChangelogSources();

    const chunks = [];
    const v3ChangelogSources = [];

    const sortedDocFiles = docFiles.sort();
    for (const filePath of sortedDocFiles) {
        if (filePath.includes(`${path.sep}changelog${path.sep}`)) {
            continue;
        }

        const raw = await readFileSafe(filePath);
        const { frontmatter, body } = parseFrontmatter(raw);
        const slugBase = resolveDocSlugBase(frontmatter, filePath);

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

    for (const filePath of changelogFiles) {
        const raw = await readFileSafe(filePath);
        const { frontmatter, body } = parseFrontmatter(raw);
        const entrySlug = resolveChangelogSlug(frontmatter, filePath);
        const qualifiesAsV3 = isV3ChangelogSource({ filePath, frontmatter, body });
        if (qualifiesAsV3) {
            v3ChangelogSources.push(filePath);
        }
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

    if (!v3ChangelogSources.length) {
        throw new Error(
            `No v3 changelog or release notes sources found in: ${changelogFiles
                .map((filePath) => path.relative(repoRoot, filePath))
                .join(', ')}`
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

    return { chunks, changelogFiles, v3ChangelogSources };
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

const writeArtifacts = async (chunks, index, metaSources) => {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const chunksPath = path.join(OUTPUT_DIR, 'docs_chunks.json');
    const indexPath = path.join(OUTPUT_DIR, 'docs_index.json');
    const metaPath = path.join(OUTPUT_DIR, 'docs_meta.json');

    const meta = {
        generatedAt: new Date().toISOString(),
        generatedFrom: {
            routes: path.relative(repoRoot, ROUTES_PATH).split(path.sep).join('/'),
            docs: path.relative(repoRoot, DOCS_DIR).split(path.sep).join('/'),
            changelog: path.relative(repoRoot, CHANGELOG_DIR).split(path.sep).join('/'),
        },
        sources: metaSources,
        counts: {
            totalChunks: chunks.length,
            docs: chunks.filter((chunk) => chunk.kind === 'doc').length,
            routes: chunks.filter((chunk) => chunk.kind === 'route').length,
            changelog: chunks.filter((chunk) => chunk.kind === 'changelog').length,
        },
        gitSha: getGitSha(),
    };

    const [chunksOutput, indexOutput, metaOutput] = await Promise.all([
        formatJson(chunks, FRONTEND_PRETTIER_TARGET),
        formatJson(index, FRONTEND_PRETTIER_TARGET),
        formatJson(meta, FRONTEND_PRETTIER_TARGET),
    ]);
    await fs.writeFile(chunksPath, chunksOutput);
    await fs.writeFile(indexPath, indexOutput);
    await fs.writeFile(metaPath, metaOutput);

    return { chunksPath, indexPath, metaPath };
};

const main = async () => {
    const { chunks, changelogFiles, v3ChangelogSources } = await gatherDocs();

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
    await writeArtifacts(filtered, index, {
        changelog: changelogFiles.map((filePath) =>
            path.relative(repoRoot, filePath).split(path.sep).join('/')
        ),
        v3Changelog: v3ChangelogSources.map((filePath) =>
            path.relative(repoRoot, filePath).split(path.sep).join('/')
        ),
    });

    console.log(
        `Generated ${filtered.length} chunks into ${path.relative(repoRoot, OUTPUT_DIR)}/`
    );
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
