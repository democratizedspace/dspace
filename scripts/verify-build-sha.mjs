#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const expected = String(process.env.EXPECTED_SHA || '')
  .trim()
  .toLowerCase();
if (!/^[0-9a-f]{40}$/.test(expected)) {
  throw new Error('EXPECTED_SHA must be exactly 40 hexadecimal characters.');
}
const root = path.resolve(process.argv[2] || 'frontend/dist');
const metaPath =
  process.env.VERIFY_BUILD_META_PATH ||
  path.resolve('frontend/src/generated/build_meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
if (!/^[0-9a-f]{40}$/i.test(String(meta.gitSha || ''))) {
  throw new Error('Canonical build metadata has an invalid full revision.');
}
if (
  meta.gitSha.toLowerCase() !== expected ||
  meta.revision.toLowerCase() !== expected
) {
  throw new Error('Canonical build metadata does not match EXPECTED_SHA.');
}

const extensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.map',
  '.json',
]);
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && extensions.has(path.extname(file)))
      files.push(file);
  }
};
walk(root);
const server = files.filter((file) =>
  /(?:^|\/)(?:server|chunks|pages)(?:\/|$)/.test(file)
);
const client = files.filter((file) =>
  /(?:^|\/)(?:client|_astro|assets)(?:\/|$)/.test(file)
);
const containsExpected = (file) =>
  fs.readFileSync(file, 'utf8').includes(expected);
if (!server.some(containsExpected))
  throw new Error('Expected full SHA is missing from SSR/server output.');
if (!client.some(containsExpected))
  throw new Error('Expected full SHA is missing from client/static output.');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (/v3:(?:missing|unknown|dev-local|missing-sha)/i.test(content)) {
    throw new Error(`Placeholder build identity found in ${file}`);
  }
}
console.log(
  `Verified full build SHA ${expected} in canonical metadata, server, and client output.`
);
