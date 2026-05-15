'use strict';

const FILTER_REQUIRE_OPTION = `--require=${__filename}`;

const knownExperimentalWarningPairs = [
  {
    commonJsModule: '/npm/node_modules/debug/src/node.js',
    esModule: '/npm/node_modules/supports-color/index.js',
  },
  {
    commonJsModule: '/@eslint/eslintrc/dist/eslintrc.cjs',
    esModule: '/svelte-eslint-parser/lib/index.js',
  },
];

const normalize = (value) => String(value || '').replaceAll('\\', '/');

function isKnownThirdPartyExperimentalWarning(message) {
  const normalizedMessage = normalize(message);

  if (
    !normalizedMessage.includes('CommonJS module') ||
    !normalizedMessage.includes('is loading ES Module') ||
    !normalizedMessage.includes('using require()')
  ) {
    return false;
  }

  return knownExperimentalWarningPairs.some(({ commonJsModule, esModule }) => {
    return (
      normalizedMessage.includes(commonJsModule) &&
      normalizedMessage.includes(esModule)
    );
  });
}

function addNodeWarningFilterToEnv(env = process.env) {
  const nextEnv = { ...env };
  const existingNodeOptions = String(nextEnv.NODE_OPTIONS || '').trim();
  const existingOptions = existingNodeOptions
    ? existingNodeOptions.split(/\s+/)
    : [];

  if (!existingOptions.includes(FILTER_REQUIRE_OPTION)) {
    existingOptions.unshift(FILTER_REQUIRE_OPTION);
  }

  nextEnv.NODE_OPTIONS = existingOptions.join(' ').trim();
  return nextEnv;
}

const originalEmitWarning = process.emitWarning.bind(process);

process.emitWarning = function emitFilteredWarning(warning, ...args) {
  const options = args.find(
    (arg) => arg && typeof arg === 'object' && !Array.isArray(arg)
  );
  const explicitType = typeof args[0] === 'string' ? args[0] : options?.type;
  const warningName =
    warning && typeof warning === 'object' && 'name' in warning
      ? warning.name
      : explicitType;
  const warningMessage =
    warning && typeof warning === 'object' && 'message' in warning
      ? warning.message
      : warning;

  if (
    warningName === 'ExperimentalWarning' &&
    isKnownThirdPartyExperimentalWarning(warningMessage)
  ) {
    return;
  }

  return originalEmitWarning(warning, ...args);
};

module.exports = {
  addNodeWarningFilterToEnv,
  isKnownThirdPartyExperimentalWarning,
};
