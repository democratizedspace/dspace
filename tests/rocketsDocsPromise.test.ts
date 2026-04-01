import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

describe('Rockets documentation promises', () => {
    const rocketsDocPath = join(
        __dirname,
        '../frontend/src/pages/docs/md/rockets.md'
    );

    it('describes the rocket launch workflow as available today', () => {
        const content = readFileSync(rocketsDocPath, 'utf8');

        expect(content).not.toMatch(/you'll eventually be able to build a fully functioning virtual rocket/i);
        expect(content).toMatch(/guided model rocket hop/i);
    });
});
