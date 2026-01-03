import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

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

function collectDocFiles(rootDir: string): string[] {
    if (!fs.existsSync(rootDir)) {
        return [];
    }

    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const entryPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            return collectDocFiles(entryPath);
        }

        const extension = path.extname(entry.name).toLowerCase();
        return entry.isFile() && allowedExtensions.has(extension) ? [entryPath] : [];
    });
}

const docFiles = docRoots.flatMap(collectDocFiles);

describe('docs source mojibake scan', () => {
    it('rejects common mojibake markers in source content', () => {
        const offenders: string[] = [];

        docFiles.forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            const matches = new Set(mojibakeTokens.filter((token) => content.includes(token)));

            if (matches.size > 0) {
                offenders.push(`${filePath}: ${Array.from(matches).join(', ')}`);
            }
        });

        expect(offenders).toEqual([]);
    });
});
