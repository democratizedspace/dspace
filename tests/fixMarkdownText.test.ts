import { describe, expect, it } from 'vitest';

import { fixMarkdownText } from '../frontend/src/utils.js';

describe('fixMarkdownText', () => {
    it('repairs mojibake apostrophes, quotes, and dashes', () => {
        const input =
            'youâ€™ll see â€œsmartâ€� punctuation â€“ even em dashes â€” and ellipses â€¦ in text';
        const output = 'you’ll see “smart” punctuation – even em dashes — and ellipses … in text';

        expect(fixMarkdownText(input)).toBe(output);
    });

    it('removes stray non-breaking space markers', () => {
        expect(fixMarkdownText('Â This Â line')).toBe(' This  line');
    });
});
