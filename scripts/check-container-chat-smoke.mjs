import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  containerSecurityArgs,
  nativePlatform,
} from './run-container-chat-smoke.mjs';

const image = process.argv[2];
assert.ok(image && !image.startsWith('-'), 'supply a local smoke image');
const info = JSON.parse(
  execFileSync('docker', ['info', '--format', '{{json .}}'], {
    encoding: 'utf8',
  })
);
const metadata = JSON.parse(
  execFileSync('docker', ['image', 'inspect', image], { encoding: 'utf8' })
)[0];
const platform = nativePlatform(info, metadata);
const args = [
  'run',
  '--rm',
  '--pull=never',
  '--platform',
  platform,
  ...containerSecurityArgs(),
  '--network=none',
  '--entrypoint=node',
];
const script = '/opt/dspace/containers/remote-chat-smoke/self-check.mjs';
execFileSync('docker', [...args, metadata.Id, script], {
  stdio: 'inherit',
  timeout: 90_000,
});
const missing = spawnSync(
  'docker',
  [
    ...args,
    '--env',
    'PLAYWRIGHT_BROWSERS_PATH=/missing-browser',
    metadata.Id,
    script,
  ],
  { encoding: 'utf8', timeout: 90_000 }
);
assert.notEqual(missing.status, 0, 'missing browser must fail');
assert.match(
  missing.stderr || '',
  /Executable doesn't exist/,
  'negative control must fail at browser launch'
);
console.log(
  `Native ${platform} image ${metadata.Id}: suite load, browser launch, missing-browser failure passed`
);
