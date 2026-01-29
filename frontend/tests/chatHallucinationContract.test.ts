import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
    })),
    ready: Promise.resolve(),
}));

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledgePack: vi.fn(() => ({ summary: '', sources: [] })),
}));

import { buildChatPrompt } from '../src/utils/openAI.js';
import { searchDocsRag } from '../src/utils/docsRag.js';

const probes = [
    'How do I add custom content to DSPACE?',
    'Where do I edit quests?',
    'What can I back up or export?',
    "What's in my inventory right now?",
    'Is token.place active?',
    'What are the current game routes?',
];

const ragCoverageChecks = [
    {
        prompt: 'How do I add custom content to DSPACE?',
        type: 'doc',
        urlPrefix: '/docs/',
        ragNeedle: '/docs/',
    },
    {
        prompt: 'Where do I edit quests?',
        type: 'doc',
        urlPrefix: '/docs/',
        ragNeedle: '/docs/',
    },
    {
        prompt: 'What can I back up or export?',
        type: 'doc',
        urlPrefix: '/docs/',
        ragNeedle: '/docs/',
    },
    {
        prompt: 'Is token.place active?',
        type: 'changelog',
        urlPrefix: '/changelog',
        ragNeedle: '/changelog',
    },
    {
        prompt: 'What are the current game routes?',
        type: 'route',
        urlPrefix: '/docs/routes',
        ragNeedle: '/docs/routes',
    },
];

const compareSources = (a, b) => {
    const typeCompare = a.type.localeCompare(b.type);
    if (typeCompare !== 0) return typeCompare;
    const labelCompare = (a.label || '').localeCompare(b.label || '');
    if (labelCompare !== 0) return labelCompare;
    return String(a.id).localeCompare(String(b.id));
};

const assertSourcesDeterministic = (sources) => {
    const sorted = [...sources].sort(compareSources);
    expect(sources).toEqual(sorted);

    const seen = new Set();
    for (const source of sources) {
        const key = `${source.type}::${source.url || ''}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
    }
};

const getRagText = (payload) =>
    payload.debugMessages
        .filter((message) => message.kind === 'rag')
        .map((message) => message.content)
        .join('\n');

describe('QA 9.4 deterministic chat contracts', () => {
    it.each(ragCoverageChecks)(
        'includes docs grounding for "$prompt"',
        async ({ prompt, type, urlPrefix, ragNeedle }) => {
            const payload = await buildChatPrompt([{ role: 'user', content: prompt }]);
            const ragText = getRagText(payload);
            const hasSource = payload.contextSources.some(
                (source) => source.type === type && source.url?.startsWith(urlPrefix)
            );
            const hasRagMatch = ragText.includes(ragNeedle);

            expect(hasSource || hasRagMatch).toBe(true);
        }
    );

    it.each(probes)('keeps docs RAG messages separated for "%s"', async (prompt) => {
        const [payload, ragResult] = await Promise.all([
            buildChatPrompt([{ role: 'user', content: prompt }]),
            searchDocsRag(prompt),
        ]);

        const [systemMessage] = payload.debugMessages;
        expect(systemMessage?.role).toBe('system');
        expect(systemMessage?.kind).toBe('main');

        if (ragResult.excerptsText) {
            expect(payload.debugMessages.some((message) => message.kind === 'rag')).toBe(true);
        }
    });

    it.each(probes)('keeps context sources deterministic for "%s"', async (prompt) => {
        const payload = await buildChatPrompt([{ role: 'user', content: prompt }]);

        assertSourcesDeterministic(payload.contextSources);
    });

    it('guards inventory questions against inventing player state', async () => {
        const payload = await buildChatPrompt([
            { role: 'user', content: "What's in my inventory right now?" },
        ]);
        const systemContent = payload.debugMessages[0]?.content || '';

        expect(systemContent).toMatch(/never invent/i);
        expect(systemContent).toMatch(/player state/i);
    });

    it.todo(
        'Stage 7: inventory guardrail should ask for a save snapshot or mention needing save data'
    );

    it.todo('Stage 8: retrieval should include semantics doc chunk for requires/consumes/creates');
});
