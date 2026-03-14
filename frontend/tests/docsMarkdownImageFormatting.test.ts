import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const docsRoot = path.join(process.cwd(), 'frontend/src/pages/docs/md');

const walkMarkdownFiles = (dir: string): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkMarkdownFiles(entryPath));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(entryPath);
        }
    }

    return files;
};

const getDocFiles = () =>
    walkMarkdownFiles(docsRoot).filter((file) => !file.includes(`${path.sep}changelog${path.sep}`));

describe('docs markdown image formatting', () => {
    it('keeps raw <img> tags separated by blank lines for block rendering', () => {
        const offenders: string[] = [];

        for (const file of getDocFiles()) {
            const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
            let inFigureBlock = false;

            for (let index = 0; index < lines.length; index += 1) {
                const line = lines[index];

                if (line.includes('<figure')) {
                    inFigureBlock = true;
                }
                if (line.includes('</figure>')) {
                    inFigureBlock = false;
                    continue;
                }

                if (!/^\s*<img\b/i.test(line) || inFigureBlock) {
                    continue;
                }

                const previous = index > 0 ? lines[index - 1] : '';
                const next = index + 1 < lines.length ? lines[index + 1] : '';
                const hasBlankPadding = previous.trim() === '' && next.trim() === '';

                if (!hasBlankPadding) {
                    offenders.push(`${path.relative(process.cwd(), file)}:${index + 1}`);
                }
            }
        }

        expect(offenders).toEqual([]);
    });

    it('does not float doc images via markdown <style> blocks', () => {
        const offenders: string[] = [];

        for (const file of getDocFiles()) {
            const content = fs.readFileSync(file, 'utf8');
            const styleBlocks = content.match(/<style>[\s\S]*?<\/style>/gi) ?? [];

            for (const block of styleBlocks) {
                if (/img\s*\{[\s\S]*?float\s*:/i.test(block)) {
                    offenders.push(path.relative(process.cwd(), file));
                    break;
                }
            }
        }

        expect(offenders).toEqual([]);
    });
});
