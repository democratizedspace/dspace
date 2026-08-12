'use strict';

const WORKSTORAGE_FLAG = '--no-experimental-webstorage';
const MIN_AFFECTED_NODE_MAJOR = 22;

function nodeMajorVersion(nodeVersion = process.versions.node) {
  return Number(String(nodeVersion).split('.')[0]);
}

// Node >=22 ships an experimental native `localStorage`/`sessionStorage` global that
// evaluates to `undefined` without `--localstorage-file`. Vitest's jsdom environment
// setup skips installing its own working Storage implementation whenever the key is
// already present on the process global, so on those Node versions every jsdom test
// that touches localStorage/sessionStorage breaks. `--no-experimental-webstorage`
// removes Node's native global so Vitest's normal jsdom wiring applies. The flag does
// not exist on Node 20 (this repo's pinned version) and passing it there is a fatal
// "not allowed in NODE_OPTIONS" startup error, so only add it when running on Node >=22.
function addWebStorageWorkaroundToEnv(
  env = process.env,
  nodeVersion = process.versions.node
) {
  if (nodeMajorVersion(nodeVersion) < MIN_AFFECTED_NODE_MAJOR) {
    return env;
  }

  const nextEnv = { ...env };
  const existingNodeOptions = String(nextEnv.NODE_OPTIONS || '').trim();
  const existingOptions = existingNodeOptions
    ? existingNodeOptions.split(/\s+/)
    : [];

  if (!existingOptions.includes(WORKSTORAGE_FLAG)) {
    existingOptions.push(WORKSTORAGE_FLAG);
  }

  nextEnv.NODE_OPTIONS = existingOptions.join(' ').trim();
  return nextEnv;
}

module.exports = {
  addWebStorageWorkaroundToEnv,
  nodeMajorVersion,
  WORKSTORAGE_FLAG,
  MIN_AFFECTED_NODE_MAJOR,
};
