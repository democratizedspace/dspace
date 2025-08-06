import { describe, it, expect } from 'vitest';
import config from '../astro.config.mjs';
import textToPlain from '../scripts/remark-text-to-plain.js';

describe('astro markdown config', () => {
    it('maps text code fences to plaintext', () => {
        expect(config.markdown?.remarkPlugins).toContain(textToPlain);
    });
});
