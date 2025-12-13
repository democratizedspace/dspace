import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('k3s sugarkube staging guide', () => {
    it('does not advertise unchecked staging tasks', () => {
        const docPath = join(process.cwd(), 'docs', 'k3s-sugarkube-dev.md');
        const content = readFileSync(docPath, 'utf8');

        const uncheckedItems = content.match(/-\s+\[ \]/g) || [];

        expect(uncheckedItems.length, 'Clear unchecked staging checklist items in docs').toBe(0);
    });
});
