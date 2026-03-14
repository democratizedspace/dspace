import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const docsRoot = path.join(process.cwd(), 'frontend/src/pages/docs/md');

function collectMarkdownFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return collectMarkdownFiles(fullPath);
        }
        return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
    });
}

describe('Docs markdown safety', () => {
    it('does not allow embedded <style> blocks in docs markdown', () => {
        const docsWithStyleTags = collectMarkdownFiles(docsRoot)
            .map((file) => ({
                file,
                content: fs.readFileSync(file, 'utf8'),
            }))
            .filter(({ content }) => {
                const withoutFencedCode = content.replace(/```[\s\S]*?```/g, '');
                const withoutInlineCode = withoutFencedCode.replace(/`[^`]*`/g, '');
                return /<style\b[^>]*>/i.test(withoutInlineCode);
            })
            .map(({ file }) => path.relative(process.cwd(), file));

        expect(docsWithStyleTags).toEqual([]);
    });
});
