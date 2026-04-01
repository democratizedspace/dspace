import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Rockets docs content update', () => {
    const rocketsDocPath = path.join(__dirname, '../frontend/src/pages/docs/md/rockets.md');

    it('documents the guided model rocket hop playbook', () => {
        const content = fs.readFileSync(rocketsDocPath, 'utf8');
        expect(content).toContain('## Guided model rocket hop playbook');
        expect(content.toLowerCase()).toContain('fabrication and bench testing');
        expect(content.toLowerCase()).toContain('simulation and launch day');
    });
});
