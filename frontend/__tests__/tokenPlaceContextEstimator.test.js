import { describe, expect, test } from 'vitest';
import {
    DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS,
    TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
    TOKEN_PLACE_CONTEXT_TIERS,
    estimateTokenPlaceContext,
    estimateTokenPlaceContextForSanitizedMessages,
} from '../src/utils/tokenPlaceContextEstimator.js';

const classifyContent = (content, options = {}) =>
    estimateTokenPlaceContext([{ role: 'user', content }], options);

const repeat = (chunk, chars) => chunk.repeat(Math.ceil(chars / chunk.length)).slice(0, chars);

describe('token.place context estimator', () => {
    test('exports named 8K and 64K profile constants', () => {
        expect(TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].totalContextTokens).toBe(8192);
        expect(TOKEN_PLACE_CONTEXT_TIERS['64k-full'].totalContextTokens).toBe(65536);
    });

    test('classifies ASCII prose into the fast tier', () => {
        const result = classifyContent('DSPACE can explain solar panels and early quests.');
        expect(result.selectedTier).toBe('8k-fast');
        expect(result.overLimit).toBe(false);
        expect(result.payloadUtf8Bytes).toBeGreaterThan(result.messageCount);
    });

    test('counts UTF-8 bytes for Unicode instead of JavaScript string length only', () => {
        const result = classifyContent('🚀🌕 café composting');
        expect(result.payloadUtf8Bytes).toBeGreaterThan('🚀🌕 café composting'.length);
        expect(result.selectedTier).toBe('8k-fast');
    });

    test('classifies JSON payloads deterministically', () => {
        const content = JSON.stringify({ inventory: ['solar-panel'], quests: { start: true } });
        expect(classifyContent(content)).toMatchObject({
            selectedTier: '8k-fast',
            overLimit: false,
        });
    });

    test('classifies source code payloads', () => {
        const content = repeat('function launch(seed) { return seed.map((x) => x + 1); }\n', 30000);
        const result = classifyContent(content);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    test('classifies whitespace-heavy content conservatively', () => {
        const result = estimateTokenPlaceContextForSanitizedMessages([
            { role: 'user', content: repeat(' \n\t', 24000) },
        ]);
        expect(result.estimatedPromptTokens).toBeGreaterThan(7000);
        expect(result.selectedTier).toBe('64k-full');
    });

    test('classifies RAG-heavy multi-message content in 64K when it exceeds 8K', () => {
        const messages = [
            { role: 'system', content: repeat('DSPACE docs excerpt. ', 28000) },
            { role: 'system', content: repeat('PlayerState inventory quest process. ', 12000) },
            { role: 'user', content: 'What should I build next?' },
        ];
        const result = estimateTokenPlaceContext(messages);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.estimatedTotalTokens).toBeGreaterThan(8192);
    });

    test('classifies 131,072-character payloads without truncating in the estimator', () => {
        const result = classifyContent(repeat('a', 131072));
        expect(result.payloadUtf8Bytes).toBeGreaterThanOrEqual(131072);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    test('honors output-token reservation', () => {
        const defaultResult = classifyContent(repeat('a', 20000));
        const largerReservation = classifyContent(repeat('a', 20000), {
            reservedOutputTokens: 4096,
        });
        expect(defaultResult.reservedOutputTokens).toBe(
            DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS
        );
        expect(largerReservation.estimatedTotalTokens - defaultResult.estimatedTotalTokens).toBe(
            4096 - DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS
        );
    });

    test('keeps estimator version deterministic', () => {
        const result = classifyContent('version check');
        expect(result.estimatorVersion).toBe(TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION);
        expect(TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION).toBe('dspace-token-context-estimator-v1');
    });

    test('returns explicit over-limit result', () => {
        const result = estimateTokenPlaceContextForSanitizedMessages([
            { role: 'user', content: repeat('x', 210000) },
        ]);
        expect(result.selectedTier).toBeNull();
        expect(result.overLimit).toBe(true);
        expect(result.estimatedTotalTokens).toBeGreaterThan(65536);
    });

    test('preserves boundary policy: 8K only when total estimate fits 8,192', () => {
        const near8k = classifyContent(repeat('a', 22000), {
            reservedOutputTokens: 1,
            safetyMarginTokens: 0,
        });
        const above8k = classifyContent(repeat('a', 25000), {
            reservedOutputTokens: 1,
            safetyMarginTokens: 0,
        });
        expect(near8k.estimatedTotalTokens).toBeLessThanOrEqual(8192);
        expect(near8k.selectedTier).toBe('8k-fast');
        expect(above8k.estimatedTotalTokens).toBeGreaterThan(8192);
        expect(above8k.selectedTier).toBe('64k-full');
    });
});
