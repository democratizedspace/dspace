import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/utils/settingsDefaults.js';

describe('normalizeSettings', () => {
    it('defaults chatProvider to token-place', () => {
        expect(DEFAULT_SETTINGS.chatProvider).toBe('token-place');
        expect(normalizeSettings().chatProvider).toBe('token-place');
    });

    it.each([
        ['missing', {}, 'token-place'],
        ['null', { chatProvider: null }, 'token-place'],
        ['invalid', { chatProvider: 'legacy-token-place' }, 'token-place'],
        ['legacy camel case', { chatProvider: 'tokenPlace' }, 'token-place'],
        ['misspelled openai', { chatProvider: 'open-ai' }, 'token-place'],
        ['token-place', { chatProvider: 'token-place' }, 'token-place'],
        ['openai', { chatProvider: 'openai' }, 'openai'],
    ])('normalizes %s chatProvider to %s', (_caseName, settings, expectedProvider) => {
        expect(normalizeSettings(settings).chatProvider).toBe(expectedProvider);
    });

    it('persists explicit OpenAI and token.place provider selections', () => {
        expect(normalizeSettings({ chatProvider: 'openai' }).chatProvider).toBe('openai');
        expect(normalizeSettings({ chatProvider: 'token-place' }).chatProvider).toBe('token-place');
    });

    it('keeps existing boolean settings behavior unchanged', () => {
        expect(
            normalizeSettings({
                chatProvider: 'openai',
                showChatDebugPayload: 1,
                showQuestGraphVisualizer: '',
            })
        ).toMatchObject({
            chatProvider: 'openai',
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
