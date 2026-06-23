#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { collectPromptMetrics } from '../frontend/src/utils/promptMetrics.js';

const outDir = join(process.cwd(), 'artifacts', 'benchmarks', 'token-place-context');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const repeat = (label, chars) => `${label} ${'x'.repeat(Math.max(0, chars - label.length - 1))}`;

const makePayload = ({ system = 500, rag = 0, state = 0, history = [], latest = 80 }) => {
    const messages = [{ role: 'system', content: repeat('synthetic system instructions', system) }];
    const componentByMessageIndex = { 0: 'systemInstructions' };
    if (state) {
        componentByMessageIndex[messages.length] = 'playerState';
        messages.push({ role: 'system', content: repeat('synthetic player state', state) });
    }
    if (rag) {
        componentByMessageIndex[messages.length] = 'rag';
        messages.push({ role: 'system', content: repeat('synthetic docs rag excerpt', rag) });
    }
    for (const entry of history) {
        componentByMessageIndex[messages.length] = 'chatHistory';
        messages.push(entry);
    }
    componentByMessageIndex[messages.length] = 'latestUserMessage';
    messages.push({ role: 'user', content: repeat('synthetic latest user question', latest) });
    return { combinedMessages: messages, meta: { componentByMessageIndex } };
};

const scenarios = [
    ['token-lite baseline', makePayload({ system: 140, latest: 48 })],
    ['minimal full-fat prompt', makePayload({ system: 1200, state: 350, latest: 80 })],
    [
        'typical mid-game prompt',
        makePayload({
            system: 1800,
            state: 5000,
            rag: 12000,
            history: Array.from({ length: 8 }, (_, i) => ({
                role: i % 2 ? 'assistant' : 'user',
                content: repeat(`synthetic history ${i}`, 600),
            })),
            latest: 180,
        }),
    ],
    ['RAG-heavy prompt', makePayload({ system: 1800, state: 2500, rag: 50000, latest: 220 })],
    [
        'long chat history',
        makePayload({
            system: 1800,
            state: 2500,
            history: Array.from({ length: 50 }, (_, i) => ({
                role: i % 2 ? 'assistant' : 'user',
                content: repeat(`synthetic history ${i}`, 1200),
            })),
            latest: 200,
        }),
    ],
    ['large player state', makePayload({ system: 1800, state: 60000, rag: 8000, latest: 200 })],
    [
        'near 131072-character ceiling',
        makePayload({
            system: 12000,
            state: 30000,
            rag: 50000,
            history: Array.from({ length: 12 }, (_, i) => ({
                role: i % 2 ? 'assistant' : 'user',
                content: repeat(`synthetic ceiling history ${i}`, 3000),
            })),
            latest: 2500,
        }),
    ],
];

const results = scenarios.map(([name, { combinedMessages, meta }]) => {
    const start = performance.now();
    const metrics = collectPromptMetrics(
        { combinedMessages },
        { ...meta, promptBuildMs: 0, ragMs: name.includes('RAG') ? 0 : null }
    );
    metrics.timings.metricsCollectionMs = Number((performance.now() - start).toFixed(3));
    return {
        name,
        metrics,
        heuristicTokens: Math.ceil(metrics.totalCharacters / 4),
        exactTokenizer: null,
    };
});

const json = {
    generatedAt: new Date().toISOString(),
    privacy: 'synthetic fixtures only; no prompt content emitted',
    results,
};
const md = [
    '# token.place context benchmark',
    '',
    `Generated: ${json.generatedAt}`,
    '',
    '| Scenario | Messages | Chars | UTF-8 bytes | Heuristic tokens | Dominant component |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...results.map(({ name, metrics, heuristicTokens }) => {
        const dominant = Object.entries(metrics.componentTotals).sort(
            (a, b) => b[1].characters - a[1].characters
        )[0];
        return `| ${name} | ${metrics.messageCount} | ${metrics.totalCharacters} | ${metrics.totalUtf8Bytes} | ${heuristicTokens} | ${dominant[0]} (${dominant[1].characters}) |`;
    }),
    '',
    'Counts are privacy-safe sizes from synthetic fixtures. Heuristic tokens use characters / 4 and are not exact model tokens.',
].join('\n');

await mkdir(outDir, { recursive: true });
const jsonPath = join(outDir, `${stamp}.json`);
const mdPath = join(outDir, `${stamp}.md`);
await writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
await writeFile(mdPath, `${md}\n`);
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
