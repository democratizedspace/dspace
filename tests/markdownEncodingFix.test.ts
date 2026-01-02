import { describe, expect, it } from 'vitest';

import { fixMarkdownText } from '../frontend/src/utils.js';

describe('fixMarkdownText encoding guardrails', () => {
    it('repairs mojibake apostrophes and dashes from docs content', () => {
        const corrupted =
            'Through gameplay, youâ€™ll learn â€“ launch â€” and iterate â€œsafelyâ€�...Â ';
        expect(fixMarkdownText(corrupted)).toBe(
            "Through gameplay, you'll learn - launch - and iterate \"safely\"..."
        );
    });

    it('normalizes curly punctuation and non-breaking spaces', () => {
        expect(fixMarkdownText('“Quoted” text — it’s resilient\u00a0')).toBe(
            "\"Quoted\" text - it's resilient"
        );
    });
});
