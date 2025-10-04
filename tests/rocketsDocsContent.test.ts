import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Rockets docs content update', () => {
    const rocketsDocPath = path.join(__dirname, '../frontend/src/pages/docs/md/rockets.md');

    it('mentions the suborbital launch checklist', () => {
        const content = fs.readFileSync(rocketsDocPath, 'utf8');
        expect(content).toContain('## Suborbital launch checklist');
        expect(content.toLowerCase()).toContain('pre-launch readiness');
        expect(content.toLowerCase()).toContain('abort criteria');
    });
});
