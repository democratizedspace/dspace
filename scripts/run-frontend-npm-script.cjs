#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { addNodeWarningFilterToEnv } = require('./node-warning-filter.cjs');

const scriptName = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!scriptName) {
  console.error(
    'Usage: node scripts/run-frontend-npm-script.cjs <script> [-- ...args]'
  );
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(
  npmCommand,
  ['--prefix', 'frontend', 'run', scriptName, ...extraArgs],
  {
    cwd: path.resolve(__dirname, '..'),
    env: addNodeWarningFilterToEnv(),
    stdio: 'inherit',
  }
);

if (result.error) {
  console.error(
    `Failed to run frontend npm script "${scriptName}":`,
    result.error
  );
  process.exit(1);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
}

process.exit(result.status ?? 1);
