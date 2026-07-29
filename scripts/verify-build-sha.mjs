#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const expected = String(process.env.EXPECTED_SHA || '')
  .trim()
  .toLowerCase();
if (!/^[0-9a-f]{40}$/.test(expected)) {
  console.error(
    'EXPECTED_SHA must be the exact expected 40-character hexadecimal revision.'
  );
  process.exit(1);
}

const roots = process.argv.slice(2);
if (roots.length === 0) roots.push('/app/dist', 'frontend/dist');
const root = roots.find((candidate) => fs.existsSync(candidate));
if (!root) {
  console.error(`No build output found. Checked: ${roots.join(', ')}`);
  process.exit(1);
}

const metaCandidates = [
  process.env.VERIFY_BUILD_META_PATH,
  path.join(root, '..', 'build_meta.json'),
  'frontend/src/generated/build_meta.json',
].filter(Boolean);
const metaPath = metaCandidates.find((candidate) => fs.existsSync(candidate));
if (!metaPath) {
  console.error('Canonical build_meta.json was not found.');
  process.exit(1);
}
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const metaRevision = String(meta.revision || meta.gitSha || '')
  .trim()
  .toLowerCase();
if (
  metaRevision !== expected ||
  String(meta.shortRevision || '') !== expected.slice(0, 7)
) {
  console.error('Canonical build metadata does not agree with EXPECTED_SHA.');
  process.exit(1);
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
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && extensions.has(path.extname(file)))
      files.push(file);
  }
};
walk(root);

const isClient = (file) =>
  file.includes(`${path.sep}client${path.sep}`) ||
  file.includes(`${path.sep}_astro${path.sep}`) ||
  file.includes(`${path.sep}static${path.sep}`);
let serverHit = false;
let clientHit = false;
const forbidden = /(?:unknown|missing-sha|dev-local)/i;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(expected)) {
    if (isClient(file)) clientHit = true;
    else serverHit = true;
  }
  if (forbidden.test(content) && content.includes('dspace-build-revision')) {
    console.error(`Placeholder build identity found in ${file}.`);
    process.exit(1);
  }
}
if (!serverHit || !clientHit) {
  console.error(
    `Expected full revision must occur in both server/SSR and client/static output (server=${serverHit}, client=${clientHit}).`
  );
  process.exit(1);
}
console.log(
  `Verified canonical full build revision ${expected} in server and client output.`
);
