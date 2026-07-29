#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { assertBuildMetaComplete, readBuildMeta } from './write-build-meta.mjs';

const expectedSha = String(process.env.EXPECTED_SHA || '')
  .trim()
  .toLowerCase();
if (!/^[0-9a-f]{40}$/.test(expectedSha)) {
  console.error(
    'EXPECTED_SHA must be the exact expected 40-character hexadecimal revision.'
  );
  process.exit(1);
}
const roots = (
  process.argv.slice(2).length ? process.argv.slice(2) : ['frontend/dist']
).filter((p) => fs.existsSync(p));
if (!roots.length) {
  console.error('No build output directory found.');
  process.exit(1);
}
const extensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.json',
  '.map',
]);
const files = [];
for (const root of roots) {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(entryPath);
      else if (entry.isFile() && extensions.has(path.extname(entryPath)))
        files.push(entryPath);
    }
  }
}
let meta;
try {
  meta = await readBuildMeta();
  assertBuildMetaComplete(meta);
} catch (error) {
  console.error(`Canonical build metadata is invalid: ${error.message}`);
  process.exit(1);
}
if (
  String(meta.revision || meta.gitSha).toLowerCase() !== expectedSha ||
  meta.shortRevision !== expectedSha.slice(0, 7)
) {
  console.error('Canonical build metadata does not agree with EXPECTED_SHA.');
  process.exit(1);
}
let serverHit = false;
let clientHit = false;
const placeholders = ['unknown', 'missing-sha', 'dev-local'];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (
    placeholders.some((marker) =>
      content.includes(`\"revision\":\"${marker}\"`)
    )
  ) {
    console.error(`Placeholder identity found in ${file}.`);
    process.exit(1);
  }
  if (!content.includes(expectedSha)) continue;
  if (
    file.includes(`${path.sep}_astro${path.sep}`) ||
    file.includes(`${path.sep}client${path.sep}`)
  )
    clientHit = true;
  else serverHit = true;
}
if (!serverHit || !clientHit) {
  console.error(
    `Expected full SHA must occur in server/SSR and client/static output (server=${serverHit}, client=${clientHit}).`
  );
  process.exit(1);
}
console.log(
  `Verified canonical full build revision in server and client outputs: ${expectedSha}`
);
