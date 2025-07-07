const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const child = require('child_process');

function mockExec() {
  const calls = [];
  const original = child.execSync;
  child.execSync = (...args) => { calls.push(args); };
  return () => {
    child.execSync = original;
    return calls;
  };
}

test('calls PowerShell on Windows', () => {
  const restoreExec = mockExec();
  const original = os.platform;
  os.platform = () => 'win32';
  const exit = process.exit;
  process.exit = () => {};
  delete require.cache[require.resolve('../../run-tests')];
  require('../../run-tests');
  process.exit = exit;
  os.platform = original;
  const calls = restoreExec();
  assert.ok(calls[0][0].includes('prepare-pr.ps1'));
});

test('calls Bash on Unix', () => {
  const restoreExec = mockExec();
  const original = os.platform;
  os.platform = () => 'linux';
  const exit = process.exit;
  process.exit = () => {};
  delete require.cache[require.resolve('../../run-tests')];
  require('../../run-tests');
  process.exit = exit;
  os.platform = original;
  const calls = restoreExec();
  assert.ok(calls[0][0].includes('prepare-pr.sh'));
});
