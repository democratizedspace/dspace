import { describe, expect, it } from 'vitest';

import { chatUiContractFor } from '../e2e/remote-chat-smoke-contract';

describe('remote chat smoke UI contract selection', () => {
    it('uses modern settings for modern build identity', () => {
        expect(chatUiContractFor('build-info-v1')).toBe('modern-settings-v1');
    });

    it('uses inline OpenAI configuration for the immutable recovery identity', () => {
        expect(chatUiContractFor('legacy-build-meta-v1')).toBe('legacy-inline-openai-v1');
    });
});
