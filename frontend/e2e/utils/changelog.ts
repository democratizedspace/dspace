import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ChangelogMeta = {
    slug: string;
    title: string;
    tagline?: string;
    summary?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const changelogDir = path.resolve(__dirname, '../../src/pages/docs/md/changelog');

const parseFrontmatter = (frontmatter: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = frontmatter.split('\n');
    let currentKey: string | null = null;
    let blockLines: string[] = [];

    const commitBlock = () => {
        if (currentKey) {
            result[currentKey] = blockLines.join('\n').trim();
        }
        currentKey = null;
        blockLines = [];
    };

    for (const line of lines) {
        if (currentKey) {
            if (/^\s/.test(line)) {
                blockLines.push(line.trim());
                continue;
            }

            if (!line.trim()) {
                blockLines.push('');
                continue;
            }

            commitBlock();
        }

        if (!line.trim()) {
            continue;
        }

        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();

        if (value === '>-') {
            currentKey = key;
            blockLines = [];
            continue;
        }

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    }

    if (currentKey) {
        commitBlock();
    }

    return result;
};

const getChangelogFrontmatter = (filePath: string): ChangelogMeta | null => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const match = raw.match(/^---\n([\s\S]+?)\n---/);

    if (!match) {
        return null;
    }

    const frontmatter = parseFrontmatter(match[1]);

    if (!frontmatter.slug || !frontmatter.title) {
        return null;
    }

    return {
        slug: frontmatter.slug,
        title: frontmatter.title,
        tagline: frontmatter.tagline,
        summary: frontmatter.summary,
    };
};

export const getChangelogEntries = (): ChangelogMeta[] => {
    if (!fs.existsSync(changelogDir)) {
        return [];
    }

    return fs
        .readdirSync(changelogDir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => getChangelogFrontmatter(path.join(changelogDir, file)))
        .filter((meta): meta is ChangelogMeta => Boolean(meta))
        .sort((a, b) => String(b.slug).localeCompare(String(a.slug)));
};

export const getLatestChangelogMeta = (): ChangelogMeta | null => {
    const entries = getChangelogEntries();
    return entries[0] ?? null;
};
