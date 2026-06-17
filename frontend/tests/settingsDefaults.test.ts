import { normalizeSettings } from '../src/utils/settingsDefaults.js';

describe('settings defaults normalization', () => {
    test.each([
        ['missing chatProvider', {}, 'token-place'],
        ['null chatProvider', { chatProvider: null }, 'token-place'],
        ['invalid chatProvider', { chatProvider: 'legacy-token-place' }, 'token-place'],
        ['token-place chatProvider', { chatProvider: 'token-place' }, 'token-place'],
        ['openai chatProvider', { chatProvider: 'openai' }, 'openai'],
    ])('%s normalizes to %s', (_label, input, expected) => {
        expect(normalizeSettings(input).chatProvider).toBe(expected);
    });

    test('preserves existing boolean normalization behavior', () => {
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
        expect(
            normalizeSettings({
                tokenPlace: { enabled: false },
            }).chatProvider
        ).toBe('token-place');
    });
});
