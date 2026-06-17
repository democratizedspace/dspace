import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '../src/utils/settingsDefaults.js';

describe('normalizeSettings', () => {
    it.each([
        ['missing', {}, 'token-place'],
        ['null', { chatProvider: null }, 'token-place'],
        ['invalid', { chatProvider: 'legacy-token-place' }, 'token-place'],
        ['token-place', { chatProvider: 'token-place' }, 'token-place'],
        ['openai', { chatProvider: 'openai' }, 'openai'],
    ])('normalizes %s chatProvider to %s', (_caseName, settings, expectedProvider) => {
        expect(normalizeSettings(settings).chatProvider).toBe(expectedProvider);
    });

    it('keeps existing boolean settings behavior unchanged', () => {
        expect(
            normalizeSettings({
                showChatDebugPayload: 1,
                showQuestGraphVisualizer: '',
            })
        ).toMatchObject({
            showChatDebugPayload: true,
            showQuestGraphVisualizer: false,
        });
    });

    it('does not let legacy tokenPlace.enabled affect chatProvider defaults', () => {
        const legacyState = {
            tokenPlace: { enabled: false },
            settings: {},
        };

        expect(normalizeSettings(legacyState.settings).chatProvider).toBe('token-place');
    });
});
