import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Quest grid layout styles', () => {
    it('stretches cards so each row matches tallest card height', () => {
        const questsPageSource = fs.readFileSync(
            'frontend/src/pages/quests/svelte/Quests.svelte',
            'utf8'
        );
        const questCardSource = fs.readFileSync(
            'frontend/src/pages/quests/svelte/Quest.svelte',
            'utf8'
        );

        expect(questsPageSource).toContain('align-items: stretch;');
        expect(questsPageSource).toContain('.quests-grid > a');
        expect(questsPageSource).toContain('height: 100%;');
        expect(questCardSource).toContain('.container');
        expect(questCardSource).toContain('.content');
        expect(questCardSource).toContain('height: 100%;');
    });
});
