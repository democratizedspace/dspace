import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const warningFilterPath = path.join(
  repoRoot,
  'scripts',
  'known-node-warning-filter.cjs'
);

export function appendNodeOption(existingOptions, option) {
  const current = existingOptions || '';
  return current.includes(option)
    ? current.trim()
    : `${current} ${option}`.trim();
}

export function withKnownNodeWarningFilter(env = process.env) {
  const requireOption = `--require=${warningFilterPath}`;
  return {
    ...env,
    NODE_OPTIONS: appendNodeOption(env.NODE_OPTIONS, requireOption),
  };
}

export { warningFilterPath };
