import { describe, expect, it } from 'vitest';
import { buildChatPrompt, CHAT_PROMPT_VERSION } from '../frontend/src/utils/openAI.js';

describe('chat prompt version stamp', () => {
    it('prepends prompt version header and includes guardrails', async () => {
        const { debugMessages } = await buildChatPrompt([]);
        const systemMessage = debugMessages.find((message) => message.role === 'system');
        const systemContent = systemMessage?.content ?? '';

        expect(systemContent).toContain(`Prompt version: ${CHAT_PROMPT_VERSION}`);
        expect(systemContent).toContain('Never invent quests, items, processes, routes, URLs');
        expect(systemContent).toContain('/gamesaves');
        expect(systemContent).toContain('docs/ROUTES.md');
    });
});
