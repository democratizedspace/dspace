import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  assertBuildMetaComplete,
  readBuildMeta,
  resolveBuildMeta,
  writeBuildMeta,
} from './write-build-meta.mjs';

const require = createRequire(import.meta.url);
const { addNodeWarningFilterToEnv } = require('./node-warning-filter.cjs');

const ignoredPatterns = [
  /Unsupported file type .*Prefix filename with an underscore/,
];

const shouldKeepLine = (line) =>
  !ignoredPatterns.some((pattern) => pattern.test(line));

const createFilteredWriter = (stream, filterOutput) => {
  if (!filterOutput) {
    return (chunk) => {
      stream.write(chunk);
    };
  }

  let buffered = '';
  return (chunk, flush = false) => {
    buffered += chunk;
    const parts = buffered.split('\n');
    buffered = parts.pop() ?? '';

    for (const line of parts) {
      if (shouldKeepLine(line)) {
        stream.write(`${line}\n`);
      }
    }

    if (flush && buffered && shouldKeepLine(buffered)) {
      stream.write(buffered);
      buffered = '';
    }
  };
};

const run = async (command, args, options = {}) => {
  const { filterOutput = false, stdio: _stdio, ...spawnOptions } = options;
  const child = spawn(command, args, {
    stdio: 'pipe',
    env: addNodeWarningFilterToEnv(process.env),
    ...spawnOptions,
  });

  const writeStdout = createFilteredWriter(process.stdout, filterOutput);
  const writeStderr = createFilteredWriter(process.stderr, filterOutput);

  child.stdout.on('data', (chunk) => {
    writeStdout(chunk.toString());
  });

  child.stderr.on('data', (chunk) => {
    writeStderr(chunk.toString());
  });

  return await new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code, signal) => {
      writeStdout('', true);
      writeStderr('', true);

      if (signal) {
        reject(new Error(`${command} exited due to signal ${signal}`));
        return;
      }

      if (code !== 0) {
        process.exit(code ?? 1);
      }

      resolve();
    });
  });
};

const { gitSha, source } = resolveBuildMeta();
process.env.VITE_GIT_SHA = gitSha;

// Only opt quest-graph debug behavior in for explicit test/debug build paths.
// PUBLIC_* values are baked into client bundles, so keep the default build opt-out.
if (
  process.env.ENABLE_QUEST_GRAPH_DEBUG_DEFAULT === 'true' &&
  !process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG
) {
  process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG = 'true';
}
try {
  await writeBuildMeta({ gitSha, source });
  const writtenMeta = await readBuildMeta();
  assertBuildMetaComplete(writtenMeta);
} catch (error) {
  console.error(
    'Failed to write build metadata to frontend/src/generated/build_meta.json',
    error
  );
  process.exit(1);
}

try {
  await run('npm', ['run', 'build:docs-rag']);
  await run('npm', ['--prefix', 'frontend', 'run', 'build'], {
    filterOutput: true,
  });
} catch (error) {
  console.error('Failed to run build commands:', error);
  process.exit(1);
}
