import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { parseAndValidateArgs } from '../../scripts/run-remote-chat-smoke.mjs';

assert.equal(process.versions.node, '22.23.4');
assert.notEqual(process.getuid(), 0);
const env = {
  ...process.env,
  REMOTE_CHAT_SMOKE: '1',
  BASE_URL: 'https://unused.invalid',
  DSPACE_EXPECTED_VERSION: '3.1.0',
  DSPACE_EXPECTED_REVISION: 'a'.repeat(40),
  DSPACE_EXPECTED_PROVIDER: 'openai',
  DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT: 'chat-default-provider-v1',
};
parseAndValidateArgs(['--base-url', env.BASE_URL], env);
// Collect the actual remote suite to exercise all copied imports without requests.
execFileSync(
  process.execPath,
  [
    './node_modules/@playwright/test/cli.js',
    'test',
    'e2e/remote-chat-smoke.spec.ts',
    '--project=chromium',
    '--list',
  ],
  { cwd: '/opt/dspace/frontend', env, stdio: 'inherit', timeout: 30_000 }
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ ignoreHTTPSErrors: false });
  await page.setContent('<title>Offline Chromium smoke</title>');
  assert.equal(await page.title(), 'Offline Chromium smoke');
  console.log(
    `Real Chromium launch passed: ${browser.version()} Node ${process.versions.node} ${process.arch}`
  );
} finally {
  await browser.close();
}
