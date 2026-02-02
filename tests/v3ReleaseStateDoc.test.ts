import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const docPath = resolve(
    process.cwd(),
    'frontend/src/pages/docs/md/v3-release-state.md'
);

const readDoc = () => readFileSync(docPath, 'utf8');

const getSectionBody = (text: string, heading: string) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^##\\s+${escaped}\\s*$`, 'm');
    const match = regex.exec(text);
    if (!match) {
        return '';
    }
    const start = match.index + match[0].length;
    const remainder = text.slice(start);
    const nextHeading = remainder.search(/^##\s+/m);
    if (nextHeading === -1) {
        return remainder.trim();
    }
    return remainder.slice(0, nextHeading).trim();
};

describe('v3 release state doc', () => {
    it('mentions token.place deferral to v3.1', () => {
        const text = readDoc();
        expect(text).toMatch(/token\.place/i);
        expect(text).toMatch(/deferred to v3\.1/i);
        expect(text).toMatch(/OpenAI-only/i);
    });

    it('includes v2-only mechanics section with bullet list', () => {
        const text = readDoc();
        const section = getSectionBody(
            text,
            'v2-only mechanics removed / not applicable in v3'
        );

        expect(section).toBeTruthy();

        const bulletCount = section
            .split('\n')
            .filter((line) => /^-\s+/.test(line.trim())).length;

        expect(bulletCount).toBeGreaterThanOrEqual(3);
    });
});
