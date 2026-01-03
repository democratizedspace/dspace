import fs from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

const mojibakeTokens = [
    'â€™',
    'â€˜',
    'â€œ',
    'â€�',
    'â€“',
    'â€”',
    'â€¦',
    'â€¢',
    'Â ',
    'Â',
];

const docRoots = [
    path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs'),
    path.join(process.cwd(), 'docs'),
];

const allowedExtensions = new Set(['.md', '.mdx', '.markdown', '.astro']);
const ignoredDirectories = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
]);

function collectContentFiles(rootDir: string): string[] {
    if (!fs.existsSync(rootDir)) {
        return [];
    }

    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const entryPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            if (ignoredDirectories.has(entry.name)) {
                return [];
            }
            return collectContentFiles(entryPath);
        }
        if (!entry.isFile()) {
            return [];
        }
        return allowedExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
    });
}

const contentFiles = docRoots.flatMap(collectContentFiles);

describe('docs sources avoid mojibake', () => {
    it('rejects common mojibake markers in markdown-like content', () => {
        const offenders: { filePath: string; tokens: string[] }[] = [];

        contentFiles.forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            const matchedTokens = mojibakeTokens.filter((token) => content.includes(token));
            if (matchedTokens.length > 0) {
                offenders.push({
                    filePath,
                    tokens: Array.from(new Set(matchedTokens)),
                });
            }
        });

        if (offenders.length > 0) {
            const summary = offenders
                .map(({ filePath, tokens }) => {
                    const relativePath = path.relative(process.cwd(), filePath);
                    return `- ${relativePath}: ${tokens.join(', ')}`;
                })
                .join('\n');
            throw new Error(`Mojibake detected in docs sources:\n${summary}`);
        }
    });
});
