'use strict';

const WEBSTORAGE_FLAG = '--no-experimental-webstorage';

// Node's experimental native `localStorage`/`sessionStorage` global (introduced in
// Node 22.4.0, not at the start of the Node 22 line) shadows Vitest's jsdom Storage
// implementation: Vitest only installs its own working Storage onto the test global
// when the key isn't already present there, so any Node build that ships the native
// global breaks jsdom tests touching localStorage/sessionStorage.
// `--no-experimental-webstorage` removes Node's native global so Vitest's normal jsdom
// wiring applies, but the flag itself doesn't exist before Node 22.4.0 and passing it
// there is a fatal "not allowed in NODE_OPTIONS" startup error. Ask the running Node
// binary directly whether it recognizes the flag, via `process.allowedNodeEnvironmentFlags`,
// instead of hardcoding a version cutoff, so this stays correct across every Node release.
function supportsWebStorageFlag(
  allowedFlags = process.allowedNodeEnvironmentFlags
) {
  return allowedFlags.has(WEBSTORAGE_FLAG);
}

function addWebStorageWorkaroundToEnv(
  env = process.env,
  allowedFlags = process.allowedNodeEnvironmentFlags
) {
  if (!supportsWebStorageFlag(allowedFlags)) {
    return env;
  }

  const nextEnv = { ...env };
  const existingNodeOptions = String(nextEnv.NODE_OPTIONS || '').trim();
  const existingOptions = existingNodeOptions
    ? existingNodeOptions.split(/\s+/)
    : [];

  if (!existingOptions.includes(WEBSTORAGE_FLAG)) {
    existingOptions.push(WEBSTORAGE_FLAG);
  }

  nextEnv.NODE_OPTIONS = existingOptions.join(' ').trim();
  return nextEnv;
}

module.exports = {
  addWebStorageWorkaroundToEnv,
  supportsWebStorageFlag,
  WEBSTORAGE_FLAG,
};
