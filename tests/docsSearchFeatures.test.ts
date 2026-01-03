import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { detectDocFeatures } from '../frontend/src/utils/docsSearchFeatures.js';

const readDoc = (slug: string) =>
    fs.readFileSync(path.join(process.cwd(), 'frontend/src/pages/docs/md', `${slug}.md`), 'utf8');

describe('detectDocFeatures', () => {
    it('identifies link and image markers in markdown content', () => {
        expect(detectDocFeatures('Plain text')).toEqual([]);
        expect(detectDocFeatures('[link](https://example.com)')).toEqual(['link']);
        expect(detectDocFeatures('![alt text](/image.png)')).toEqual(['image']);
        expect(
            detectDocFeatures(
                '<a href="https://example.com">External</a><img src="/assets/image.png" />'
            )
        ).toEqual(['link', 'image']);
    });

    it('reflects features from real docs', () => {
        const processesDoc = detectDocFeatures(readDoc('processes'));
        expect(processesDoc).toEqual(expect.arrayContaining(['link', 'image']));

        const missionDoc = detectDocFeatures(readDoc('mission'));
        expect(missionDoc).not.toContain('link');
        expect(missionDoc).not.toContain('image');
    });
});
