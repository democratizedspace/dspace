import { describe, expect, test } from 'vitest';
import {
    classifyTokenPlaceContextTier,
    DEFAULT_TOKEN_PLACE_OUTPUT_TOKEN_RESERVATION,
    TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
    TOKEN_PLACE_CONTEXT_TIERS,
} from '../src/utils/tokenPlaceContextEstimator.js';
import { sanitizeTokenPlaceMessages } from '../src/utils/tokenPlaceMessages.js';

const message = (content, role = 'user') => ({ role, content });
const classify = (messages, options = {}) =>
    classifyTokenPlaceContextTier(sanitizeTokenPlaceMessages(messages), options);
const classifyRaw = (messages, options = {}) => classifyTokenPlaceContextTier(messages, options);

const fitByTokenBudget = (targetTotalTokens) => {
    const fixedOverhead = 24;
    const payloadJsonOverhead = '[{"role":"user","content":""}]'.length;
    const contentBytes = Math.max(0, (targetTotalTokens - fixedOverhead) * 3 - payloadJsonOverhead);
    return 'a'.repeat(contentBytes);
};

describe('token.place context estimator', () => {
    test('exports named 8k-fast and 64k-full profiles', () => {
        expect(TOKEN_PLACE_CONTEXT_TIERS['8k-fast']).toEqual({
            id: '8k-fast',
            totalContextTokens: 8_192,
        });
        expect(TOKEN_PLACE_CONTEXT_TIERS['64k-full']).toEqual({
            id: '64k-full',
            totalContextTokens: 65_536,
        });
    });

    test('classifies tier boundaries deterministically', () => {
        const options = { reservedOutputTokens: 0, safetyMarginTokens: 0 };
        expect(classifyRaw([message(fitByTokenBudget(8_192))], options)).toMatchObject({
            selectedTier: '8k-fast',
            overLimit: false,
            estimatedTotalTokens: 8_192,
        });
        expect(classifyRaw([message(fitByTokenBudget(8_193))], options)).toMatchObject({
            selectedTier: '64k-full',
            overLimit: false,
            estimatedTotalTokens: 8_193,
        });
        expect(classifyRaw([message(fitByTokenBudget(65_536))], options)).toMatchObject({
            selectedTier: '64k-full',
            overLimit: false,
            estimatedTotalTokens: 65_536,
        });
        expect(classifyRaw([message(fitByTokenBudget(65_537))], options)).toMatchObject({
            selectedTier: null,
            overLimit: true,
            estimatedTotalTokens: 65_537,
        });
    });

    test('classifies ASCII prose as 8k-fast', () => {
        expect(
            classify([message('DSPACE should explain the next practical quest step.')])
        ).toMatchObject({
            selectedTier: '8k-fast',
            overLimit: false,
        });
    });

    test('counts UTF-8 bytes for Unicode instead of JavaScript string length only', () => {
        const ascii = classify([message('a'.repeat(128))]);
        const unicode = classify([message('🚀'.repeat(128))]);
        expect(unicode.contentUtf8Bytes).toBeGreaterThan(ascii.contentUtf8Bytes);
        expect(unicode.estimatedPromptTokens).toBeGreaterThan(ascii.estimatedPromptTokens);
    });

    test('classifies JSON content', () => {
        const result = classify([
            message(
                JSON.stringify({
                    inventory: ['solar-panel', 'battery', 'charge-controller'],
                    quests: { solar: 'site-check', energy: 'verify' },
                })
            ),
        ]);
        expect(result.selectedTier).toBe('8k-fast');
    });

    test('classifies source code content', () => {
        const result = classify([
            message(
                `function estimate(input) {\n    return input.map((x) => x.trim()).join('\\n');\n}`
            ),
        ]);
        expect(result.selectedTier).toBe('8k-fast');
    });

    test('classifies whitespace-heavy content conservatively', () => {
        const result = classify([message(`start ${' \n\t'.repeat(2_000)} end`)]);
        expect(result.estimatedPromptTokens).toBeGreaterThan(2_000);
        expect(result.selectedTier).toBe('8k-fast');
    });

    test('classifies RAG-heavy content into the 64k-full tier when needed', () => {
        const result = classify([
            message('System instructions for DSPACE.', 'system'),
            message('docs excerpt '.repeat(15_000), 'system'),
            message('What should I do next?'),
        ]);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    test('classifies 131,072-character payloads without truncating inside the estimator', () => {
        const result = classify([message('a'.repeat(131_072))], {
            reservedOutputTokens: 512,
            safetyMarginTokens: 256,
        });
        expect(result.contentUtf8Bytes).toBe(131_072);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    test('applies configurable output-token reservation with the documented default', () => {
        const defaultResult = classify([message('hello')]);
        const largerReservation = classify([message('hello')], { reservedOutputTokens: 2_048 });
        expect(defaultResult.reservedOutputTokens).toBe(
            DEFAULT_TOKEN_PLACE_OUTPUT_TOKEN_RESERVATION
        );
        expect(largerReservation.estimatedTotalTokens - defaultResult.estimatedTotalTokens).toBe(
            2_048 - DEFAULT_TOKEN_PLACE_OUTPUT_TOKEN_RESERVATION
        );
    });

    test('returns deterministic estimator versioning', () => {
        const first = classify([message('stable')]);
        const second = classify([message('stable')]);
        expect(first).toEqual(second);
        expect(first.estimatorVersion).toBe(TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION);
    });

    test('returns explicit over-limit behavior', () => {
        const result = classifyRaw([message('a'.repeat(220_000))]);
        expect(result.selectedTier).toBeNull();
        expect(result.overLimit).toBe(true);
    });
});
