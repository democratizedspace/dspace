#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';

const markdownFiles = await glob('**/*.md', {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/test-artifacts/**',
    '**/.pnpm/**'
  ],
});

const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const broken = [];

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const rawLink = match[1].trim();
    if (!rawLink) continue;
    if (rawLink.startsWith('#')) continue;
    if (rawLink.includes('://')) continue;
    if (rawLink.startsWith('mailto:')) continue;
    if (rawLink.startsWith('data:')) continue;
    if (rawLink.startsWith('javascript:')) continue;
    if (rawLink.startsWith('<')) continue;
    if (rawLink.startsWith('/')) continue;

    const [targetPath] = rawLink.split('#');
    if (!targetPath) continue;

    const normalized = targetPath.replace(/%20/g, ' ');
    const absolute = path.resolve(path.dirname(file), normalized);
    if (existsSync(absolute)) continue;

    const withMd = absolute.endsWith('.md') ? absolute : `${absolute}.md`;
    if (existsSync(withMd)) continue;

    broken.push({ file, link: rawLink });
  }
}

if (broken.length > 0) {
  console.error('Broken local links detected:');
  for (const { file, link } of broken) {
    console.error(`- ${file}: ${link}`);
  }
  process.exit(1);
}

console.log('All local markdown links resolved.');
