import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Quest trees documentation', () => {
    const docPath = join(
        process.cwd(),
        'frontend',
        'src',
        'pages',
        'docs',
        'md',
        'quest-trees.md'
    );
    const doc = readFileSync(docPath, 'utf8');

    it('lists the Chemistry quest line as available today', () => {
        expect(doc).toMatch(/\*\*Chemistry\*\*\s+\u2013/i);
        expect(doc).not.toMatch(/Chemistry[^\n]+being drafted/i);
    });

    it('lists the Programming quest line as available today', () => {
        expect(doc).toMatch(/\*\*Programming\*\*\s+\u2013/i);
        expect(doc).not.toMatch(/Programming[^\n]+being drafted/i);
    });

    it('does not ask readers to check back later for quest tree coverage', () => {
        expect(doc).not.toMatch(/Planned Quest Trees/i);
        expect(doc).not.toMatch(/Check back/i);
    });
});
