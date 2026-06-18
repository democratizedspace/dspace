import { describe, expect, it } from 'vitest';
import {
    DEFAULT_CHAT_PROVIDER,
    DEFAULT_SETTINGS,
    normalizeSettings,
} from '../src/utils/settingsDefaults.js';

describe('normalizeSettings', () => {
    it('defaults chatProvider to token-place', () => {
        expect(DEFAULT_CHAT_PROVIDER).toBe('token-place');
        expect(DEFAULT_SETTINGS.chatProvider).toBe('token-place');
        expect(normalizeSettings().chatProvider).toBe('token-place');
        expect(normalizeSettings({}).chatProvider).toBe('token-place');
    });

    it.each([
        ['null', { chatProvider: null }],
        ['undefined', { chatProvider: undefined }],
        ['empty string', { chatProvider: '' }],
        ['legacy value', { chatProvider: 'legacy-token-place' }],
        ['camel case', { chatProvider: 'tokenPlace' }],
        ['dotted value', { chatProvider: 'token.place' }],
        ['misspelled OpenAI', { chatProvider: 'open-ai' }],
        ['boolean', { chatProvider: false }],
    ])('normalizes %s chatProvider to token-place', (_caseName, settings) => {
        expect(normalizeSettings(settings).chatProvider).toBe('token-place');
    });

    it('persists allowed OpenAI and token.place provider values', () => {
        expect(normalizeSettings({ chatProvider: 'openai' }).chatProvider).toBe('openai');
        expect(normalizeSettings({ chatProvider: 'token-place' }).chatProvider).toBe('token-place');
    });

    it('keeps existing boolean settings behavior unchanged', () => {
        expect(
            normalizeSettings({
                chatProvider: 'openai',
                showChatDebugPayload: 1,
                showQuestGraphVisualizer: 'yes',
            })
        ).toMatchObject({
            chatProvider: 'openai',
            showChatDebugPayload: true,
            showQuestGraphVisualizer: true,
        });

        expect(
            normalizeSettings({
                showChatDebugPayload: 0,
                showQuestGraphVisualizer: '',
            })
        ).toMatchObject({
            chatProvider: 'token-place',
            showChatDebugPayload: false,
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
