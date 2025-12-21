import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const testingDocPath = join(process.cwd(), 'frontend', 'TESTING.md');

describe('frontend testing documentation promises', () => {
    it('does not advertise unshipped OpenAI integration for content heuristics', () => {
        const content = readFileSync(testingDocPath, 'utf8');

        expect(content).not.toMatch(/integration with the openai api is planned/i);
        expect(content).toMatch(/uses simple heuristics/i);
    });
});
