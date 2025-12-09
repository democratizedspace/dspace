import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Roadmap documentation promises', () => {
    it('does not advertise unchecked roadmap tasks', () => {
        const roadmapPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'roadmap.md'
        );

        const content = readFileSync(roadmapPath, 'utf8');

        expect(content).not.toMatch(/- \[ \]/);
        expect(content).toMatch(/multiplayer.+deferred/i);
    });
});
