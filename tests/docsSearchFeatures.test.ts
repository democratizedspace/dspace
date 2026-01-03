import { describe, expect, it } from 'vitest';

import { detectDocFeatures } from '../frontend/src/utils/docsSearchFeatures.js';

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

    it('reflects features from representative doc content', () => {
        const processesDoc = detectDocFeatures(
            `
            ## Processes overview
            Learn more with our [process guide](/docs/processes-guide).

            ![Process diagram](/images/process.png)
        `
        );
        expect(processesDoc).toEqual(expect.arrayContaining(['link', 'image']));

        const missionDoc = detectDocFeatures(
            `
            ## Mission
            The mission focuses on resilience and sustainability.
        `
        );
        expect(missionDoc).not.toContain('link');
        expect(missionDoc).not.toContain('image');
    });
});
