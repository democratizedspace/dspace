import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '../src/utils/settingsDefaults.js';

const expectedBooleanDefaults = {
    showChatDebugPayload: false,
    showQuestGraphVisualizer: false,
};

describe('settings defaults', () => {
    it.each([
        ['missing', {}, 'token-place'],
        ['null', { chatProvider: null }, 'token-place'],
        ['invalid', { chatProvider: 'anthropic' }, 'token-place'],
        ['token-place', { chatProvider: 'token-place' }, 'token-place'],
        ['openai', { chatProvider: 'openai' }, 'openai'],
    ])('normalizes %s chatProvider to %s', (_name, settings, expected) => {
        expect(normalizeSettings(settings).chatProvider).toBe(expected);
    });

    it('keeps existing boolean settings normalization unchanged', () => {
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

        expect(normalizeSettings()).toMatchObject({
            chatProvider: 'token-place',
            ...expectedBooleanDefaults,
        });
    });

    it('ignores legacy tokenPlace.enabled when normalizing chatProvider', () => {
        expect(
            normalizeSettings({
                tokenPlace: { enabled: false },
            }).chatProvider
        ).toBe('token-place');
    });
});
