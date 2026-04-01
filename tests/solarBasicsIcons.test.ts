import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const solarSteps = [1, 2, 3, 4, 5];
const solarDir = join(process.cwd(), 'assets', 'svg', 'solar');

describe('solar basics illustrations', () => {
    it.each(solarSteps)('step %s icon is production-ready art', (step) => {
        const filePath = join(solarDir, `step${step}.svg`);
        const svg = readFileSync(filePath, 'utf8');

        expect(svg).not.toMatch(/placeholder/i);
        expect(svg).not.toMatch(/step\d/i);
        expect(svg).toMatch(/<path[^>]*>/i);
    });
});
