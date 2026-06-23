#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  buildPromptMetrics,
  PROMPT_COMPONENTS,
} from '../frontend/src/utils/promptMetrics.js';

const outDir = join(
  process.cwd(),
  'artifacts',
  'benchmarks',
  'token-place-context'
);
const repeat = (label, count) =>
  Array.from({ length: count }, (_, i) => `${label} ${i + 1}`).join('\n');

const scenarios = [
  {
    name: 'token-lite baseline',
    messages: [{ role: 'user', content: 'Synthetic token-lite ping.' }],
    components: { 0: PROMPT_COMPONENTS.latestUserMessage },
  },
  {
    name: 'minimal full-fat prompt',
    messages: [
      { role: 'system', content: 'Synthetic DSPACE system instructions.' },
      { role: 'user', content: 'Start a new synthetic run.' },
    ],
    components: {
      0: PROMPT_COMPONENTS.systemInstructions,
      1: PROMPT_COMPONENTS.latestUserMessage,
    },
  },
  {
    name: 'typical mid-game prompt',
    messages: [
      {
        role: 'system',
        content: repeat('Synthetic DSPACE operating rules.', 30),
      },
      {
        role: 'system',
        content: repeat('Synthetic inventory and quest state.', 80),
      },
      {
        role: 'assistant',
        content: repeat('Synthetic assistant history.', 15),
      },
      { role: 'user', content: 'What should the synthetic player build next?' },
    ],
    components: {
      0: PROMPT_COMPONENTS.systemInstructions,
      1: PROMPT_COMPONENTS.playerState,
      2: PROMPT_COMPONENTS.chatHistory,
      3: PROMPT_COMPONENTS.latestUserMessage,
    },
  },
  {
    name: 'RAG-heavy prompt',
    messages: [
      { role: 'system', content: repeat('Synthetic rules.', 25) },
      {
        role: 'system',
        content: repeat(
          'Synthetic repository-owned docs excerpt about power, oxygen, habitats, and launch gates.',
          650
        ),
      },
      { role: 'user', content: 'Summarize relevant synthetic docs.' },
    ],
    components: {
      0: PROMPT_COMPONENTS.systemInstructions,
      1: PROMPT_COMPONENTS.rag,
      2: PROMPT_COMPONENTS.latestUserMessage,
    },
  },
  {
    name: 'long chat history',
    messages: [
      { role: 'system', content: 'Synthetic DSPACE system instructions.' },
      ...Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 ? 'assistant' : 'user',
        content: `Synthetic history turn ${i + 1}: ${repeat('planning detail', 20)}`,
      })),
      { role: 'user', content: 'Continue from the synthetic long history.' },
    ],
    components: {},
  },
  {
    name: 'large player state',
    messages: [
      { role: 'system', content: 'Synthetic DSPACE system instructions.' },
      {
        role: 'system',
        content: repeat(
          'Synthetic save-state item, quest, process, achievement, and storage entry.',
          1500
        ),
      },
      { role: 'user', content: 'Analyze this synthetic save state.' },
    ],
    components: {
      0: PROMPT_COMPONENTS.systemInstructions,
      1: PROMPT_COMPONENTS.playerState,
      2: PROMPT_COMPONENTS.latestUserMessage,
    },
  },
  {
    name: 'near 131072-character ceiling',
    messages: [
      {
        role: 'system',
        content: repeat('Synthetic DSPACE system instruction block.', 300),
      },
      { role: 'system', content: 'R'.repeat(50000) },
      { role: 'assistant', content: 'H'.repeat(30000) },
      { role: 'system', content: 'P'.repeat(45000) },
      { role: 'user', content: 'U'.repeat(4000) },
    ],
    components: {
      0: PROMPT_COMPONENTS.systemInstructions,
      1: PROMPT_COMPONENTS.rag,
      2: PROMPT_COMPONENTS.chatHistory,
      3: PROMPT_COMPONENTS.playerState,
      4: PROMPT_COMPONENTS.latestUserMessage,
    },
  },
];
scenarios[4].messages.forEach((_, i) => {
  scenarios[4].components[i] =
    i === 0
      ? PROMPT_COMPONENTS.systemInstructions
      : i === scenarios[4].messages.length - 1
        ? PROMPT_COMPONENTS.latestUserMessage
        : PROMPT_COMPONENTS.chatHistory;
});

const results = scenarios.map((scenario) => {
  const started = performance.now();
  const metrics = buildPromptMetrics(
    { combinedMessages: scenario.messages },
    {
      componentByMessageIndex: scenario.components,
      promptBuildMs: 0,
      ragMs: scenario.name === 'RAG-heavy prompt' ? 0 : null,
    }
  );
  metrics.timingsMs.benchmarkMetrics = performance.now() - started;
  return {
    name: scenario.name,
    metrics,
    tokenEstimates: {
      heuristicFourCharsPerToken: Math.ceil(metrics.totalCharacters / 4),
      exact: null,
      exactTokenizer: null,
    },
  };
});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await mkdir(outDir, { recursive: true });
const jsonPath = join(outDir, `${timestamp}.json`);
const mdPath = join(outDir, `${timestamp}.md`);
await writeFile(
  jsonPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      privacy: 'Synthetic fixtures only; no prompt content is written.',
      results,
    },
    null,
    2
  )
);
const md = [
  '# token.place Context Benchmark',
  '',
  'Synthetic, privacy-safe prompt size benchmark.',
  '',
  '| Scenario | Messages | Chars | UTF-8 bytes | ~tokens /4 | Dominant component |',
  '| --- | ---: | ---: | ---: | ---: | --- |',
  ...results.map(({ name, metrics, tokenEstimates }) => {
    const entries = Object.entries(metrics.componentTotals).sort(
      (a, b) => b[1].characters - a[1].characters
    );
    return `| ${name} | ${metrics.messageCount} | ${metrics.totalCharacters} | ${metrics.totalUtf8Bytes} | ${tokenEstimates.heuristicFourCharsPerToken} | ${entries[0][0]} (${entries[0][1].characters}) |`;
  }),
  '',
].join('\n');
await writeFile(mdPath, md);
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
