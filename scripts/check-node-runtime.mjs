import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

export function checkNodeRuntime(files) {
  const version = files['.nvmrc'].trim();
  assert.equal(
    version,
    '24.22.1',
    'Use the reviewed October 2026 security release'
  );
  assert.match(
    files.Dockerfile,
    /^FROM node:24\.22\.1-bookworm-slim AS base$/m
  );
  assert.match(files.Dockerfile, /^FROM base AS runtime$/m);
  assert.equal((files.Dockerfile.match(/^FROM node:/gm) || []).length, 1);
  const pkg = JSON.parse(files['package.json']);
  const lock = JSON.parse(files['package-lock.json']);
  assert.equal(pkg.engines.node, '>=24.22.1 <25');
  assert.equal(lock.packages[''].engines.node, pkg.engines.node);
  assert.equal(pkg.version, '3.0.2');
  assert.equal(JSON.parse(files['frontend/package.json']).version, pkg.version);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  for (const name of [
    'qa:remote-migration',
    'qa:remote-completionist-award-iii',
  ]) {
    assert.ok(pkg.scripts[name].startsWith(`npx -y node@${version} `));
  }
  for (const [name, content] of Object.entries(files)) {
    if (!name.startsWith('.github/workflows/')) continue;
    assert.doesNotMatch(content, /\bnode-version:/, `${name}: use .nvmrc`);
    const setups = content.match(/uses: actions\/setup-node@/g) || [];
    const pins = content.match(/node-version-file: ['"]?\.nvmrc['"]?/g) || [];
    assert.equal(
      pins.length,
      setups.length,
      `${name}: every setup-node must use .nvmrc`
    );
  }
}

const files = Object.fromEntries(
  [
    '.nvmrc',
    'Dockerfile',
    'package.json',
    'package-lock.json',
    'frontend/package.json',
    ...readdirSync(resolve(root, '.github/workflows'))
      .filter((name) => /\.ya?ml$/.test(name))
      .map((name) => `.github/workflows/${name}`),
  ].map((name) => [name, read(name)])
);

checkNodeRuntime(files);
// Negative controls ensure stale runtime, CI and development pins cannot silently pass.
for (const [file, from, to] of [
  ['Dockerfile', 'node:24.22.1', 'node:20'],
  ['.nvmrc', '24.22.1', '24.22.0'],
  ['.github/workflows/ci.yml', 'node-version-file: .nvmrc', 'node-version: 20'],
  ['package.json', 'node@24.22.1', 'node@20'],
  ['frontend/package.json', '3.0.2', '3.1.0'],
]) {
  assert.notEqual(
    files[file].replace(from, to),
    files[file],
    `Missing negative control: ${file}`
  );
  assert.throws(() =>
    checkNodeRuntime({ ...files, [file]: files[file].replace(from, to) })
  );
}
console.log(
  'Node runtime/build/version pins and five negative controls passed.'
);
