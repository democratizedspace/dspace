#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const {
  addWebStorageWorkaroundToEnv,
} = require('./node-webstorage-workaround.cjs');

const vitestPkgPath = require.resolve('vitest/package.json');
const vitestBin = path.join(path.dirname(vitestPkgPath), 'vitest.mjs');

const result = spawnSync(
  process.execPath,
  [vitestBin, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: addWebStorageWorkaroundToEnv(),
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
