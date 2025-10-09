import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Quest Trees documentation', () => {
    const docPath = path.join(__dirname, '../frontend/src/pages/docs/md/quest-trees.md');

    it('lists Chemistry and Programming as existing quest trees', () => {
        const content = fs.readFileSync(docPath, 'utf8');
        const [existingSection] = content.split('## Planned Quest Trees');

        expect(existingSection).toContain('**Chemistry**');
        expect(existingSection).toContain('**Programming**');
    });

    it('does not mark Chemistry or Programming as planned work', () => {
        const content = fs.readFileSync(docPath, 'utf8');
        const plannedSection = content.includes('## Planned Quest Trees')
            ? content.split('## Planned Quest Trees')[1]
            : '';

        expect(plannedSection).not.toMatch(/\*\*Chemistry\*\*/);
        expect(plannedSection).not.toMatch(/\*\*Programming\*\*/);
    });
});
