import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Rockets docs content update', () => {
    const rocketsDocPath = path.join(__dirname, '../frontend/src/pages/docs/md/rockets.md');

    it('mentions the guided model rocket upgrade plan', () => {
        const content = fs.readFileSync(rocketsDocPath, 'utf8');
        expect(content).toContain('## Guided model rocket upgrade plan');
        expect(content.toLowerCase()).toContain('fabrication');
        expect(content.toLowerCase()).toContain('field operations');
    });
});
