// Forward-port the 3.0.x pin guard without its fixed application release version.
// Reviewed security release: https://nodejs.org/en/blog/release/v24.22.3
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

// Docker Official Images: linux/amd64 and linux/arm64/v8 share this index.
const appNodeIndexDigest =
  'sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530';

export function checkNodeRuntime(files) {
  const version = files['.nvmrc'].trim();
  assert.equal(
    version,
    '24.22.3',
    'Use the reviewed November 2026 security release'
  );
  assert.ok(
    files.Dockerfile.split(/\r?\n/).includes(
      `FROM node:${version}-bookworm-slim@${appNodeIndexDigest} AS base`
    ),
    'Use the reviewed multi-architecture application Node base digest'
  );
  assert.match(files.Dockerfile, /^FROM base AS runtime$/m);
  assert.equal((files.Dockerfile.match(/^FROM node:/gm) || []).length, 1);
  const pkg = JSON.parse(files['package.json']);
  const lock = JSON.parse(files['package-lock.json']);
  assert.equal(pkg.engines.node, '>=24.22.3 <25');
  assert.equal(lock.packages[''].engines.node, pkg.engines.node);
  assert.match(
    pkg.version,
    /^3\.1\.\d+(?:-[\w.-]+)?$/,
    'Preserve the main release line'
  );
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
    const pinPattern =
      name === '.github/workflows/claude.yml'
        ? /node-version-file: ['"]?(?:trusted-workflow\/)?\.nvmrc['"]?(?:\s|$)/g
        : /node-version-file: ['"]?\.nvmrc['"]?(?:\s|$)/g;
    const pins = content.match(pinPattern) || [];
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
  ['Dockerfile', 'node:24.22.3', 'node:20'],
  ['Dockerfile', `@${appNodeIndexDigest}`, ''],
  ['Dockerfile', appNodeIndexDigest, `sha256:${'0'.repeat(64)}`],
  ['.nvmrc', '24.22.3', '24.22.2'],
  ['package-lock.json', '>=24.22.3 <25', '>=20 <22'],
  ['package.json', '>=24.22.3 <25', '>=24.22.1 <25'],
  ['.github/workflows/ci.yml', 'node-version-file: .nvmrc', 'node-version: 20'],
  [
    '.github/workflows/claude.yml',
    'node-version-file: trusted-workflow/.nvmrc',
    'node-version-file: pr-workspace/.nvmrc',
  ],
  ['package.json', 'node@24.22.3', 'node@20'],
  ['frontend/package.json', JSON.parse(files['package.json']).version, '0.0.0'],
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
  'Node runtime/build/version pins and ten negative controls passed.'
);
