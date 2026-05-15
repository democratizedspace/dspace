'use strict';

const knownThirdPartyExperimentalWarningPatterns = [
  {
    requiredMessages: [
      'CommonJS module',
      ' is loading ES Module ',
      ' using require()',
      '/npm/node_modules/debug/src/node.js',
      '/npm/node_modules/supports-color/index.js',
    ],
  },
  {
    requiredMessages: [
      'CommonJS module',
      ' is loading ES Module ',
      ' using require()',
      '/@eslint/eslintrc/',
      '/svelte-eslint-parser/',
    ],
  },
];

const normalizePathSeparators = (value) => value.replaceAll('\\', '/');

const isKnownSuppressedWarning = (warning) => {
  if (warning?.name === 'ESLintRCWarning') {
    return true;
  }

  return isKnownThirdPartyExperimentalWarning(warning);
};

const isKnownThirdPartyExperimentalWarning = (warning) => {
  if (!warning || warning.name !== 'ExperimentalWarning') {
    return false;
  }

  const warningText = normalizePathSeparators(
    [warning.message, warning.stack].filter(Boolean).join('\n')
  );

  return knownThirdPartyExperimentalWarningPatterns.some(
    ({ requiredMessages }) =>
      requiredMessages.every((message) => warningText.includes(message))
  );
};

const formatWarning = (warning) => {
  if (warning && warning.stack) {
    return warning.stack;
  }

  const name = warning?.name || 'Warning';
  const message = warning?.message || String(warning);
  return `${name}: ${message}`;
};

process.on('warning', (warning) => {
  if (isKnownSuppressedWarning(warning)) {
    return;
  }

  process.stderr.write(`${formatWarning(warning)}\n`);
});
