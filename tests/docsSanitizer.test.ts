import { describe, expect, it } from 'vitest';

import { sanitizeDocsHtml } from '../frontend/src/utils/docsSanitizer';

describe('sanitizeDocsHtml', () => {
    it('strips markdown-embedded style blocks that can float images into body text', () => {
        const html = sanitizeDocsHtml(`
<h2>NPC</h2>
<img src="/assets/npc/sydney.jpg" />
<p>Bio paragraph.</p>
<style>
img { float: left; width: 150px; }
</style>
`);

        expect(html).toContain('<img src="/assets/npc/sydney.jpg">');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('float: left');
    });

    it('strips script tags from docs html payloads', () => {
        const html = sanitizeDocsHtml('<p>ok</p><script>alert("x")</script>');

        expect(html).toContain('<p>ok</p>');
        expect(html).not.toContain('<script>');
    });
});
