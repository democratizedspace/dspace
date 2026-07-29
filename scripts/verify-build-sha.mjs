#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const FULL_SHA = /^[0-9a-f]{40}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const IMMUTABLE_IMAGE =
  /^(?:[a-z0-9.-]+(?::[0-9]+)?\/)?[a-z0-9._/-]+:([a-z0-9._-]+)-([0-9a-f]{7})$/i;
const fail = (message) => {
  throw new Error(message);
};
const canonicalTimestamp = (value) => {
  if (typeof value !== 'string' || !TIMESTAMP.test(value)) return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  const iso = new Date(parsed).toISOString();
  return value === iso || value.replace(/Z$/, '.000Z') === iso;
};

const verify = () => {
  const expected = String(process.env.EXPECTED_SHA || '')
    .trim()
    .toLowerCase();
  if (!FULL_SHA.test(expected))
    fail('EXPECTED_SHA must be exactly 40 hexadecimal characters.');

  const root = path.resolve(process.argv[2] || 'frontend/dist');
  const metaPath =
    process.env.VERIFY_BUILD_META_PATH ||
    path.resolve('frontend/src/generated/build_meta.json');
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    fail('Canonical build metadata is missing or malformed.');
  }
  const gitSha = String(meta?.gitSha ?? '')
    .trim()
    .toLowerCase();
  const revision = String(meta?.revision ?? '')
    .trim()
    .toLowerCase();
  const shortRevision = String(meta?.shortRevision ?? '')
    .trim()
    .toLowerCase();
  if (!FULL_SHA.test(gitSha) || !FULL_SHA.test(revision))
    fail('Canonical build metadata has an invalid full revision.');
  if (gitSha !== expected || revision !== expected)
    fail('Canonical build metadata does not match EXPECTED_SHA.');
  if (shortRevision !== expected.slice(0, 7))
    fail('Canonical build metadata has an invalid shortRevision.');
  if (!SEMVER.test(String(meta?.version ?? '')))
    fail('Canonical build metadata has an invalid version.');
  const timestamp = meta?.buildTimestamp ?? meta?.generatedAt;
  if (!canonicalTimestamp(timestamp))
    fail('Canonical build metadata has an invalid buildTimestamp.');
  if (meta?.image) {
    const image = String(meta.image).trim();
    const hasControlCharacter = [...image].some((character) => {
      const code = character.codePointAt(0);
      return code < 32 || code === 127;
    });
    const match = image.match(IMMUTABLE_IMAGE);
    if (
      !image ||
      image.length > 256 ||
      hasControlCharacter ||
      !match ||
      match[2].toLowerCase() !== expected.slice(0, 7) ||
      /(?:^|[-_.])latest(?:$|[-_.])/i.test(match[1])
    )
      fail(
        'Canonical build metadata has a mismatched immutable image coordinate.'
      );
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
  const executable = files.filter((file) => path.extname(file) !== '.map');
  const server = executable.filter((file) =>
    /(?:^|\/)(?:server|chunks|pages)(?:\/|$)/.test(file)
  );
  const client = executable.filter((file) =>
    /(?:^|\/)(?:client|_astro|assets)(?:\/|$)/.test(file)
  );
  const containsExpected = (file) =>
    fs.readFileSync(file, 'utf8').includes(expected);
  if (!server.some(containsExpected))
    fail('Expected full SHA is missing from SSR/server output.');
  if (!client.some(containsExpected))
    fail('Expected full SHA is missing from client/static output.');
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (/v3:(?:missing|unknown|dev-local|missing-sha)/i.test(content))
      fail(`Placeholder build identity found in ${file}`);
  }
  console.log(
    `Verified full build SHA ${expected} in canonical metadata, server, and client output.`
  );
};

try {
  verify();
} catch (error) {
  console.error(
    `Build SHA verification failed: ${error instanceof Error ? error.message : 'unknown error'}`
  );
  process.exitCode = 1;
}
