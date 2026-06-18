import { describe, expect, it } from 'vitest';
import {
    DEFAULT_CHAT_PROVIDER,
    DEFAULT_SETTINGS,
    normalizeSettings,
} from '../src/utils/settingsDefaults.js';

describe('normalizeSettings', () => {
    it('declares token-place as the default chat provider', () => {
        expect(DEFAULT_CHAT_PROVIDER).toBe('token-place');
        expect(DEFAULT_SETTINGS.chatProvider).toBe('token-place');
        expect(normalizeSettings().chatProvider).toBe('token-place');
    });

    it.each([
        { caseName: 'missing', settings: {}, expectedProvider: 'token-place' },
        { caseName: 'null', settings: { chatProvider: null }, expectedProvider: 'token-place' },
        {
            caseName: 'invalid',
            settings: { chatProvider: 'legacy-token-place' },
            expectedProvider: 'token-place',
        },
        {
            caseName: 'undefined',
            settings: { chatProvider: undefined },
            expectedProvider: 'token-place',
        },
        {
            caseName: 'token-place',
            settings: { chatProvider: 'token-place' },
            expectedProvider: 'token-place',
        },
        { caseName: 'openai', settings: { chatProvider: 'openai' }, expectedProvider: 'openai' },
    ])(
        'normalizes $caseName chatProvider to $expectedProvider',
        ({ settings, expectedProvider }) => {
            expect(normalizeSettings(settings).chatProvider).toBe(expectedProvider);
        }
    );

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
        expect(
            normalizeSettings({ ...legacyState.tokenPlace, chatProvider: undefined }).chatProvider
        ).toBe('token-place');
    });
});
