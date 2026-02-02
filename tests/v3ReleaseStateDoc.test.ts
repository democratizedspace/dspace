import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'v3-release-state.md'
);

const readDoc = () => readFileSync(DOC_PATH, 'utf8');

describe('v3 release state doc', () => {
    it('mentions token.place deferral to v3.1', () => {
        const content = readDoc();
        expect(content).toMatch(/OpenAI-only chat/i);
        expect(content).toMatch(/token\.place[\s\S]*v3\.1/i);
    });

    it('lists v2-only mechanics with at least three bullets', () => {
        const content = readDoc();
        const sectionMatch = content.match(
            /## v2-only mechanics removed \/ not applicable in v3([\s\S]*?)(\n## |\n# |$)/i
        );
        expect(sectionMatch).not.toBeNull();
        const sectionBody = sectionMatch?.[1] ?? '';
        const bulletCount = sectionBody
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('- ')).length;
        expect(bulletCount).toBeGreaterThanOrEqual(3);
    });
});
