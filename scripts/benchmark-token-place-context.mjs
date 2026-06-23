#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { buildPromptMetrics } from '../frontend/src/utils/promptMetrics.js';

const OUTPUT_DIR = 'artifacts/benchmarks/token-place-context';
const CEILING = 131_072;
const repeat = (label, length) =>
  label.repeat(Math.ceil(length / label.length)).slice(0, length);

const syntheticState = (chars) =>
  `SYNTHETIC_PLAYER_STATE:${repeat(' inventory=synthetic-item quest=synthetic-step ', chars)}`;
const syntheticRag = (chars) =>
  `SYNTHETIC_RAG_EXCERPTS:${repeat(' docs synthetic guidance for benchmark only. ', chars)}`;
const syntheticHistory = (turns, chars) =>
  Array.from({ length: turns }, (_, index) => [
    {
      role: 'user',
      content: `synthetic user turn ${index}: ${repeat('u ', chars)}`,
    },
    {
      role: 'assistant',
      content: `synthetic assistant turn ${index}: ${repeat('a ', chars)}`,
    },
  ]).flat();

const scenario = (
  id,
  description,
  { system = 500, rag = 0, state = 0, history = [], latest = 80 }
) => {
  const systemContent = `SYNTHETIC_SYSTEM:${repeat(' system policy. ', system)}`;
  const ragContent = rag ? syntheticRag(rag) : '';
  const stateContent = state ? syntheticState(state) : '';
  const latestContent = `synthetic latest user message: ${repeat('latest ', latest)}`;
  const combinedMessages = [
    { role: 'system', content: systemContent },
    ...(ragContent ? [{ role: 'system', content: ragContent }] : []),
    ...(stateContent ? [{ role: 'system', content: stateContent }] : []),
    ...history,
    { role: 'user', content: latestContent },
  ];
  return {
    id,
    description,
    combinedMessages,
    components: {
      systemInstructions: systemContent,
      rag: ragContent,
      playerState: stateContent,
      chatHistory: history.map((m) => m.content),
      latestUserMessage: latestContent,
    },
  };
};

const scenarios = [
  scenario('token-lite-baseline', 'Small token-lite style prompt.', {
    system: 180,
    latest: 40,
  }),
  scenario('minimal-full-fat', 'Minimal full-fat DSPACE prompt.', {
    system: 1200,
    state: 800,
    latest: 80,
  }),
  scenario(
    'typical-mid-game',
    'Typical mid-game state, RAG, and short history.',
    {
      system: 1800,
      rag: 6000,
      state: 8000,
      history: syntheticHistory(6, 160),
      latest: 180,
    }
  ),
  scenario('rag-heavy', 'Large synthetic docs-RAG excerpts.', {
    system: 1800,
    rag: 36000,
    state: 5000,
    history: syntheticHistory(4, 120),
    latest: 160,
  }),
  scenario('long-chat-history', 'Long accumulated chat history.', {
    system: 1500,
    state: 4000,
    history: syntheticHistory(30, 420),
    latest: 160,
  }),
  scenario('large-player-state', 'Large save/player-state snapshot.', {
    system: 1500,
    rag: 2500,
    state: 52000,
    history: syntheticHistory(4, 120),
    latest: 160,
  }),
  scenario(
    'near-token-place-ceiling',
    'Synthetic payload near the 131,072-character request ceiling.',
    {
      system: 2000,
      rag: 44000,
      state: 44000,
      history: syntheticHistory(10, 1700),
      latest: 900,
    }
  ),
];

const estimateTokens = (characters) => Math.ceil(characters / 4);
const tierReadiness = (metrics) => ({
  heuristicTokens: estimateTokens(metrics.totalCharacters),
  fits8kHeuristic: estimateTokens(metrics.totalCharacters) <= 8192,
  fits64kHeuristic: estimateTokens(metrics.totalCharacters) <= 65536,
});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await mkdir(OUTPUT_DIR, { recursive: true });

const results = scenarios.map((item) => {
  const startedAt = performance.now();
  const metrics = buildPromptMetrics(item, {
    components: item.components,
    promptBuildDurationMs: 0,
    ragDurationMs: item.components.rag ? 0 : null,
  });
  metrics.promptBuildDurationMs = performance.now() - startedAt;
  return {
    id: item.id,
    description: item.description,
    metrics,
    tierReadiness: tierReadiness(metrics),
    exactTokenizer: {
      available: false,
      note: 'No production-safe Llama 3.1 tokenizer hook is configured for this benchmark.',
    },
  };
});

const jsonPath = path.join(OUTPUT_DIR, `${timestamp}.json`);
const mdPath = path.join(OUTPUT_DIR, `${timestamp}.md`);
const json = {
  generatedAt: new Date().toISOString(),
  fixturePolicy:
    'synthetic repository-owned benchmark data only; no user prompts or secrets',
  scenarios: results,
};
const markdown = [
  '# token.place Context Benchmark',
  '',
  `Generated: ${json.generatedAt}`,
  '',
  '| Scenario | Messages | Chars | UTF-8 bytes | Heuristic tokens | 8K | 64K | Dominant component |',
  '| --- | ---: | ---: | ---: | ---: | --- | --- | --- |',
  ...results.map((result) => {
    const entries = Object.entries(result.metrics.componentTotals);
    const [dominant] = entries.sort(
      (a, b) => b[1].characters - a[1].characters
    )[0];
    return `| ${result.id} | ${result.metrics.messageCount} | ${result.metrics.totalCharacters} | ${result.metrics.totalUtf8Bytes} | ${result.tierReadiness.heuristicTokens} | ${result.tierReadiness.fits8kHeuristic ? 'yes' : 'no'} | ${result.tierReadiness.fits64kHeuristic ? 'yes' : 'no'} | ${dominant} |`;
  }),
  '',
  'All values are content-free counts from synthetic fixtures. Token counts are four-characters-per-token heuristics, not exact model tokens.',
].join('\n');

await writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
await writeFile(mdPath, `${markdown}\n`);
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
