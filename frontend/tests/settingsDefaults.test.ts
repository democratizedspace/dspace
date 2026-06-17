import { describe, expect, test } from 'vitest';
import { normalizeSettings } from '../src/utils/settingsDefaults.js';
import { validateGameState } from '../src/utils/gameState/common.js';

describe('settings defaults', () => {
    test.each([
        ['missing chatProvider', {}, 'token-place'],
        ['null chatProvider', { chatProvider: null }, 'token-place'],
        ['invalid chatProvider', { chatProvider: 'token.place' }, 'token-place'],
        ['token-place chatProvider', { chatProvider: 'token-place' }, 'token-place'],
        ['openai chatProvider', { chatProvider: 'openai' }, 'openai'],
    ])('normalizes %s', (_label, settings, expected) => {
        expect(normalizeSettings(settings).chatProvider).toBe(expected);
    });

    test('preserves existing boolean settings normalization', () => {
        expect(
            normalizeSettings({
                showChatDebugPayload: 1,
                showQuestGraphVisualizer: '',
            })
        ).toMatchObject({
            chatProvider: 'token-place',
            showChatDebugPayload: true,
            showQuestGraphVisualizer: false,
        });
    });

    test('legacy tokenPlace.enabled does not affect chatProvider default', () => {
        const state = validateGameState({
            quests: {},
            inventory: {},
            processes: {},
            tokenPlace: { enabled: false },
            settings: {},
        });

        expect(state.settings.chatProvider).toBe('token-place');
        expect(state.tokenPlace.enabled).toBe(false);
    });
});
