import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('June 30, 2023 changelog NPC chat promise', () => {
    it('is paired with a follow-up note describing the delivered NPC chat experience', () => {
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

        const content = readFileSync(changelogPath, 'utf8');

        expect(content).toMatch(/open-ended questions to NPCs/i);

        const notes = getChangelogNotes('20230630');
        const npcNote = notes.find((note) => note.href === '/docs/npcs');

        expect(npcNote).toBeDefined();
        expect(npcNote?.message).toMatch(/open-ended NPC chat/i);
        expect(npcNote?.linkLabel).toMatch(/NPC guide/i);
    });
});
