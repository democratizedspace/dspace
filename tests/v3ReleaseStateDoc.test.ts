import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('v3 release state doc', () => {
    const docPath = join(
        process.cwd(),
        'frontend',
        'src',
        'pages',
        'docs',
        'md',
        'v3-release-state.md'
    );

    const content = readFileSync(docPath, 'utf8');

    it('documents token.place deferral', () => {
        expect(content).toMatch(/OpenAI-only chat/i);
        expect(content).toMatch(/token\.place[\s\S]*deferred to v3\.1/i);
    });

    it('includes a v2-only mechanics section with bullets', () => {
        const sectionMatch = content.match(
            /## v2-only mechanics removed \/ not applicable in v3[\s\S]*?(?=\n## |\n# |$)/
        );
        expect(sectionMatch).not.toBeNull();

        const bulletCount = sectionMatch
            ? (sectionMatch[0].match(/^\s*-\s+/gm) || []).length
            : 0;
        expect(bulletCount).toBeGreaterThanOrEqual(3);
    });
});
