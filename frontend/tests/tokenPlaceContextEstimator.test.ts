import { describe, expect, it } from 'vitest';
import {
    estimateTokenPlaceContext,
    TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
    TOKEN_PLACE_CONTEXT_TIER_PROFILES,
    TOKEN_PLACE_DEFAULT_OUTPUT_TOKEN_RESERVATION,
} from '../src/utils/tokenPlaceContextEstimator.js';

const message = (content, role = 'user') => ({ role, content });
const classify = (content, options) => estimateTokenPlaceContext([message(content)], options);

describe('token.place context estimator', () => {
    it('exports named tier profile constants', () => {
        expect(TOKEN_PLACE_CONTEXT_TIER_PROFILES['8k-fast'].totalContextTokens).toBe(8192);
        expect(TOKEN_PLACE_CONTEXT_TIER_PROFILES['64k-full'].totalContextTokens).toBe(65536);
    });

    it('classifies ASCII prose into 8k-fast when it fits', () => {
        const result = classify('Launch the rocket after checking oxygen and battery telemetry.');
        expect(result.selectedTier).toBe('8k-fast');
        expect(result.overLimit).toBe(false);
    });

    it('counts UTF-8 bytes for Unicode content', () => {
        const ascii = classify('a'.repeat(300));
        const unicode = classify('🚀'.repeat(300));
        expect(unicode.estimatedPromptTokens).toBeGreaterThan(ascii.estimatedPromptTokens);
    });

    it('classifies JSON payloads deterministically', () => {
        const payload = JSON.stringify({
            inventory: ['oxygen', 'water'],
            quests: { active: true },
        });
        expect(classify(payload)).toMatchObject({ selectedTier: '8k-fast', overLimit: false });
    });

    it('classifies source code payloads', () => {
        const source = 'function launch(step) { return step + 1; }\n'.repeat(100);
        expect(classify(source).selectedTier).toBe('8k-fast');
    });

    it('classifies whitespace-heavy content conservatively', () => {
        const result = classify(' \n\t'.repeat(2000));
        expect(result.estimatedPromptTokens).toBeGreaterThan(2000);
        expect(result.selectedTier).toBe('8k-fast');
    });

    it('classifies RAG-heavy content into 64k-full when it exceeds 8k', () => {
        const result = estimateTokenPlaceContext([
            message('DSPACE system instructions.'.repeat(100), 'system'),
            message('Retrieved docs context. '.repeat(3000), 'system'),
            message('What should I do next?'),
        ]);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    it('classifies a 131,072-character payload without truncating', () => {
        const result = classify('a'.repeat(131_072));
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    it('honors output-token reservation', () => {
        const smallReservation = classify('a'.repeat(20_000), { reservedOutputTokens: 0 });
        const largeReservation = classify('a'.repeat(20_000), { reservedOutputTokens: 4096 });
        expect(largeReservation.estimatedTotalTokens).toBeGreaterThan(
            smallReservation.estimatedTotalTokens
        );
        expect(largeReservation.reservedOutputTokens).toBe(4096);
    });

    it('returns deterministic estimator versioning', () => {
        expect(classify('same input')).toEqual(classify('same input'));
        expect(classify('same input').estimatorVersion).toBe(TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION);
        expect(classify('same input').reservedOutputTokens).toBe(
            TOKEN_PLACE_DEFAULT_OUTPUT_TOKEN_RESERVATION
        );
    });

    it('returns explicit over-limit behavior', () => {
        const result = classify('🚀'.repeat(90_000));
        expect(result.selectedTier).toBeNull();
        expect(result.overLimit).toBe(true);
        expect(result.estimatedTotalTokens).toBeGreaterThan(65_536);
    });

    it('keeps the 8k boundary strict after reservation and margin', () => {
        const fits8k = classify('a'.repeat(20_000), { reservedOutputTokens: 512 });
        const exceeds8k = classify('a'.repeat(22_700), { reservedOutputTokens: 512 });
        expect(fits8k.estimatedTotalTokens).toBeLessThanOrEqual(8192);
        expect(fits8k.selectedTier).toBe('8k-fast');
        expect(exceeds8k.estimatedTotalTokens).toBeGreaterThan(8192);
        expect(exceeds8k.selectedTier).toBe('64k-full');
    });
});
