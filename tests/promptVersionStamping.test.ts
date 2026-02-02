import { describe, expect, it, vi } from 'vitest';

describe('prompt version stamping', () => {
    it('uses the git SHA when VITE_GIT_SHA is set', async () => {
        vi.resetModules();
        vi.stubEnv('VITE_GIT_SHA', 'deadbeef');

        const { CHAT_PROMPT_VERSION } = await import('../frontend/src/utils/openAI.js');

        expect(CHAT_PROMPT_VERSION).toBe('v3:deadbeef');
        vi.unstubAllEnvs();
    });
});
