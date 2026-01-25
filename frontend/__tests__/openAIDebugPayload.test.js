import { describe, it, expect } from 'vitest';
import { buildChatMessages } from '../src/utils/openAI.js';

describe('buildChatMessages', () => {
    it('includes system, RAG, and conversation entries with sources', () => {
        const persona = {
            systemPrompt: 'System prompt',
            welcomeMessage: 'Welcome to DSPACE.',
        };
        const messages = [{ role: 'user', content: 'Hello!' }];

        const payload = buildChatMessages(messages, {
            persona,
            gameState: {},
            knowledgeSummary: 'Quest: test context',
        });

        expect(payload[0]).toMatchObject({
            role: 'system',
            content: 'System prompt',
            source: 'system',
        });
        expect(payload[1]).toMatchObject({
            role: 'system',
            content: 'DSPACE knowledge base:\nQuest: test context',
            source: 'rag',
        });
        expect(payload[2]).toMatchObject({
            role: 'user',
            content: 'Hello!',
            source: 'conversation',
        });
    });
});
