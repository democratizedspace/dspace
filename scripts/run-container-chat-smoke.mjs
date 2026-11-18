#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  parseAndValidateArgs,
  publishResult,
} from './run-remote-chat-smoke.mjs';

export function nativePlatform(info, image) {
  const architectures = {
    x86_64: 'amd64',
    amd64: 'amd64',
    aarch64: 'arm64',
    arm64: 'arm64',
  };
  const arch = architectures[info.Architecture];
  if (info.OSType !== 'linux' || !arch)
    throw new Error(
      'requires native Linux amd64 or arm64 Docker daemon (ARM32 unsupported)'
    );
  if (image.Os !== 'linux' || image.Architecture !== arch)
    throw new Error(
      'image architecture must match daemon; implicit emulation is forbidden'
    );
  return `linux/${arch}`;
}

export function containerArgs(options, revision) {
  if (options.runnerRevision && options.runnerRevision !== revision)
    throw new Error('runner revision differs from image provenance');
  if (!/^[0-9a-f]{40}$/.test(revision || ''))
    throw new Error('image lacks full runner revision label');
  if (new URL(options.baseURL).protocol !== 'https:')
    throw new Error('container smoke requires HTTPS');
  const fields = {
    baseURL: 'base-url',
    expectedVersion: 'expected-version',
    expectedRevision: 'expected-revision',
    expectedImageDigest: 'expected-image-digest',
    identityContract: 'identity-contract',
    providerConfigContract: 'provider-config-contract',
    expectedProvider: 'expected-provider',
    expectedTokenPlaceOrigin: 'expected-token-place-origin',
    expectedTokenPlaceModel: 'expected-token-place-model',
  };
  return [
    ...Object.entries(fields).flatMap(([key, flag]) =>
      options[key] ? [`--${flag}`, options[key]] : []
    ),
    '--result-file',
    '/artifacts/result.json',
    '--runner-revision',
    revision,
  ];
}

export function validProof(proof, revision, started, code) {
  return (
    proof.schemaVersion === 1 &&
    proof.journey === '/chat' &&
    proof.runnerRevision === revision &&
    proof.transport === 'intercepted' &&
    proof.mutationEnabled === false &&
    proof.passed === (code === 0) &&
    Number.isInteger(proof.executedAt) &&
    proof.executedAt >= started &&
    proof.executedAt <= Math.floor(Date.now() / 1000) + 2
  );
}

function docker(args) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    timeout: 30_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function attach(
  name,
  timeout,
  { spawnImpl = spawn, dockerImpl = docker, signals = process } = {}
) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl('docker', ['start', '--attach', name], {
      stdio: 'inherit',
    });
    let interrupted;
    const stop = (code) => {
      if (interrupted) return;
      interrupted = code;
      try {
        dockerImpl(['rm', '--force', name]);
      } catch {
        /* finally retries cleanup */
      }
      child.kill('SIGKILL');
    };
    const onTerm = () => stop(143);
    const onInt = () => stop(130);
    signals.on('SIGTERM', onTerm);
    signals.on('SIGINT', onInt);
    const timer = setTimeout(() => stop(124), timeout);
    const cleanup = () => {
      clearTimeout(timer);
      signals.off('SIGTERM', onTerm);
      signals.off('SIGINT', onInt);
    };
    child.once('error', (error) => {
      cleanup();
      reject(error);
    });
    child.once('close', (code) => {
      cleanup();
      resolve(interrupted || code || 0);
    });
  });
}

export async function runContainer(
  argv,
  env = process.env,
  io = { docker, attach }
) {
  // Only contract inputs are read by the existing strict parser. No host env is
  // passed to the container (including API keys, NODE_OPTIONS, and fault hooks).
  const options = parseAndValidateArgs(argv, {
    ...env,
    DSPACE_REMOTE_CHAT_SMOKE_FAULT: '',
  });
  if (options.resultFile)
    await unlink(options.resultFile).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  if (!env.DSPACE_SMOKE_IMAGE || env.DSPACE_SMOKE_IMAGE.startsWith('-'))
    throw new Error('set DSPACE_SMOKE_IMAGE to an already built local image');
  const timeout = Number(env.DSPACE_SMOKE_TIMEOUT_MS || 240000);
  if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 1800000)
    throw new Error('timeout must be 1000..1800000 ms');
  const info = JSON.parse(io.docker(['info', '--format', '{{json .}}']));
  const image = JSON.parse(
    io.docker(['image', 'inspect', env.DSPACE_SMOKE_IMAGE])
  )[0];
  const platform = nativePlatform(info, image);
  const revision = image.Config.Labels?.['org.opencontainers.image.revision'];
  const args = containerArgs(options, revision);
  const name = `dspace-smoke-${randomUUID()}`;
  const directory = await mkdtemp(join(tmpdir(), 'dspace-container-smoke-'));
  const started = Math.floor(Date.now() / 1000);
  try {
    console.log(
      `[container-smoke] image=${image.Id} runnerRevision=${revision} platform=${platform}`
    );
    io.docker([
      'create',
      '--pull=never',
      '--name',
      name,
      '--platform',
      platform,
      '--init',
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges',
      '--tmpfs',
      '/tmp:rw,nosuid,nodev,size=512m,mode=1777',
      '--shm-size=256m',
      image.Id,
      ...args,
    ]);
    const attached = await io.attach(name, timeout);
    if ([124, 130, 143].includes(attached)) return attached;
    const state = JSON.parse(
      io.docker(['inspect', '--format', '{{json .State}}', name])
    );
    if (state.Running || !Number.isInteger(state.ExitCode))
      throw new Error('container did not finish');
    const code = state.ExitCode || attached;
    // Copy a fresh result only; no host directories or sockets are mounted.
    try {
      io.docker([
        'cp',
        `${name}:/artifacts/result.json`,
        join(directory, 'result.json'),
      ]);
      const proof = JSON.parse(
        await readFile(join(directory, 'result.json'), 'utf8')
      );
      if (!validProof(proof, revision, started, code))
        throw new Error('invalid completion proof');
      if (options.resultFile)
        await publishResult(
          options.resultFile,
          revision,
          code === 0,
          () => proof.executedAt * 1000
        );
    } catch (error) {
      console.error(
        `[container-smoke] completion proof unavailable: ${error.message}`
      );
      return code || 1;
    }
    return code;
  } finally {
    try {
      io.docker(['rm', '--force', name]);
    } catch (error) {
      // Timeout/signal cleanup may have already removed this unique container.
      if (!String(error.stderr || error.message).includes('No such container'))
        throw error;
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await runContainer(process.argv.slice(2));
  } catch (error) {
    console.error(`[container-smoke] ${error.message}`);
    process.exitCode = 2;
  }
}
