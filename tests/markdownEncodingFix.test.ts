import { describe, expect, it } from 'vitest';

import { fixMarkdownText } from '../frontend/src/utils.js';

describe('fixMarkdownText encoding guardrails', () => {
    it('repairs mojibake apostrophes and dashes from docs content', () => {
        const corrupted =
            'Through gameplay, you\u00e2\u0080\u0099ll learn \u00e2\u0080\u0093 launch \u00e2\u0080\u0094 and iterate \u00e2\u0080\u009csafely\u00e2\u0080\u009d...\u00c2 ';
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
