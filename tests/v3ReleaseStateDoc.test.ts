import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

    it('mentions the token.place deferral to v3.1', () => {
        const doc = readFileSync(docPath, 'utf8');

        expect(doc).toMatch(/OpenAI-only chat/i);
        expect(doc).toMatch(/token\.place.*deferred to v3\.1/i);
    });

    it('lists multiple v2-only mechanics removed or not applicable', () => {
        const doc = readFileSync(docPath, 'utf8');
        const sectionMatch = doc.match(
            /## v2-only mechanics removed \/ not applicable in v3\n([\s\S]*?)(\n## |\n# |$)/
        );

        expect(sectionMatch).not.toBeNull();

        const bullets = sectionMatch?.[1]?.match(/^\s*-\s+/gm) ?? [];
        expect(bullets.length).toBeGreaterThanOrEqual(3);
    });
});
