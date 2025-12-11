import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes, renderChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('June 30, 2023 changelog inventory filters promise', () => {
    const changelogPath = join(
        process.cwd(),
        'frontend',
        'src',
        'pages',
        'docs',
        'md',
        'changelog',
        '20230630.md'
    );

    it('is paired with a follow-up note that links to the delivered inventory filters', () => {
        const content = readFileSync(changelogPath, 'utf8');

        expect(content).toMatch(/item filters are also on the horizon/i);

        const notes = getChangelogNotes('20230630');
        const inventoryNote = notes.find((note) => note.href === '/docs/inventory');

        expect(inventoryNote).toBeDefined();
        expect(inventoryNote?.message).toMatch(/category chips on the Inventory page/i);
        expect(inventoryNote?.linkLabel).toMatch(/inventory guide/i);

        const rendered = renderChangelogNotes('20230630');
        expect(rendered).toContain('<a href="/docs/inventory">Inventory guide</a>');
    });
});
