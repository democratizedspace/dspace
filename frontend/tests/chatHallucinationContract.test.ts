import { describe, expect, it } from 'vitest';
import { buildChatPrompt } from '../src/utils/openAI.js';
import { sortSources } from '../src/utils/contextSources.js';

const probes = [
    {
        label: 'custom content',
        prompt: 'How do I add custom content to DSPACE?',
        coverage: 'doc',
    },
    {
        label: 'quest editing',
        prompt: 'Where do I edit quests?',
        coverage: 'doc',
    },
    {
        label: 'backup export',
        prompt: 'What can I back up or export?',
        coverage: 'doc',
    },
    {
        label: 'inventory state',
        prompt: 'What’s in my inventory right now?',
        coverage: 'state',
    },
    {
        label: 'token.place status',
        prompt: 'Is token.place active?',
        coverage: 'changelog',
    },
    {
        label: 'routes list',
        prompt: 'What are the current game routes?',
        coverage: 'route',
    },
];

const expectSortedAndDeduped = (contextSources) => {
    const sorted = sortSources(contextSources);
    expect(contextSources).toEqual(sorted);

    const seen = new Set();
    for (const source of contextSources) {
        const key = `${source.type}::${source.id ?? ''}::${source.url ?? ''}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
    }
};

const assertCoverage = (coverage, contextSources, ragText) => {
    if (coverage === 'doc') {
        const hasDoc = contextSources.some(
            (source) => source.type === 'doc' && String(source.url || '').startsWith('/docs/')
        );
        expect(hasDoc || ragText.includes('/docs/')).toBe(true);
    }

    if (coverage === 'route') {
        const hasRoute = contextSources.some((source) => source.type === 'route');
        expect(hasRoute || ragText.includes('/docs/routes') || ragText.includes('ROUTES')).toBe(
            true
        );
    }

    if (coverage === 'changelog') {
        const hasChangelog = contextSources.some((source) => source.type === 'changelog');
        expect(hasChangelog || ragText.includes('/changelog')).toBe(true);
    }
};

describe('QA 9.4 chat hallucination contracts', () => {
    it.each(probes)('buildChatPrompt contracts: $label', async ({ prompt, coverage }) => {
        const { debugMessages, contextSources } = await buildChatPrompt([
            { role: 'user', content: prompt },
        ]);

        expect(debugMessages[0]?.role).toBe('system');
        expect(debugMessages[0]?.kind).toBe('main');

        const ragMessages = debugMessages.filter((message) => message.kind === 'rag');
        const ragText = ragMessages.map((message) => message.content).join('\n');

        if (coverage && coverage !== 'state') {
            expect(ragMessages.length).toBeGreaterThan(0);
            assertCoverage(coverage, contextSources, ragText);
        }

        expectSortedAndDeduped(contextSources);
    });

    it('includes inventory guardrails against inventing player state', async () => {
        const { debugMessages } = await buildChatPrompt([
            { role: 'user', content: 'What’s in my inventory right now?' },
        ]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const systemContent = systemMessage?.content ?? '';
        expect(systemContent).toMatch(/never invent/i);
        expect(systemContent).toMatch(/player state/i);
        const saveSnapshotPattern =
            /save snapshot|cannot see.*save|provide.*save|cannot see your save/i;
        if (saveSnapshotPattern.test(systemContent)) {
            expect(systemContent).toMatch(saveSnapshotPattern);
        }
    });

    it('Stage 7: system guardrail asks for a save snapshot', async () => {
        const { debugMessages } = await buildChatPrompt([
            { role: 'user', content: 'What’s in my inventory right now?' },
        ]);
        const systemMessage = debugMessages.find(
            (message) => message.role === 'system' && message.kind === 'main'
        );
        const systemContent = systemMessage?.content ?? '';
        expect(systemContent).toMatch(/save snapshot/i);
        expect(systemContent).toMatch(/\/gamesaves/i);
        expect(systemContent).toMatch(/inventory\/quests\/progress/i);
    });

    it('Stage 8: retrieval includes requires/consumes/creates duration semantics doc chunk', async () => {
        const { debugMessages } = await buildChatPrompt([
            {
                role: 'user',
                content: 'Explain requires vs consumes vs creates and duration semantics',
            },
        ]);

        const ragMessages = debugMessages.filter((message) => message.kind === 'rag');
        const ragText = ragMessages.map((message) => message.content).join('\n');
        const semanticsPattern =
            /-\s\[doc\].*\/docs\/[^\s#]+#[^\s]+\n\s+.*\b(requires|consumes|creates|duration)\b/i;

        expect(ragMessages.length).toBeGreaterThan(0);
        expect(ragText).toMatch(semanticsPattern);
    });
});
