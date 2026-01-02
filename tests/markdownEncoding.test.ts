import { describe, expect, it } from 'vitest';
import { fixMarkdownText } from '../frontend/src/utils.js';

describe('markdown encoding hardening', () => {
    it('repairs mojibake curly punctuation', () => {
        const brokenText =
            'youâ€™ll see â€œsmartâ€� quotes, dashes â€“ and â€” plus ellipsis â€¦ and bullets â€¢';

        expect(fixMarkdownText(brokenText)).toBe(
            'you’ll see “smart” quotes, dashes – and — plus ellipsis … and bullets •'
        );
    });

    it('leaves clean ASCII content untouched', () => {
        const plain = "Keep ASCII quotes like 'this' and hyphens - as-is.";
        expect(fixMarkdownText(plain)).toBe(plain);
    });
});
