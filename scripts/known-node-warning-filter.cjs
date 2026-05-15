'use strict';

/**
 * Drop only the recurring third-party ExperimentalWarning messages that are
 * emitted by known toolchain interop paths during local/CI validation.
 *
 * This intentionally patches process.emitWarning instead of using
 * --disable-warning=ExperimentalWarning so application/test warnings continue
 * to print normally.
 */
const originalEmitWarning = process.emitWarning.bind(process);

const normalizePath = (value) => String(value).replaceAll('\\\\', '/');

const knownExperimentalWarningPatterns = [
  (message) =>
    message.includes('/npm/node_modules/debug/src/node.js') &&
    message.includes('/npm/node_modules/supports-color/index.js'),
  (message) =>
    message.includes('/@eslint/eslintrc') &&
    message.includes('/svelte-eslint-parser/'),
];

function getWarningMessage(warning) {
  if (warning instanceof Error) {
    return warning.message;
  }

  return String(warning ?? '');
}

function getWarningName(warning, type) {
  if (warning instanceof Error && warning.name) {
    return warning.name;
  }

  return type;
}

function isKnownToolchainExperimentalWarning(warning, type) {
  const warningName = getWarningName(warning, type);
  if (warningName !== 'ExperimentalWarning') {
    return false;
  }

  const message = normalizePath(getWarningMessage(warning));
  if (
    !message.includes('CommonJS module ') ||
    !message.includes(' is loading ES Module ') ||
    !message.includes(' using require()')
  ) {
    return false;
  }

  return knownExperimentalWarningPatterns.some((matchesPattern) =>
    matchesPattern(message)
  );
}

process.emitWarning = function emitFilteredWarning(warning, ...args) {
  const [type] = args;

  if (isKnownToolchainExperimentalWarning(warning, type)) {
    return;
  }

  return originalEmitWarning(warning, ...args);
};
